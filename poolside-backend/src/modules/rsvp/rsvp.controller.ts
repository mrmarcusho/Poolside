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
import { EventChatGateway } from '../event-chat/event-chat.gateway';

@ApiTags('RSVP')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RsvpController {
  constructor(
    private rsvpService: RsvpService,
    private eventChatGateway: EventChatGateway,
  ) {}

  @Post('events/:id/rsvp')
  @ApiOperation({ summary: 'RSVP to an event' })
  async createRsvp(
    @Param('id') eventId: string,
    @Body() dto: CreateRsvpDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.rsvpService.createRsvp(eventId, userId, dto.status);

    // Broadcast RSVP update to all connected clients
    this.eventChatGateway.broadcastRsvpUpdate({
      eventId: result.eventId,
      rsvpCount: result.rsvpCount,
      isFull: result.isFull,
      spots: result.spots,
      userId, // Include who triggered the RSVP
    });

    return result;
  }

  @Delete('events/:id/rsvp')
  @ApiOperation({ summary: 'Remove RSVP from event' })
  async removeRsvp(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.rsvpService.removeRsvp(eventId, userId);

    // Broadcast RSVP update to all connected clients
    this.eventChatGateway.broadcastRsvpUpdate({
      eventId: result.eventId,
      rsvpCount: result.rsvpCount,
      isFull: result.isFull,
      spots: result.spots,
      userId, // Include who triggered the RSVP
    });

    return result;
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
