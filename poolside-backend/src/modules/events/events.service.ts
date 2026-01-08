import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async getEvents(query: EventQueryDto, userId: string) {
    const { date, location, hostId, limit = 20, cursor } = query;

    // Build date filter
    let dateFilter = {};
    if (date) {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      if (date === 'today') {
        dateFilter = {
          dateTime: {
            gte: today,
            lt: tomorrow,
          },
        };
      } else if (date === 'tomorrow') {
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        dateFilter = {
          dateTime: {
            gte: tomorrow,
            lt: dayAfter,
          },
        };
      } else if (date === 'this-week') {
        dateFilter = {
          dateTime: {
            gte: today,
            lt: nextWeek,
          },
        };
      }
    }

    const events = await this.prisma.event.findMany({
      where: {
        ...dateFilter,
        ...(location && { locationDeck: { contains: location } }),
        ...(hostId && { hostId }),
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        rsvps: {
          where: { userId },
          select: { status: true },
        },
        _count: {
          select: { rsvps: true },
        },
      },
    });

    const hasMore = events.length > limit;
    const results = hasMore ? events.slice(0, -1) : events;

    // Get total count
    const total = await this.prisma.event.count();

    return {
      events: results.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        fullDescription: event.fullDescription,
        eventImage: event.eventImage,
        locationName: event.locationName,
        locationDeck: event.locationDeck,
        dateTime: event.dateTime,
        endTime: event.endTime,
        host: event.host,
        rsvpCount: {
          going: event._count.rsvps, // Simplified - would need aggregation for accurate counts
          interested: 0,
        },
        myRsvp: event.rsvps[0]?.status?.toLowerCase() || null,
        createdAt: event.createdAt,
      })),
      nextCursor: hasMore ? results[results.length - 1].id : null,
      hasMore,
      total,
    };
  }

  async getEventById(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            emoji: true,
            avatar: true,
          },
        },
        rsvps: {
          include: {
            user: {
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
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const goingRsvps = event.rsvps.filter((r) => r.status === 'GOING');
    const interestedRsvps = event.rsvps.filter((r) => r.status === 'INTERESTED');
    const myRsvp = event.rsvps.find((r) => r.userId === userId);

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      fullDescription: event.fullDescription,
      eventImage: event.eventImage,
      locationName: event.locationName,
      locationDeck: event.locationDeck,
      locationImage: event.locationImage,
      dateTime: event.dateTime,
      endTime: event.endTime,
      host: event.host,
      rsvpCount: {
        going: goingRsvps.length,
        interested: interestedRsvps.length,
      },
      myRsvp: myRsvp?.status?.toLowerCase() || null,
      attendees: {
        going: goingRsvps.map((r) => r.user),
        interested: interestedRsvps.map((r) => r.user),
      },
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  async createEvent(dto: CreateEventDto, hostId: string) {
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        dateTime: new Date(dto.dateTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        hostId,
      },
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
    });

    return event;
  }

  async updateEvent(id: string, dto: UpdateEventDto, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.hostId !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dateTime && { dateTime: new Date(dto.dateTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
      },
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
    });

    return updated;
  }

  async deleteEvent(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.hostId !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.prisma.event.delete({ where: { id } });

    return { success: true };
  }

  async getEventAttendees(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        rsvps: {
          include: {
            user: {
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
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      going: event.rsvps
        .filter((r) => r.status === 'GOING')
        .map((r) => r.user),
      interested: event.rsvps
        .filter((r) => r.status === 'INTERESTED')
        .map((r) => r.user),
    };
  }
}
