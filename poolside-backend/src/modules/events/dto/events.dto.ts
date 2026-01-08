import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Pool Party at Deck 7' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Short description...' })
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventImage?: string;

  @ApiProperty({ example: 'Main Pool' })
  @IsString()
  locationName: string;

  @ApiProperty({ required: false, example: 'Deck 7, Forward' })
  @IsOptional()
  @IsString()
  locationDeck?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationImage?: string;

  @ApiProperty({ example: '2025-01-16T15:00:00Z' })
  @IsDateString()
  dateTime: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

export class UpdateEventDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationDeck?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

export class EventQueryDto {
  @ApiProperty({ required: false, enum: ['today', 'tomorrow', 'this-week'] })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  hostId?: string;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cursor?: string;
}
