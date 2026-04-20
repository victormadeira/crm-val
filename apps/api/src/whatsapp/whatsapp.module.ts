import { Module } from "@nestjs/common";
import { CryptoModule } from "../crypto/crypto.module";
import { PrismaModule } from "../prisma/prisma.module";
import { MetaGraphClient } from "./meta-graph.client";
import { WaController } from "./wa.controller";
import { WaQueue } from "./wa.queue";
import { WaService } from "./wa.service";
import { WaWebhookController } from "./wa.webhook.controller";
import { WaWorkerService } from "./wa.worker.service";

@Module({
  imports: [PrismaModule, CryptoModule],
  providers: [WaQueue, WaService, WaWorkerService, MetaGraphClient],
  controllers: [WaController, WaWebhookController],
  exports: [WaService, WaQueue],
})
export class WhatsappModule {}
