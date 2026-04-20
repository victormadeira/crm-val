import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  ExecuteImportInput,
  FieldMap,
  ImportTargetField,
  UploadImportInput,
} from "@valparaiso/shared";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthContext } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { guessTargetField, readCsv } from "./csv-reader";
import { ImportStorageService } from "./import-storage.service";
import { ImportsQueue } from "./imports.queue";

export interface ImportPreview {
  importId: string;
  headers: string[];
  delimiter: "," | ";";
  totalRowsSampled: number;
  sampleRows: Record<string, string>[];
  suggestedMap: FieldMap;
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ImportStorageService,
    private readonly queue: ImportsQueue,
    private readonly audit: AuditService
  ) {}

  async upload(
    input: UploadImportInput,
    auth: AuthContext
  ): Promise<ImportPreview> {
    const fileRef = await this.storage.put(auth.tenantId, input.csvContent);
    const preview = readCsv(input.csvContent, 10);
    if (preview.headers.length === 0) {
      throw new BadRequestException(
        "CSV vazio ou sem cabeçalho — esperado cabeçalho na primeira linha"
      );
    }
    const suggestedMap: FieldMap = {};
    for (const h of preview.headers) {
      suggestedMap[h] = guessTargetField(h);
    }

    const imp = await this.prisma.scoped.leadImport.create({
      data: scopedData({
        sourceLabel: input.sourceLabel,
        fieldMap: suggestedMap as Prisma.InputJsonValue,
        fileRef,
        dryRun: true,
        createdById: auth.userId,
      }),
      select: { id: true },
    });

    await this.audit.record({
      action: "import.upload",
      entity: "LeadImport",
      entityId: imp.id,
      metadata: { sourceLabel: input.sourceLabel },
    });

    return {
      importId: imp.id,
      headers: preview.headers,
      delimiter: preview.delimiter,
      totalRowsSampled: preview.rows.length,
      sampleRows: preview.rows,
      suggestedMap,
    };
  }

  async execute(
    importId: string,
    input: ExecuteImportInput,
    auth: AuthContext
  ): Promise<{ importId: string; queued: true }> {
    const imp = await this.prisma.scoped.leadImport.findUnique({
      where: { id: importId },
      select: { id: true, status: true },
    });
    if (!imp) throw new NotFoundException("Importação não encontrada");
    if (imp.status === "RUNNING")
      throw new BadRequestException("Importação já em execução");
    if (imp.status === "SUCCEEDED")
      throw new BadRequestException("Importação já concluída");

    if (!hasRequiredMapping(input.fieldMap)) {
      throw new BadRequestException(
        "fieldMap precisa mapear ao menos `name` e `phoneE164`"
      );
    }

    await this.prisma.scoped.leadImport.update({
      where: { id: importId },
      data: {
        fieldMap: input.fieldMap as Prisma.InputJsonValue,
        dryRun: input.dryRun,
        status: "PENDING",
        startedAt: null,
        finishedAt: null,
        errorsSample: Prisma.JsonNull,
        importedRows: 0,
        skippedRows: 0,
        errorRows: 0,
        totalRows: 0,
      },
    });

    await this.queue.enqueue({
      importId,
      tenantId: auth.tenantId,
      userId: auth.userId,
      input,
    });

    await this.audit.record({
      action: "import.execute",
      entity: "LeadImport",
      entityId: importId,
      metadata: { dryRun: input.dryRun },
    });
    return { importId, queued: true };
  }

  async list(): Promise<
    Array<{
      id: string;
      sourceLabel: string;
      status: string;
      totalRows: number;
      importedRows: number;
      skippedRows: number;
      errorRows: number;
      createdAt: Date;
      finishedAt: Date | null;
    }>
  > {
    return this.prisma.scoped.leadImport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sourceLabel: true,
        status: true,
        totalRows: true,
        importedRows: true,
        skippedRows: true,
        errorRows: true,
        createdAt: true,
        finishedAt: true,
      },
    });
  }

  async get(importId: string) {
    const imp = await this.prisma.scoped.leadImport.findUnique({
      where: { id: importId },
    });
    if (!imp) throw new NotFoundException("Importação não encontrada");
    return imp;
  }
}

function hasRequiredMapping(map: FieldMap): boolean {
  const targets = new Set<ImportTargetField>();
  for (const v of Object.values(map)) {
    if (v) targets.add(v);
  }
  return targets.has("name") && targets.has("phoneE164");
}
