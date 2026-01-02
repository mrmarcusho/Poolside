import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/friends.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Friends')
@Controller('me/friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'List friends' })
  async getFriends(@CurrentUser('id') userId: string) {
    return this.friendsService.getFriends(userId);
  }

  @Post('request')
  @ApiOperation({ summary: 'Send friend request' })
  async sendFriendRequest(
    @Body() dto: SendFriendRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.friendsService.sendFriendRequest(userId, dto.userId);
  }

  @Get('requests')
  @ApiOperation({ summary: 'List pending friend requests' })
  async getPendingRequests(@CurrentUser('id') userId: string) {
    return this.friendsService.getPendingRequests(userId);
  }

  @Post('requests/:id/accept')
  @ApiOperation({ summary: 'Accept friend request' })
  async acceptFriendRequest(
    @Param('id') requestId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.friendsService.acceptFriendRequest(requestId, userId);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Reject friend request' })
  async rejectFriendRequest(
    @Param('id') requestId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.friendsService.rejectFriendRequest(requestId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove friend' })
  async removeFriend(
    @Param('id') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.friendsService.removeFriend(friendId, userId);
  }
}
