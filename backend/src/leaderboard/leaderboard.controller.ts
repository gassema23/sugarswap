import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  /** GET /api/leaderboard — Top 100 mondial (no auth required). */
  @Get()
  getTop100() {
    return this.leaderboard.getTop100();
  }

  /** GET /api/leaderboard/:userId — Rank of a specific player. */
  @Get(':userId')
  getUserRank(@Param('userId') userId: string) {
    return this.leaderboard.getUserRank(userId);
  }
}
