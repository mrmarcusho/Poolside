import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RsvpService } from './rsvp.service';
import { CreateRsvpDto, RsvpQueryDto } from './dto/rsvp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('RSVP')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RsvpController {
  constructor(private rsvpService: RsvpService) {}

  @Post('events/:id/rsvp')
  @ApiOperation({ summary: 'RSVP to an event' })
  async createRsvp(
    @Param('id') eventId: string,
    @Body() dto: CreateRsvpDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rsvpService.createRsvp(eventId, userId, dto.status);
  }

  @Delete('events/:id/rsvp')
  @ApiOperation({ summary: 'Remove RSVP from event' })
  async removeRsvp(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rsvpService.removeRsvp(eventId, userId);
  }

  @Get('me/rsvps')
  @ApiOperation({ summary: 'Get current user RSVPs' })
  async getMyRsvps(
    @Query() query: RsvpQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rsvpService.getMyRsvps(userId, query.status);
  }
}
