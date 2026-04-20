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
  CreateTaskInputSchema,
  TaskListQuerySchema,
  UpdateTaskInputSchema,
  type CreateTaskInput,
  type TaskListQuery,
  type UpdateTaskInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  create(
    @Body(new ZodValidationPipe(CreateTaskInputSchema)) body: CreateTaskInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.tasks.create(body, auth);
  }

  @Get()
  list(@Query(new ZodValidationPipe(TaskListQuerySchema)) q: TaskListQuery) {
    return this.tasks.list(q);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.tasks.getById(id);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateTaskInputSchema)) body: UpdateTaskInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.tasks.update(id, body, auth);
  }

  @Delete(":id")
  @Roles("ADMIN", "SUPERVISOR")
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.tasks.remove(id, auth);
  }
}
