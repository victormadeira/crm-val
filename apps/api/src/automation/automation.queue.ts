import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";

export const AUTOMATION_RUN_QUEUE = "automation-run";

export interface AutomationRunJob {
  runId: string;
  tenantId: string;
  /** Id do nó a executar. Se null, começa do startNodeId do flow. */
  nodeId: string | null;
}

@Injectable()
export class AutomationQueue implements OnModuleInit, OnModuleDestroy {
  private connection!: IORedis;
  private queue!: Queue<AutomationRunJob>;
  private workers: Worker[] = [];

  constructor(@Inject(ENV_TOKEN) private readonly env: Env) {}

  onModuleInit(): void {
    this.connection = new IORedis(this.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<AutomationRunJob>(AUTOMATION_RUN_QUEUE, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential" as const, delay: 5_000 },
        removeOnComplete: { age: 3_600, count: 2_000 },
        removeOnFail: { age: 7 * 24 * 3_600 },
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueueRun(job: AutomationRunJob, delayMs?: number): Promise<void> {
    await this.queue.add(`auto-${job.runId}-${job.nodeId ?? "start"}`, job, {
      delay: delayMs,
    });
  }

  registerProcessor(
    processor: (job: Job<AutomationRunJob>) => Promise<void>
  ): void {
    const worker = new Worker<AutomationRunJob>(
      AUTOMATION_RUN_QUEUE,
      processor,
      {
        connection: this.connection.duplicate(),
        concurrency: 10,
      }
    );
    this.workers.push(worker);
  }
}
