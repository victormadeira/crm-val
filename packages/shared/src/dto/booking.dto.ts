import { z } from "zod";
import { BOOKING_STATUSES } from "../enums";

export const CreateBookingInputSchema = z.object({
  leadId: z.string().uuid().optional(),
  title: z.string().min(1).max(240),
  eventDate: z.coerce.date(),
  numParticipants: z.number().int().min(1).max(10_000),
  notes: z.string().max(2000).optional(),
  status: z.enum(BOOKING_STATUSES).default("TENTATIVE"),
});
export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;

export const UpdateBookingInputSchema = CreateBookingInputSchema.partial();
export type UpdateBookingInput = z.infer<typeof UpdateBookingInputSchema>;

export const CapacityQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});
export type CapacityQuery = z.infer<typeof CapacityQuerySchema>;
