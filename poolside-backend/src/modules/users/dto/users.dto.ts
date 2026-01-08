import { IsString, IsOptional, MinLength, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(13)
  @Max(120)
  @Type(() => Number)
  age?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  school?: string;

  @ApiProperty({ required: false, type: [Object] })
  @IsArray()
  @IsOptional()
  interests?: { emoji: string; label: string }[];

  @ApiProperty({ required: false, enum: ['pool_water', 'flames', 'marble'] })
  @IsString()
  @IsOptional()
  profileTheme?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  emoji: string;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ nullable: true })
  age: number | null;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty({ nullable: true })
  school: string | null;

  @ApiProperty({ nullable: true, type: [Object] })
  interests: { emoji: string; label: string }[] | null;

  @ApiProperty({ enum: ['pool_water', 'flames', 'marble'] })
  profileTheme: string;

  @ApiProperty()
  createdAt: Date;
}
