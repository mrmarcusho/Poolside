import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RsvpStatusEnum } from './dto/rsvp.dto';

@Injectable()
export class RsvpService {
  constructor(private prisma: PrismaService) {}

  async createRsvp(eventId: string, userId: string, status: RsvpStatusEnum) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Upsert RSVP
    const rsvp = await this.prisma.rsvp.upsert({
      where: {
        userId_eventId: { userId, eventId },
      },
      create: {
        userId,
        eventId,
        status: status.toUpperCase(),
      },
      update: {
        status: status.toUpperCase(),
      },
    });

    // Get updated counts
    const counts = await this.getRsvpCounts(eventId);

    return {
      eventId,
      status: rsvp.status.toLowerCase(),
      rsvpCount: counts,
    };
  }

  async removeRsvp(eventId: string, userId: string) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Delete RSVP if exists
    await this.prisma.rsvp.deleteMany({
      where: { userId, eventId },
    });

    // Get updated counts
    const counts = await this.getRsvpCounts(eventId);

    return {
      eventId,
      status: null,
      rsvpCount: counts,
    };
  }

  async getMyRsvps(userId: string, status?: RsvpStatusEnum) {
    const rsvps = await this.prisma.rsvp.findMany({
      where: {
        userId,
        ...(status && { status: status.toUpperCase() }),
      },
      include: {
        event: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                emoji: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        event: { dateTime: 'asc' },
      },
    });

    return {
      rsvps: rsvps.map((rsvp) => ({
        event: {
          id: rsvp.event.id,
          title: rsvp.event.title,
          eventImage: rsvp.event.eventImage,
          locationName: rsvp.event.locationName,
          locationDeck: rsvp.event.locationDeck,
          dateTime: rsvp.event.dateTime,
          host: rsvp.event.host,
        },
        status: rsvp.status.toLowerCase(),
        rsvpAt: rsvp.createdAt,
      })),
    };
  }

  private async getRsvpCounts(eventId: string) {
    const [goingCount, interestedCount] = await Promise.all([
      this.prisma.rsvp.count({
        where: { eventId, status: 'GOING' },
      }),
      this.prisma.rsvp.count({
        where: { eventId, status: 'INTERESTED' },
      }),
    ]);

    return {
      going: goingCount,
      interested: interestedCount,
    };
  }
}
