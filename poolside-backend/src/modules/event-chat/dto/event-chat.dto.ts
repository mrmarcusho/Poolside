import { IsString, IsOptional, MinLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SendEventMessageDto {
  @IsString()
  @MinLength(1)
  text: string;
}

export class EventMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsString()
  @IsOptional()
  before?: string; // ISO date string for cursor pagination
}
