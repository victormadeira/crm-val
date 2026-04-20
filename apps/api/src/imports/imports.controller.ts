import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import {
  ExecuteImportSchema,
  UploadImportSchema,
  type ExecuteImportInput,
  type UploadImportInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { ImportsService } from "./imports.service";

@Controller("imports")
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Post()
  @Roles("ADMIN", "SUPERVISOR", "MARKETING")
  upload(
    @Body(new ZodValidationPipe(UploadImportSchema)) body: UploadImportInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.imports.upload(body, auth);
  }

  @Post(":id/execute")
  @Roles("ADMIN", "SUPERVISOR", "MARKETING")
  execute(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(ExecuteImportSchema)) body: ExecuteImportInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.imports.execute(id, body, auth);
  }

  @Get()
  list() {
    return this.imports.list();
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.imports.get(id);
  }
}
