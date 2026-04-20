import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UsePipes,
} from "@nestjs/common";
import type { Request } from "express";
import {
  OpenPrivacyRequestInputSchema,
  PublishPolicyInputSchema,
  RecordConsentInputSchema,
  type OpenPrivacyRequestInput,
  type PublishPolicyInput,
  type RecordConsentInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { LgpdService } from "./lgpd.service";

@Controller("lgpd")
export class LgpdController {
  constructor(private readonly lgpd: LgpdService) {}

  @Get("policies")
  listPolicies() {
    return this.lgpd.listPolicies();
  }

  @Post("policies")
  @Roles("ADMIN")
  @UsePipes(new ZodValidationPipe(PublishPolicyInputSchema))
  publishPolicy(
    @Body() body: PublishPolicyInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.lgpd.publishPolicy(body, auth);
  }

  @Post("consents")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT", "MARKETING")
  @UsePipes(new ZodValidationPipe(RecordConsentInputSchema))
  recordConsent(@Body() body: RecordConsentInput, @Req() req: Request) {
    return this.lgpd.recordConsent({
      ...body,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? undefined,
    });
  }

  @Post("privacy-requests")
  @Roles("ADMIN", "SUPERVISOR")
  @UsePipes(new ZodValidationPipe(OpenPrivacyRequestInputSchema))
  openRequest(@Body() body: OpenPrivacyRequestInput) {
    return this.lgpd.openPrivacyRequest(body);
  }

  @Get("privacy-requests")
  @Roles("ADMIN", "SUPERVISOR")
  listRequests() {
    return this.lgpd.listPrivacyRequests();
  }
}
