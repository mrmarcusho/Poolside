import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '👨', required: false })
  @IsString()
  @IsOptional()
  emoji?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    emoji: string;
    avatar: string | null;
    createdAt: Date;
  };

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

// Magic Link DTOs
export class SendMagicLinkDto {
  @ApiProperty({ example: 'marcus.ho@tufts.edu' })
  @IsEmail()
  email: string;
}

export class VerifyMagicLinkDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  token: string;
}

export class MagicLinkSentResponseDto {
  @ApiProperty({ example: 'Magic link sent!' })
  message: string;

  @ApiProperty({ example: '2025-01-15T12:15:00.000Z' })
  expiresAt: Date;
}
