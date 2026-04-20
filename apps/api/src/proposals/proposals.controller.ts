import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  CreateProposalInputSchema,
  UpdateProposalInputSchema,
  type CreateProposalInput,
  type UpdateProposalInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Public } from "../tenant/tenant.guard";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { ProposalsService } from "./proposals.service";

@Controller("proposals")
export class ProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  @Post()
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  create(
    @Body(new ZodValidationPipe(CreateProposalInputSchema))
    body: CreateProposalInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.proposals.create(body, auth);
  }

  @Get()
  list(@Query("leadId") leadId?: string) {
    return this.proposals.list(leadId);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.proposals.getById(id);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateProposalInputSchema))
    body: UpdateProposalInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.proposals.update(id, body, auth);
  }

  /**
   * Endpoint público — chamado pelo frontend que renderiza a proposta no
   * link `/p/:token`. Registra view e dispara "PROPOSAL_OPENED" quando é a
   * primeira abertura. Sem autenticação (o token é a credencial).
   */
  @Public()
  @Get("public/:token/view")
  publicView(
    @Param("token") token: string,
    @Ip() ip: string,
    @Headers("user-agent") ua?: string
  ) {
    return this.proposals.registerPublicView(token, { ip, userAgent: ua });
  }
}
