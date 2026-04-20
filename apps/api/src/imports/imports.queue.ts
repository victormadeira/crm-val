import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import type { ExecuteImportInput } from "@valparaiso/shared";

export const IMPORT_QUEUE = "lead-import";

export interface ImportJob {
  importId: string;
  tenantId: string;
  userId: string;
  input: ExecuteImportInput;
}

@Injectable()
export class ImportsQueue implements OnModuleInit, OnModuleDestroy {
  private connection!: IORedis;
  private queue!: Queue<ImportJob>;
  private workers: Worker[] = [];

  constructor(@Inject(ENV_TOKEN) private readonly env: Env) {}

  onModuleInit(): void {
    this.connection = new IORedis(this.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<ImportJob>(IMPORT_QUEUE, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: { age: 7 * 24 * 3_600, count: 500 },
        removeOnFail: { age: 30 * 24 * 3_600 },
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueue(job: ImportJob): Promise<void> {
    await this.queue.add("import", job, { jobId: job.importId });
  }

  registerProcessor(processor: (job: Job<ImportJob>) => Promise<void>): void {
    const worker = new Worker<ImportJob>(IMPORT_QUEUE, processor, {
      connection: this.connection.duplicate(),
      concurrency: 2,
    });
    this.workers.push(worker);
  }
}
