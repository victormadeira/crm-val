import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";
import {
  AddLeadNoteInputSchema,
  AnonymizeLeadInputSchema,
  CreateLeadInputSchema,
  LeadListQuerySchema,
  MoveLeadInputSchema,
  UpdateLeadInputSchema,
  type AddLeadNoteInput,
  type AnonymizeLeadInput,
  type CreateLeadInput,
  type LeadListQuery,
  type MoveLeadInput,
  type UpdateLeadInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { LeadsService } from "./leads.service";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT", "MARKETING")
  @UsePipes(new ZodValidationPipe(CreateLeadInputSchema))
  create(@Body() body: CreateLeadInput, @CurrentAuth() auth: AuthContext) {
    return this.leads.create(body, auth);
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(LeadListQuerySchema)) q: LeadListQuery
  ) {
    return this.leads.list(q);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.leads.getById(id);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateLeadInputSchema)) body: UpdateLeadInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.leads.update(id, body, auth);
  }

  @Post(":id/move")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  move(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(MoveLeadInputSchema)) body: MoveLeadInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.leads.moveToStage(id, body, auth);
  }

  @Post(":id/notes")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  addNote(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(AddLeadNoteInputSchema)) body: AddLeadNoteInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.leads.addNote(id, body.body, auth);
  }

  @Post(":id/anonymize")
  @Roles("ADMIN")
  anonymize(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(AnonymizeLeadInputSchema)) body: AnonymizeLeadInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.leads.anonymize(id, body.reason, auth);
  }
}
