import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Job } from "bullmq";
import type { FieldMap, ImportTargetField } from "@valparaiso/shared";
import { AutomationBus } from "../automation/automation.bus";
import { normalizeBrPhone } from "../leads/phone";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";
import { readCsv } from "./csv-reader";
import { ImportStorageService } from "./import-storage.service";
import { type ImportJob, ImportsQueue } from "./imports.queue";

/**
 * Worker de importação. Tenta parsear todas as linhas; para cada:
 *   1. Aplica field map.
 *   2. Valida `name` + `phoneE164` obrigatórios.
 *   3. Se dryRun, conta; senão cria Lead + tags + LeadEvent CREATED.
 * Coleta até 50 erros de amostra pra mostrar no UI.
 *
 * Em dryRun nenhum lead é criado, nenhum evento é emitido — útil
 * para estimar duplicatas / erros antes de commitar.
 */
@Injectable()
export class ImportsWorkerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ImportsWorkerService.name);

  constructor(
    private readonly queue: ImportsQueue,
    private readonly storage: ImportStorageService,
    private readonly prisma: PrismaService,
    private readonly bus: AutomationBus
  ) {}

  onApplicationBootstrap(): void {
    this.queue.registerProcessor((job) =>
      TenantContext.run(
        { tenantId: job.data.tenantId, userId: job.data.userId },
        () => this.process(job)
      )
    );
  }

  private async process(job: Job<ImportJob>): Promise<void> {
    const { importId, tenantId, input } = job.data;

    const imp = await this.prisma.scoped.leadImport.findUnique({
      where: { id: importId },
      select: { id: true, fileRef: true, status: true },
    });
    if (!imp) {
      this.logger.warn(`import ${importId} sumiu`);
      return;
    }
    if (imp.status === "SUCCEEDED") return;

    await this.prisma.scoped.leadImport.update({
      where: { id: importId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    let content: string;
    try {
      content = await this.storage.get(imp.fileRef);
    } catch (err) {
      await this.markFailed(importId, `read file: ${String(err)}`);
      return;
    }

    const { rows } = readCsv(content);
    const map = input.fieldMap as FieldMap;

    const errors: Array<{ row: number; message: string }> = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const mapped = applyFieldMap(row, map);
        if (!mapped.name || !mapped.phoneE164) {
          skipped++;
          continue;
        }
        const phoneE164 = normalizeBrPhone(String(mapped.phoneE164));

        const productInterest =
          mapped.productInterest ?? input.defaultProductInterest ?? null;

        if (input.dryRun) {
          // No dry-run já contamos duplicatas pra dar sinal no preview.
          const dup = await this.prisma.scoped.lead.findFirst({
            where: { phoneE164 },
            select: { id: true },
          });
          if (dup) {
            skipped++;
          } else {
            imported++;
          }
          continue;
        }

        const created = await this.prisma.scoped.$transaction(async (tx) => {
          const existing = await tx.lead.findFirst({
            where: { phoneE164 },
            select: { id: true },
          });
          if (existing) return null; // duplicata → skipped
          const lead = await tx.lead.create({
            data: scopedData({
              name: mapped.name!,
              phoneE164,
              email: mapped.email ?? null,
              visitDate: mapped.visitDate ?? null,
              groupSize: mapped.groupSize ?? null,
              productInterest: productInterest as
                | Prisma.LeadCreateInput["productInterest"]
                | null,
              cityGuess: mapped.cityGuess ?? null,
              origin: "IMPORT",
              sourceCampaign: mapped.sourceCampaign ?? null,
              sourceAdset: mapped.sourceAdset ?? null,
              sourceAd: mapped.sourceAd ?? null,
              sourceFbclid: mapped.sourceFbclid ?? null,
              sourceGclid: mapped.sourceGclid ?? null,
            }),
            select: { id: true },
          });

          if (input.tagIds && input.tagIds.length > 0) {
            await tx.leadTagOnLead.createMany({
              data: input.tagIds.map((tagId) => ({
                leadId: lead.id,
                tagId,
              })),
              skipDuplicates: true,
            });
          }

          await tx.leadEvent.create({
            data: {
              leadId: lead.id,
              kind: "CREATED",
              payload: {
                origin: "IMPORT",
                importId,
              } as Prisma.InputJsonValue,
            },
          });
          return lead;
        });

        if (!created) {
          skipped++;
        } else {
          imported++;
          this.bus.publish({
            kind: "LEAD_CREATED",
            tenantId,
            leadId: created.id,
            origin: "IMPORT",
          });
        }
      } catch (e) {
        if (errors.length < 50) {
          errors.push({
            row: i + 2, // +1 cabeçalho +1 humano-1base
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    const errorRows = errors.length === 50 ? rows.length - imported - skipped : errors.length;
    const status =
      errors.length === 0
        ? "SUCCEEDED"
        : imported > 0
          ? "PARTIAL"
          : "FAILED";

    await this.prisma.scoped.leadImport.update({
      where: { id: importId },
      data: {
        status,
        totalRows: rows.length,
        importedRows: imported,
        skippedRows: skipped,
        errorRows,
        errorsSample: errors as unknown as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
  }

  private async markFailed(importId: string, msg: string): Promise<void> {
    await this.prisma.scoped.leadImport.update({
      where: { id: importId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorsSample: [{ row: 0, message: msg }] as unknown as Prisma.InputJsonValue,
      },
    });
    this.logger.error(`import ${importId} FAILED: ${msg}`);
  }
}

/**
 * Aplica o fieldMap a uma linha crua. Colunas com mapping null são
 * ignoradas. Retorna objeto com chaves = ImportTargetField.
 */
function applyFieldMap(
  row: Record<string, string>,
  map: FieldMap
): Partial<Record<ImportTargetField, string | number | Date>> {
  const out: Partial<Record<ImportTargetField, string | number | Date>> = {};
  for (const [col, target] of Object.entries(map)) {
    if (!target) continue;
    const raw = row[col];
    if (raw == null || raw === "") continue;
    switch (target) {
      case "groupSize": {
        const n = Number.parseInt(raw, 10);
        if (Number.isFinite(n) && n > 0) out.groupSize = n;
        break;
      }
      case "visitDate": {
        const d = parseFlexibleDate(raw);
        if (d) out.visitDate = d;
        break;
      }
      case "productInterest": {
        const norm = raw.toUpperCase().replace(/[^A-Z_]/g, "_");
        out.productInterest = norm;
        break;
      }
      default:
        out[target] = raw.trim();
    }
  }
  return out;
}

function parseFlexibleDate(s: string): Date | null {
  const t = s.trim();
  // dd/MM/yyyy ou dd-MM-yyyy
  const m = /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/.exec(t);
  if (m) {
    const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = new Date(t);
  return Number.isNaN(iso.getTime()) ? null : iso;
}
