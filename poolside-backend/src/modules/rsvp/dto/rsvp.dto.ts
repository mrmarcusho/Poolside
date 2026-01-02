import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RsvpStatusEnum {
  GOING = 'going',
  INTERESTED = 'interested',
}

export class CreateRsvpDto {
  @ApiProperty({ enum: RsvpStatusEnum })
  @IsEnum(RsvpStatusEnum)
  status: RsvpStatusEnum;
}

export class RsvpQueryDto {
  @ApiProperty({ required: false, enum: RsvpStatusEnum })
  @IsEnum(RsvpStatusEnum)
  @IsOptional()
  status?: RsvpStatusEnum;
}
