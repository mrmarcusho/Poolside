import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SendMagicLinkDto,
  VerifyMagicLinkDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ==================== MAGIC LINK AUTH ====================

  @Post('send-magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send magic link to @tufts.edu email' })
  async sendMagicLink(@Body() dto: SendMagicLinkDto) {
    return this.authService.sendMagicLink(dto.email);
  }

  @Post('verify-magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify magic link token and get JWT tokens' })
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(dto.token);
  }

  @Get('open-app')
  @ApiOperation({ summary: 'Redirect page that opens the app with magic link token' })
  openApp(@Query('token') token: string, @Res() res: Response) {
    const appUrl = `jumbohq://verify?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening JumboHQ...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px 20px;
    }
    .emoji { font-size: 64px; margin-bottom: 24px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #a0a0a0; margin-bottom: 24px; }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #ff6b4a 0%, #8b5cf6 100%);
      color: white;
      text-decoration: none;
      font-weight: 600;
      border-radius: 50px;
      box-shadow: 0 4px 16px rgba(255, 107, 74, 0.3);
    }
    .note { margin-top: 24px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="emoji">🐘</div>
    <h1>Opening JumboHQ...</h1>
    <p>If the app doesn't open automatically, tap the button below.</p>
    <a href="${appUrl}" class="button">Open JumboHQ</a>
    <p class="note">Make sure you have the app installed.</p>
  </div>
  <script>
    // Try to open the app automatically
    window.location.href = "${appUrl}";
  </script>
</body>
</html>
    `;

    res.type('html').send(html);
  }
}
