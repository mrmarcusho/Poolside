import { Module } from '@nestjs/common';
import { EventChatController } from './event-chat.controller';
import { EventChatService } from './event-chat.service';
import { EventChatGateway } from './event-chat.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventChatController],
  providers: [EventChatService, EventChatGateway],
  exports: [EventChatService, EventChatGateway],
})
export class EventChatModule {}
