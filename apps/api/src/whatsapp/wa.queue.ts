import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue, QueueEvents, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";

export const WA_OUTBOUND_QUEUE = "wa-outbound";
export const WA_INBOUND_QUEUE = "wa-inbound";

export interface WaOutboundTextJob {
  kind: "text";
  tenantId: string;
  conversationId: string;
  messageId: string; // WaMessage.id pré-criado com status QUEUED
}
export interface WaOutboundTemplateJob {
  kind: "template";
  tenantId: string;
  conversationId: string;
  messageId: string;
}
export interface WaOutboundMediaJob {
  kind: "media";
  tenantId: string;
  conversationId: string;
  messageId: string;
}
export type WaOutboundJob =
  | WaOutboundTextJob
  | WaOutboundTemplateJob
  | WaOutboundMediaJob;

export interface WaInboundJob {
  tenantId: string;
  phoneNumberId: string; // Meta phone_number_id
  payload: unknown; // webhook "changes[].value"
}

/**
 * Conexão única compartilhada para filas BullMQ. maxRetriesPerRequest
 * precisa ficar em null p/ BullMQ gerenciar reconexões manualmente.
 */
@Injectable()
export class WaQueue implements OnModuleInit, OnModuleDestroy {
  private connection!: IORedis;
  private outbound!: Queue<WaOutboundJob>;
  private inbound!: Queue<WaInboundJob>;
  private outboundEvents!: QueueEvents;
  private inboundEvents!: QueueEvents;
  private workers: Worker[] = [];

  constructor(@Inject(ENV_TOKEN) private readonly env: Env) {}

  onModuleInit(): void {
    this.connection = new IORedis(this.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    const defaultJobOptions = {
      attempts: 6,
      backoff: { type: "exponential" as const, delay: 2_000 },
      removeOnComplete: { age: 3_600, count: 5_000 },
      removeOnFail: { age: 7 * 24 * 3_600 },
    };

    this.outbound = new Queue<WaOutboundJob>(WA_OUTBOUND_QUEUE, {
      connection: this.connection,
      defaultJobOptions,
    });
    this.inbound = new Queue<WaInboundJob>(WA_INBOUND_QUEUE, {
      connection: this.connection,
      defaultJobOptions,
    });

    this.outboundEvents = new QueueEvents(WA_OUTBOUND_QUEUE, {
      connection: this.connection.duplicate(),
    });
    this.inboundEvents = new QueueEvents(WA_INBOUND_QUEUE, {
      connection: this.connection.duplicate(),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    await this.outboundEvents?.close();
    await this.inboundEvents?.close();
    await this.outbound?.close();
    await this.inbound?.close();
    await this.connection?.quit();
  }

  async enqueueOutbound(job: WaOutboundJob): Promise<void> {
    await this.outbound.add(`wa-out-${job.kind}`, job, {
      jobId: job.messageId, // dedupe — retry do caller não duplica envio
    });
  }

  async enqueueInbound(job: WaInboundJob): Promise<void> {
    await this.inbound.add("wa-in", job);
  }

  registerOutboundProcessor(
    processor: (job: Job<WaOutboundJob>) => Promise<void>
  ): void {
    const worker = new Worker<WaOutboundJob>(WA_OUTBOUND_QUEUE, processor, {
      connection: this.connection.duplicate(),
      concurrency: 20,
    });
    this.workers.push(worker);
  }

  registerInboundProcessor(
    processor: (job: Job<WaInboundJob>) => Promise<void>
  ): void {
    const worker = new Worker<WaInboundJob>(WA_INBOUND_QUEUE, processor, {
      connection: this.connection.duplicate(),
      concurrency: 40,
    });
    this.workers.push(worker);
  }
}
