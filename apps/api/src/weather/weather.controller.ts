import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  DateParamSchema,
  ForecastQuerySchema,
  type ForecastQuery,
} from "@valparaiso/shared";
import { Roles } from "../auth/roles.guard";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { WeatherService } from "./weather.service";

@Controller("weather")
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get("forecast")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  forecast(
    @Query(new ZodValidationPipe(ForecastQuerySchema)) q: ForecastQuery
  ) {
    return this.weather.getForecast(q.days);
  }

  @Get("score/:date")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  score(
    @Param(new ZodValidationPipe(DateParamSchema)) p: { date: string }
  ) {
    return this.weather.getScoreByDate(p.date);
  }
}
