import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ExpoPushClient } from "./expo-push.client";
import { PushController } from "./push.controller";
import { PushService } from "./push.service";

/**
 * @Global para que WaWorker e outros módulos possam injetar PushService
 * sem precisar importar PushModule explicitamente — mantém o grafo de
 * dependências limpo e evita dependências circulares.
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PushController],
  providers: [PushService, ExpoPushClient],
  exports: [PushService],
})
export class PushModule {}
