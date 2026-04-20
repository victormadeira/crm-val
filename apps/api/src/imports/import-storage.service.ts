import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";

/**
 * Armazenamento simples em disco. Arquivos vão pra
 * `${IMPORT_STORAGE_DIR}/${tenantId}/${importId}.csv`.
 * Trocar por S3/MinIO quando crescermos — a interface é propositalmente
 * limitada a put/get por ref string.
 */
@Injectable()
export class ImportStorageService {
  private readonly logger = new Logger(ImportStorageService.name);

  constructor(@Inject(ENV_TOKEN) private readonly env: Env) {}

  async put(tenantId: string, content: string): Promise<string> {
    const dir = path.resolve(this.env.IMPORT_STORAGE_DIR, tenantId);
    await mkdir(dir, { recursive: true });
    const id = randomUUID();
    const full = path.join(dir, `${id}.csv`);
    await writeFile(full, content, "utf8");
    return path.relative(path.resolve(this.env.IMPORT_STORAGE_DIR), full);
  }

  async get(ref: string): Promise<string> {
    const full = path.resolve(this.env.IMPORT_STORAGE_DIR, ref);
    return readFile(full, "utf8");
  }
}
