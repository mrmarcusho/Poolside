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
import { MessagesService } from './messages.service';
import {
  CreateConversationDto,
  SendMessageDto,
  MessagesQueryDto,
} from './dto/messages.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messages')
@Controller('me/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.messagesService.getConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get messages in conversation' })
  async getMessages(
    @Param('id') conversationId: string,
    @Query() query: MessagesQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      userId,
      query.limit,
      query.before,
    );
  }

  @Post('conversations/:id')
  @ApiOperation({ summary: 'Send message' })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.sendMessage(conversationId, userId, dto.text);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create conversation and send first message' })
  async createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.createConversation(
      userId,
      dto.userId,
      dto.message,
    );
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.markAsRead(conversationId, userId);
  }
}
