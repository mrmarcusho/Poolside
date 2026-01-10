import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private parseInterests(interests: string | null): { emoji: string; label: string }[] | null {
    if (!interests) return null;
    try {
      return JSON.parse(interests);
    } catch {
      return null;
    }
  }

  private parsePhotos(photos: string | null): string[] | null {
    if (!photos) return null;
    try {
      return JSON.parse(photos);
    } catch {
      return null;
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emoji: true,
        avatar: true,
        bio: true,
        age: true,
        location: true,
        school: true,
        interests: true,
        photos: true,
        profileTheme: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      interests: this.parseInterests(user.interests),
      photos: this.parsePhotos(user.photos),
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    // Convert interests and photos arrays to JSON strings for storage
    const data: any = { ...dto };
    if (dto.interests !== undefined) {
      data.interests = JSON.stringify(dto.interests);
    }
    if (dto.photos !== undefined) {
      data.photos = JSON.stringify(dto.photos);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        emoji: true,
        avatar: true,
        bio: true,
        age: true,
        location: true,
        school: true,
        interests: true,
        photos: true,
        profileTheme: true,
        createdAt: true,
      },
    });

    return {
      ...user,
      interests: this.parseInterests(user.interests),
      photos: this.parsePhotos(user.photos),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        emoji: true,
        avatar: true,
        bio: true,
        age: true,
        location: true,
        school: true,
        interests: true,
        photos: true,
        profileTheme: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      interests: this.parseInterests(user.interests),
      photos: this.parsePhotos(user.photos),
    };
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 1) {
      return [];
    }

    // SQLite doesn't support mode: 'insensitive', so we use raw query with LOWER()
    // Table name is 'users' (from @@map in Prisma schema)
    const users = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        emoji: string | null;
        avatar: string | null;
        isOnline: boolean;
        lastSeen: Date;
      }>
    >`
      SELECT id, name, emoji, avatar, isOnline, lastSeen
      FROM users
      WHERE id != ${currentUserId}
      AND LOWER(name) LIKE LOWER(${'%' + query + '%'})
      ORDER BY name ASC
      LIMIT 20
    `;

    return users;
  }

  async getUserEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: { hostId: userId },
      orderBy: { dateTime: 'desc' },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    });

    return events.map((event) => ({
      ...event,
      rsvpCount: event._count.rsvps,
      _count: undefined,
    }));
  }
}
