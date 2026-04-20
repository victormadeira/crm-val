import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { WeatherController } from "./weather.controller";
import { WeatherCronService } from "./weather.cron";
import { WeatherService } from "./weather.service";

@Module({
  imports: [PrismaModule],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherCronService],
  exports: [WeatherService],
})
export class WeatherModule {}
