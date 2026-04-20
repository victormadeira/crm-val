import { Controller, Get, Query } from "@nestjs/common";
import {
  DashboardQuerySchema,
  type DashboardQuery,
} from "@valparaiso/shared";
import { Roles } from "../auth/roles.guard";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("overview")
  @Roles("ADMIN", "SUPERVISOR")
  overview(
    @Query(new ZodValidationPipe(DashboardQuerySchema)) q: DashboardQuery
  ) {
    return this.dashboard.overview(q);
  }
}
