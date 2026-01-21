import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private readonly MAGIC_LINK_EXPIRY_MINUTES = 15;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        name: dto.name,
        emoji: dto.emoji || '👤',
      },
      select: {
        id: true,
        email: true,
        name: true,
        emoji: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // User might not have a password if they signed up via magic link
    if (!user.password) {
      throw new UnauthorizedException('Please use magic link to sign in');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update online status
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emoji: user.emoji,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeen: new Date() },
    });

    return { success: true };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const tokens = await this.generateTokens(payload.sub, payload.email);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // TODO: Generate reset token and send email
    // For now, just return success message
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: Implement token verification
    throw new BadRequestException('Password reset not implemented yet');
  }

  // ==================== MAGIC LINK AUTH ====================

  async sendMagicLink(email: string) {
    const normalizedEmail = email.toLowerCase();

    // TODO: Re-enable in production
    // Validate @tufts.edu domain
    // if (!normalizedEmail.endsWith('@tufts.edu')) {
    //   throw new BadRequestException('Please use your @tufts.edu email address');
    // }

    // Invalidate any existing unused tokens for this email
    await this.prisma.magicLinkToken.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Generate secure 64-char hex token (256-bit entropy)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + this.MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
    );

    // Store token in database
    await this.prisma.magicLinkToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    // Send email via Resend
    await this.emailService.sendMagicLink(normalizedEmail, token);

    return {
      message: 'Magic link sent!',
      expiresAt,
    };
  }

  async verifyMagicLink(token: string) {
    // Find token in database
    const magicLinkToken = await this.prisma.magicLinkToken.findUnique({
      where: { token },
    });

    if (!magicLinkToken) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    // Check if already used
    if (magicLinkToken.used) {
      throw new UnauthorizedException('This magic link has already been used');
    }

    // Check if expired
    if (new Date() > magicLinkToken.expiresAt) {
      throw new UnauthorizedException('This magic link has expired');
    }

    // Mark token as used
    await this.prisma.magicLinkToken.update({
      where: { id: magicLinkToken.id },
      data: { used: true },
    });

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: magicLinkToken.email },
    });

    if (!user) {
      // Extract name from email (first.last@tufts.edu → First Last)
      const emailPrefix = magicLinkToken.email.split('@')[0];
      const nameParts = emailPrefix.split('.');
      const name = nameParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      user = await this.prisma.user.create({
        data: {
          email: magicLinkToken.email,
          name,
          emailVerified: true,
          school: 'Tufts University',
        },
      });
    } else {
      // Update existing user as verified
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, isOnline: true, lastSeen: new Date() },
      });
    }

    // Generate JWT tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emoji: user.emoji,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '1d' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }
}
