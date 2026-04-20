import { Global, Injectable, Logger, Module } from "@nestjs/common";
import { EventEmitter } from "node:events";
import type { AutomationEvent } from "./automation.types";

/**
 * Bus interno para eventos de automação. In-process, fire-and-forget
 * — o dispatcher do automation module se inscreve e cuida de casar
 * com flows + enfileirar runs duráveis no Redis. Publishers (Leads,
 * WhatsApp, etc.) só fazem `publish` e seguem a vida.
 *
 * Motivo de não usar BullMQ direto aqui: evita ciclos de importação
 * entre módulos (Leads publica → Automation consome → actions voltam
 * a chamar Leads indiretamente via Prisma). Se um listener lançar,
 * logamos e seguimos — não queremos derrubar o caminho feliz do lead
 * por um flow quebrado.
 */
@Injectable()
export class AutomationBus {
  private readonly logger = new Logger(AutomationBus.name);
  private readonly emitter = new EventEmitter();

  constructor() {
    // Evita vazamento silencioso: emitter lança sem listener, mas
    // nosso contrato é fire-and-forget. setMaxListeners para não
    // reclamar se tivermos múltiplos subscribers (futuro).
    this.emitter.setMaxListeners(50);
  }

  publish(event: AutomationEvent): void {
    queueMicrotask(() => {
      try {
        this.emitter.emit("event", event);
      } catch (err) {
        this.logger.error(
          `bus publish falhou kind=${event.kind}: ${String(err)}`
        );
      }
    });
  }

  subscribe(handler: (event: AutomationEvent) => void | Promise<void>): () => void {
    const wrapped = (event: AutomationEvent): void => {
      Promise.resolve()
        .then(() => handler(event))
        .catch((err) => {
          this.logger.error(
            `bus handler falhou kind=${event.kind}: ${String(err)}`
          );
        });
    };
    this.emitter.on("event", wrapped);
    return () => this.emitter.off("event", wrapped);
  }
}

/**
 * Módulo @Global pra que qualquer serviço da aplicação possa injetar
 * AutomationBus sem precisar importar AutomationModule — evita ciclos
 * (ex.: WhatsappModule → AutomationBus enquanto AutomationModule →
 * WhatsappModule pelas actions).
 */
@Global()
@Module({
  providers: [AutomationBus],
  exports: [AutomationBus],
})
export class AutomationBusModule {}
