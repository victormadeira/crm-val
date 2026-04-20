import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  CreateLandingPageSchema,
  UpdateLandingPageSchema,
  type CreateLandingPageInput,
  type UpdateLandingPageInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { LandingsService } from "./landings.service";

@Controller("landings")
export class LandingsController {
  constructor(private readonly landings: LandingsService) {}

  @Get()
  list() {
    return this.landings.list();
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.landings.get(id);
  }

  @Post()
  @Roles("ADMIN", "SUPERVISOR", "MARKETING")
  create(
    @Body(new ZodValidationPipe(CreateLandingPageSchema))
    body: CreateLandingPageInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.landings.create(body, auth);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPERVISOR", "MARKETING")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateLandingPageSchema))
    body: UpdateLandingPageInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.landings.update(id, body, auth);
  }

  @Delete(":id")
  @Roles("ADMIN")
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentAuth() auth: AuthContext
  ) {
    await this.landings.remove(id, auth);
    return { ok: true };
  }

  @Get(":id/submissions")
  listSubmissions(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.landings.listSubmissions(id);
  }
}
