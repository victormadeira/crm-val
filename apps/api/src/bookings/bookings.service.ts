import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CapacityQuery,
  CreateBookingInput,
  UpdateBookingInput,
} from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import type { AuthContext } from "../auth/auth.types";

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(input: CreateBookingInput, auth: AuthContext) {
    const booking = await this.prisma.scoped.booking.create({
      data: scopedData({
        leadId: input.leadId ?? null,
        title: input.title,
        eventDate: input.eventDate,
        numParticipants: input.numParticipants,
        notes: input.notes ?? null,
        status: input.status,
      }),
      select: { id: true },
    });

    if (input.leadId) {
      await this.prisma.scoped.leadEvent.create({
        data: {
          leadId: input.leadId,
          kind: "BOOKING_CREATED",
          actorId: auth.userId,
          payload: {
            bookingId: booking.id,
            eventDate: input.eventDate.toISOString(),
            numParticipants: input.numParticipants,
            status: input.status,
          } as Prisma.InputJsonValue,
        },
      });
    }

    await this.audit.record({
      action: "booking.create",
      entity: "Booking",
      entityId: booking.id,
    });

    return booking;
  }

  async list(from?: Date, to?: Date) {
    const where: Prisma.BookingWhereInput = {};
    if (from || to) {
      where.eventDate = {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      };
    }
    return this.prisma.scoped.booking.findMany({
      where,
      orderBy: { eventDate: "asc" },
      include: { lead: { select: { id: true, name: true } } },
      take: 500,
    });
  }

  async getById(id: string) {
    const b = await this.prisma.scoped.booking.findUnique({
      where: { id },
      include: { lead: { select: { id: true, name: true, phoneE164: true } } },
    });
    if (!b) throw new NotFoundException("Booking não encontrada");
    return b;
  }

  async update(id: string, patch: UpdateBookingInput) {
    const existing = await this.prisma.scoped.booking.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Booking não encontrada");

    await this.prisma.scoped.booking.update({
      where: { id },
      data: {
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.eventDate !== undefined && { eventDate: patch.eventDate }),
        ...(patch.numParticipants !== undefined && {
          numParticipants: patch.numParticipants,
        }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.leadId !== undefined && { leadId: patch.leadId ?? null }),
      },
    });

    await this.audit.record({
      action: "booking.update",
      entity: "Booking",
      entityId: id,
      metadata: { fields: Object.keys(patch) },
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.scoped.booking.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Booking não encontrada");
    await this.prisma.scoped.booking.delete({ where: { id } });
    await this.audit.record({
      action: "booking.delete",
      entity: "Booking",
      entityId: id,
    });
  }

  /**
   * Agregação diária — participantes confirmados e tentativos por dia.
   * Usado no dashboard pra prever capacidade do parque.
   */
  async capacity(q: CapacityQuery) {
    const rows = await this.prisma.scoped.booking.findMany({
      where: {
        eventDate: { gte: q.from, lte: q.to },
        status: { in: ["CONFIRMED", "TENTATIVE"] },
      },
      select: {
        eventDate: true,
        numParticipants: true,
        status: true,
      },
    });

    const map = new Map<
      string,
      { date: string; confirmed: number; tentative: number; total: number }
    >();
    for (const r of rows) {
      const key = r.eventDate.toISOString().slice(0, 10);
      const cur = map.get(key) ?? {
        date: key,
        confirmed: 0,
        tentative: 0,
        total: 0,
      };
      if (r.status === "CONFIRMED") cur.confirmed += r.numParticipants;
      else cur.tentative += r.numParticipants;
      cur.total = cur.confirmed + cur.tentative;
      map.set(key, cur);
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
