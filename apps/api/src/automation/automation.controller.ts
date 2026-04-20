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
  AutomationFlowListQuerySchema,
  CreateAutomationFlowSchema,
  UpdateAutomationFlowSchema,
  type AutomationFlowListQuery,
  type CreateAutomationFlowInput,
  type UpdateAutomationFlowInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { AutomationService } from "./automation.service";

@Controller("automations")
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(AutomationFlowListQuerySchema))
    q: AutomationFlowListQuery
  ) {
    return this.automation.list(q);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.automation.get(id);
  }

  @Post()
  @Roles("ADMIN", "SUPERVISOR", "MARKETING")
  create(
    @Body(new ZodValidationPipe(CreateAutomationFlowSchema))
    body: CreateAutomationFlowInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.automation.create(body, auth);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPERVISOR", "MARKETING")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateAutomationFlowSchema))
    body: UpdateAutomationFlowInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.automation.update(id, body, auth);
  }

  @Delete(":id")
  @Roles("ADMIN")
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentAuth() auth: AuthContext
  ) {
    await this.automation.remove(id, auth);
    return { ok: true };
  }

  @Get(":id/runs")
  listRuns(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.automation.listRuns(id);
  }

  @Get(":id/runs/:runId")
  getRun(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("runId", new ParseUUIDPipe()) runId: string
  ) {
    return this.automation.getRun(id, runId);
  }
}
