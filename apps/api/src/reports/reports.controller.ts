import { Controller, Get, Query } from "@nestjs/common";
import {
  ReportRangeQuerySchema,
  type ReportRangeQuery,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { ReportsService } from "./reports.service";

const rangePipe = new ZodValidationPipe(ReportRangeQuerySchema);

/**
 * Endpoints de relatórios, gatedos por role quando aplicável. Funnel e
 * origin são de leitura geral (qualquer role autenticada) pois compõem o
 * home dashboard. Métricas específicas (team, marketing, visits, overview)
 * exigem role compatível.
 */
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("funnel")
  funnel(@Query(rangePipe) q: ReportRangeQuery) {
    return this.reports.funnel(q);
  }

  @Get("origin")
  origin(@Query(rangePipe) q: ReportRangeQuery) {
    return this.reports.origin(q);
  }

  @Get("my-queue")
  @Roles("ATTENDANT", "SUPERVISOR", "ADMIN")
  myQueue(@CurrentAuth() auth: AuthContext) {
    return this.reports.myQueue(auth.userId);
  }

  @Get("team")
  @Roles("SUPERVISOR", "ADMIN")
  team(@Query(rangePipe) q: ReportRangeQuery) {
    return this.reports.team(q);
  }

  @Get("marketing")
  @Roles("MARKETING", "ADMIN")
  marketing(@Query(rangePipe) q: ReportRangeQuery) {
    return this.reports.marketing(q);
  }

  @Get("visits")
  @Roles("PARK_MANAGER", "ADMIN", "SUPERVISOR")
  visits(@Query(rangePipe) q: ReportRangeQuery) {
    return this.reports.visits(q);
  }

  @Get("overview")
  @Roles("ADMIN")
  overview(@Query(rangePipe) q: ReportRangeQuery) {
    return this.reports.adminOverview(q);
  }
}
