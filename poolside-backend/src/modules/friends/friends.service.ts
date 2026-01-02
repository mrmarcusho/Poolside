import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
            isOnline: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
    });

    return {
      friends: friendships.map((f) => {
        const friend = f.user1Id === userId ? f.user2 : f.user1;
        return {
          ...friend,
          friendsSince: f.createdAt,
        };
      }),
    };
  }

  async sendFriendRequest(fromId: string, toId: string) {
    if (fromId === toId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if user exists
    const toUser = await this.prisma.user.findUnique({
      where: { id: toId },
      select: { id: true, name: true },
    });

    if (!toUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already friends
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: fromId, user2Id: toId },
          { user1Id: toId, user2Id: fromId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictException('Already friends');
    }

    // Check if request already exists
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromId, toId },
          { fromId: toId, toId: fromId },
        ],
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new ConflictException('Friend request already exists');
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        fromId,
        toId,
      },
      include: {
        to: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      requestId: request.id,
      toUser: request.to,
      status: 'pending',
      createdAt: request.createdAt,
    };
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        toId: userId,
        status: 'PENDING',
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      requests: requests.map((r) => ({
        id: r.id,
        from: r.from,
        createdAt: r.createdAt,
      })),
    };
  }

  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.toId !== userId) {
      throw new BadRequestException('Cannot accept this request');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request already processed');
    }

    // Update request and create friendship
    await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.friendship.create({
        data: {
          user1Id: request.fromId,
          user2Id: request.toId,
        },
      }),
    ]);

    return { success: true };
  }

  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.toId !== userId) {
      throw new BadRequestException('Cannot reject this request');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { success: true };
  }

  async removeFriend(friendId: string, userId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { success: true };
  }
}
