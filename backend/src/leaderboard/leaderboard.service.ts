import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  totalMatches: number;
  totalPoints: number;
  /** Average points per match — lower is better. */
  averageScore: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Top 100 players ranked by lowest average score (totalPoints / totalMatches).
   * A minimum of 5 matches is required to appear on the board.
   */
  async getTop100(): Promise<LeaderboardEntry[]> {
    // Raw query for the computed ratio, ordered ascending (lowest average wins)
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        avatar: string | null;
        level: number;
        total_matches: bigint;
        total_points: bigint;
        average_score: number;
      }[]
    >`
      SELECT
        id,
        name,
        avatar,
        level,
        "totalMatches"  AS total_matches,
        "totalPoints"   AS total_points,
        ROUND(
          CAST("totalPoints" AS NUMERIC) / NULLIF("totalMatches", 0),
          2
        )::FLOAT AS average_score
      FROM "User"
      WHERE "totalMatches" >= 5
      ORDER BY average_score ASC NULLS LAST
      LIMIT 100
    `;

    return rows.map((row, i) => ({
      rank:         i + 1,
      id:           row.id,
      name:         row.name,
      avatar:       row.avatar,
      level:        row.level,
      totalMatches: Number(row.total_matches),
      totalPoints:  Number(row.total_points),
      averageScore: row.average_score,
    }));
  }

  /** Retrieve a specific user's rank + stats (returns null if not ranked). */
  async getUserRank(userId: string): Promise<LeaderboardEntry | null> {
    const board = await this.getTop100();
    return board.find((e) => e.id === userId) ?? null;
  }
}
