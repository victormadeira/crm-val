import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";
import {
  SendMediaMessageInputSchema,
  SendTemplateMessageInputSchema,
  SendTextMessageInputSchema,
  UpsertWaAccountInputSchema,
  type SendMediaMessageInput,
  type SendTemplateMessageInput,
  type SendTextMessageInput,
  type UpsertWaAccountInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { WaService } from "./wa.service";

@Controller("whatsapp")
export class WaController {
  constructor(
    private readonly wa: WaService,
    private readonly prisma: PrismaService
  ) {}

  @Post("account")
  @Roles("ADMIN")
  @UsePipes(new ZodValidationPipe(UpsertWaAccountInputSchema))
  upsertAccount(
    @Body() body: UpsertWaAccountInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.wa.upsertAccount(body, auth);
  }

  @Post("messages/text")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  @UsePipes(new ZodValidationPipe(SendTextMessageInputSchema))
  sendText(
    @Body() body: SendTextMessageInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.wa.sendText(body, auth);
  }

  @Post("messages/template")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT", "MARKETING")
  @UsePipes(new ZodValidationPipe(SendTemplateMessageInputSchema))
  sendTemplate(
    @Body() body: SendTemplateMessageInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.wa.sendTemplate(body, auth);
  }

  @Post("messages/media")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  @UsePipes(new ZodValidationPipe(SendMediaMessageInputSchema))
  sendMedia(
    @Body() body: SendMediaMessageInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.wa.sendMedia(body, auth);
  }

  @Get("conversations/:leadId")
  async conversationByLead(
    @Param("leadId", new ParseUUIDPipe()) leadId: string,
    @Query("limit") limit = "200"
  ) {
    const convs = await this.prisma.scoped.waConversation.findMany({
      where: { leadId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        contactWaId: true,
        status: true,
        windowExpiresAt: true,
        lastInboundAt: true,
        lastOutboundAt: true,
      },
    });
    if (convs.length === 0) return { conversations: [], messages: [] };

    const messages = await this.prisma.scoped.waMessage.findMany({
      where: { conversationId: { in: convs.map((c) => c.id) } },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit) || 200, 500),
      select: {
        id: true,
        conversationId: true,
        direction: true,
        kind: true,
        status: true,
        text: true,
        mediaUrl: true,
        createdAt: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        errorMessage: true,
      },
    });
    return { conversations: convs, messages };
  }
}
