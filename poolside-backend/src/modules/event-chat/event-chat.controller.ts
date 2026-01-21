import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventChatService } from './event-chat.service';
import { SendEventMessageDto, EventMessagesQueryDto } from './dto/event-chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Event Chat')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventChatController {
  constructor(private eventChatService: EventChatService) {}

  @Get('me/event-chats')
  @ApiOperation({ summary: 'List all event chats for current user' })
  async getEventChats(@CurrentUser('id') userId: string) {
    return this.eventChatService.getEventChats(userId);
  }

  @Get('events/:id/chat')
  @ApiOperation({ summary: 'Get event chat info' })
  async getEventChatInfo(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventChatService.getEventChatInfo(eventId, userId);
  }

  @Get('events/:id/chat/messages')
  @ApiOperation({ summary: 'Get messages for an event chat' })
  async getEventMessages(
    @Param('id') eventId: string,
    @Query() query: EventMessagesQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventChatService.getEventMessages(
      eventId,
      userId,
      query.limit,
      query.before,
    );
  }

  @Post('events/:id/chat/messages')
  @ApiOperation({ summary: 'Send message to event chat' })
  async sendEventMessage(
    @Param('id') eventId: string,
    @Body() dto: SendEventMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventChatService.sendEventMessage(eventId, userId, dto.text);
  }

  @Post('events/:id/chat/read')
  @ApiOperation({ summary: 'Mark event chat as read' })
  async markEventChatAsRead(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventChatService.markEventChatAsRead(eventId, userId);
  }
}
