import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { Roles } from "../auth/roles.guard";
import { GamificationService } from "./gamification.service";

@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Get("leaderboard")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  leaderboard(
    @Query("days") days?: string,
    @Query("limit") limit?: string
  ) {
    return this.gamification.leaderboard(
      days ? Number(days) : 30,
      limit ? Number(limit) : 20
    );
  }

  @Get("users/:id")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  user(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("days") days?: string
  ) {
    return this.gamification.userStats(id, days ? Number(days) : 30);
  }
}
