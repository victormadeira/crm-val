import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
} from "@nestjs/common";
import {
  LandingSubmissionSchema,
  type LandingSubmissionInput,
} from "@valparaiso/shared";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { Public } from "../tenant/tenant.guard";
import { LandingsService } from "./landings.service";

/**
 * Endpoints públicos das landings. Sem JWT, sem TenantContext no
 * entry — o próprio service resolve tenantId pelo slug e abre o ALS.
 * Rota pública tem rate-limit global do ThrottlerGuard (120 req/min).
 */
@Controller("public/landings")
export class PublicLandingsController {
  constructor(private readonly landings: LandingsService) {}

  @Public()
  @Get(":tenantSlug/:pageSlug")
  get(
    @Param("tenantSlug") tenantSlug: string,
    @Param("pageSlug") pageSlug: string
  ) {
    return this.landings.getPublic(tenantSlug, pageSlug);
  }

  @Public()
  @Post(":tenantSlug/:pageSlug/submit")
  submit(
    @Param("tenantSlug") tenantSlug: string,
    @Param("pageSlug") pageSlug: string,
    @Body(new ZodValidationPipe(LandingSubmissionSchema))
    body: LandingSubmissionInput,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.landings.submitPublic(tenantSlug, pageSlug, body, {
      ip,
      userAgent,
    });
  }
}
