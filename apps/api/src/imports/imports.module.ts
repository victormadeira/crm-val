import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ImportStorageService } from "./import-storage.service";
import { ImportsController } from "./imports.controller";
import { ImportsQueue } from "./imports.queue";
import { ImportsService } from "./imports.service";
import { ImportsWorkerService } from "./imports.worker.service";

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ImportsController],
  providers: [
    ImportStorageService,
    ImportsQueue,
    ImportsService,
    ImportsWorkerService,
  ],
})
export class ImportsModule {}
