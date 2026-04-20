import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../auth/roles.guard";
import { AiSummaryService } from "./ai-summary.service";

@Controller("ai")
export class AiController {
  constructor(private readonly summary: AiSummaryService) {}

  @Get("leads/:id/summary")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  get(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("force") force?: string
  ) {
    return this.summary.summarize(id, force === "1" || force === "true");
  }

  @Post("leads/:id/summary/invalidate")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  async invalidate(@Param("id", new ParseUUIDPipe()) id: string) {
    await this.summary.invalidate(id);
    return { ok: true };
  }
}
