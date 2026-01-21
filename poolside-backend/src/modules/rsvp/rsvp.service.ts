import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RsvpStatusEnum } from './dto/rsvp.dto';

@Injectable()
export class RsvpService {
  constructor(private prisma: PrismaService) {}

  async createRsvp(eventId: string, userId: string, status: RsvpStatusEnum) {
    // Check if event exists and get current RSVP count
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            rsvps: {
              where: { status: 'GOING' },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event is full (only for GOING status)
    if (status === RsvpStatusEnum.GOING && event.spots !== null) {
      const currentGoing = event._count.rsvps;

      // Check if user already has a GOING RSVP (they're updating, not taking a new spot)
      const existingRsvp = await this.prisma.rsvp.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      const isAlreadyGoing = existingRsvp?.status === 'GOING';

      // Only reject if they're trying to take a NEW spot and event is full
      if (!isAlreadyGoing && currentGoing >= event.spots) {
        throw new BadRequestException('Event is full');
      }
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

    // Check if event is now full
    const isFull = event.spots !== null && counts.going >= event.spots;

    return {
      eventId,
      status: rsvp.status.toLowerCase(),
      rsvpCount: counts,
      isFull,
      spots: event.spots,
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

    // Check if event is now full
    const isFull = event.spots !== null && counts.going >= event.spots;

    return {
      eventId,
      status: null,
      rsvpCount: counts,
      isFull,
      spots: event.spots,
    };
  }

  async getMyRsvps(userId: string, status?: RsvpStatusEnum) {
    const rsvps = await this.prisma.rsvp.findMany({
      where: {
        userId,
        // Exclude events where the user is the host (only show RSVPs to other users' events)
        event: { hostId: { not: userId } },
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
