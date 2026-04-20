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
  CreatePipelineInputSchema,
  CreatePipelineStageInputSchema,
  UpdatePipelineInputSchema,
  UpdatePipelineStageInputSchema,
  type CreatePipelineInput,
  type CreatePipelineStageInput,
  type UpdatePipelineInput,
  type UpdatePipelineStageInput,
} from "@valparaiso/shared";
import { Roles } from "../auth/roles.guard";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { PipelinesService } from "./pipelines.service";

@Controller("pipelines")
export class PipelinesController {
  constructor(private readonly pipelines: PipelinesService) {}

  @Get()
  list() {
    return this.pipelines.list();
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.pipelines.getById(id);
  }

  @Post()
  @Roles("ADMIN", "SUPERVISOR")
  create(
    @Body(new ZodValidationPipe(CreatePipelineInputSchema)) body: CreatePipelineInput
  ) {
    return this.pipelines.create(body);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPERVISOR")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdatePipelineInputSchema)) body: UpdatePipelineInput
  ) {
    return this.pipelines.update(id, body);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.pipelines.remove(id);
  }

  @Post("stages")
  @Roles("ADMIN", "SUPERVISOR")
  createStage(
    @Body(new ZodValidationPipe(CreatePipelineStageInputSchema))
    body: CreatePipelineStageInput
  ) {
    return this.pipelines.createStage(body);
  }

  @Patch("stages/:id")
  @Roles("ADMIN", "SUPERVISOR")
  updateStage(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdatePipelineStageInputSchema))
    body: UpdatePipelineStageInput
  ) {
    return this.pipelines.updateStage(id, body);
  }

  @Delete("stages/:id")
  @Roles("ADMIN")
  removeStage(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.pipelines.removeStage(id);
  }
}
