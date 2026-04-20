import { Body, Controller, Post } from "@nestjs/common";
import { HandoffInputSchema, type HandoffInput } from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { HandoffService } from "./handoff.service";

/**
 * Endpoint chamado pelo agente IA (bot WhatsApp + Claude) quando detecta
 * critérios reais de qualificação. O agente usa um service account com
 * role MARKETING — autenticação JWT normal.
 */
@Controller("agent")
export class HandoffController {
  constructor(private readonly handoff: HandoffService) {}

  @Post("handoff")
  @Roles("ADMIN", "SUPERVISOR", "MARKETING")
  receive(
    @Body(new ZodValidationPipe(HandoffInputSchema)) body: HandoffInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.handoff.receive(body, auth);
  }
}
