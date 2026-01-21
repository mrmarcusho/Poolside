import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Pool Party at Deck 7' })
  @IsString()
  @MinLength(1)
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

  @ApiProperty({ required: false, example: 10, description: 'Max capacity (null = unlimited)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  spots?: number;

  @ApiProperty({ required: false, example: 180, description: 'Duration in minutes to show event on feed (30-180)' })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(180)
  displayDuration?: number;

  @ApiProperty({ required: false, enum: ['DRAFT', 'PUBLISHED'], description: 'Event status' })
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: string;

  @ApiProperty({ required: false, description: 'Enable waitlist when event is full' })
  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;

  @ApiProperty({ required: false, description: 'Hide location & time from non-attendees when full' })
  @IsOptional()
  @IsBoolean()
  hideDetailsWhenFull?: boolean;
}

export class UpdateEventDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
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

  @ApiProperty({ required: false, example: 10, description: 'Max capacity (null = unlimited)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  spots?: number;

  @ApiProperty({ required: false, example: 180, description: 'Duration in minutes to show event on feed (30-180)' })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(180)
  displayDuration?: number;

  @ApiProperty({ required: false, description: 'Enable waitlist when event is full' })
  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;

  @ApiProperty({ required: false, description: 'Hide location & time from non-attendees when full' })
  @IsOptional()
  @IsBoolean()
  hideDetailsWhenFull?: boolean;
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

  @ApiProperty({ required: false, enum: ['DRAFT', 'PUBLISHED'], description: 'Filter by event status' })
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: string;
}
