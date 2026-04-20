import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  CapacityQuerySchema,
  CreateBookingInputSchema,
  UpdateBookingInputSchema,
  type CapacityQuery,
  type CreateBookingInput,
  type UpdateBookingInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { BookingsService } from "./bookings.service";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  create(
    @Body(new ZodValidationPipe(CreateBookingInputSchema))
    body: CreateBookingInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.bookings.create(body, auth);
  }

  @Get()
  list(
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.bookings.list(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
  }

  @Get("capacity")
  capacity(
    @Query(new ZodValidationPipe(CapacityQuerySchema)) q: CapacityQuery
  ) {
    return this.bookings.capacity(q);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.bookings.getById(id);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateBookingInputSchema))
    body: UpdateBookingInput
  ) {
    return this.bookings.update(id, body);
  }

  @Delete(":id")
  @Roles("ADMIN", "SUPERVISOR")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.bookings.remove(id);
  }
}
