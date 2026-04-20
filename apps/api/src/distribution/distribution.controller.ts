import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import {
  AutoAssignInputSchema,
  ManualAssignInputSchema,
  type AutoAssignInput,
  type ManualAssignInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.guard";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { DistributionService } from "./distribution.service";

@Controller("distribution")
export class DistributionController {
  constructor(private readonly dist: DistributionService) {}

  /**
   * Dispara o distribuidor AI/round-robin para um lead específico.
   * Útil quando o supervisor quer forçar a alocação de um lead que
   * veio sem automação (ex.: import).
   */
  @Post("auto/:leadId")
  @Roles("ADMIN", "SUPERVISOR")
  auto(
    @Param("leadId", new ParseUUIDPipe()) leadId: string,
    @Body(new ZodValidationPipe(AutoAssignInputSchema)) body: AutoAssignInput
  ) {
    return this.dist.autoAssign(leadId, body);
  }

  /**
   * Override manual: fecha o assignment ativo e cria um novo apontando
   * para o usuário destino. Registra quem executou via AuthContext.
   */
  @Post("manual")
  @Roles("ADMIN", "SUPERVISOR")
  manual(
    @Body(new ZodValidationPipe(ManualAssignInputSchema)) body: ManualAssignInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.dist.manualAssign(
      body.leadId,
      body.assignedToId,
      auth,
      body.reason ?? "MANUAL_SUPERVISOR"
    );
  }

  @Delete(":leadId")
  @Roles("ADMIN", "SUPERVISOR")
  async unassign(
    @Param("leadId", new ParseUUIDPipe()) leadId: string,
    @CurrentAuth() auth: AuthContext
  ) {
    await this.dist.unassign(leadId, auth);
    return { ok: true };
  }
}
