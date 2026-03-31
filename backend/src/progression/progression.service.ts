import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType, MatchMode, User } from '@prisma/client';

// ─── Level thresholds ─────────────────────────────────────────────────────────

export function xpToNextLevel(currentLevel: number): number {
  return currentLevel * 500;
}

// ─── Skin rewards per level milestone ────────────────────────────────────────

const SKIN_UNLOCKS: Record<number, string> = {
  5:  'skin_candy_pink',
  10: 'skin_galaxy_dark',
  15: 'skin_golden_caramel',
  20: 'skin_crystal_blue',
  25: 'skin_rainbow_sherbet',
};

// ─── Joker (power-up) slots unlocked by level ─────────────────────────────────

export interface JokerConfig {
  peek: number;
  swap: number;
  freeze: number;
}

export function jokersForLevel(level: number): JokerConfig {
  return {
    peek:   level >= 3  ? 2 : 1,
    swap:   level >= 7  ? 2 : level >= 2 ? 1 : 0,
    freeze: level >= 12 ? 1 : 0,
  };
}

// ─── Badge evaluation ─────────────────────────────────────────────────────────

function evaluateBadges(
  user: User & { badges: { type: BadgeType }[] },
  pointsThisGame: number,
  newLevel: number,
  isOnline: boolean,
): BadgeType[] {
  const existing = new Set(user.badges.map((b) => b.type));
  const earned: BadgeType[] = [];
  const grant = (b: BadgeType) => { if (!existing.has(b)) earned.push(b); };

  if (user.totalMatches >= 1) grant(BadgeType.FIRST_WIN);
  if (user.totalMatches >= 10) grant(BadgeType.VETERAN);
  if (user.totalMatches >= 50) grant(BadgeType.GRAND_MASTER);
  if (pointsThisGame <= 10)    grant(BadgeType.SHARP_MIND);
  if (pointsThisGame === 0)    grant(BadgeType.PERFECTIONIST);
  if (newLevel >= 5)           grant(BadgeType.LEVEL_5);
  if (newLevel >= 10)          grant(BadgeType.LEVEL_10);
  if (newLevel >= 15)          grant(BadgeType.LEVEL_15);
  if (isOnline)                grant(BadgeType.SOCIAL_BUTTERFLY);

  return earned;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchPlayerInput {
  userId: string | null;
  name: string;
  points: number;
  isAi?: boolean;
  isWinner?: boolean;
}

export interface GameResultOutput {
  levelUp: boolean;
  newLevel: number;
  gainedXp: number;
  newBadges: BadgeType[];
  unlockedSkins: string[];
  jokers: JokerConfig;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a single Match record for the whole game.
   * Call this once per game, not once per player.
   */
  async createMatch(input: {
    mode: 'ONLINE' | 'VS_AI';
    startedAt: Date;
    endedAt: Date;
    players: MatchPlayerInput[];
  }): Promise<string> {
    const match = await this.prisma.match.create({
      data: {
        mode:      input.mode === 'ONLINE' ? MatchMode.ONLINE : MatchMode.VS_AI,
        startedAt: input.startedAt,
        endedAt:   input.endedAt,
        players: {
          create: input.players.map((p) => ({
            userId:   p.userId ?? null,
            name:     p.name,
            points:   p.points,
            isAi:     p.isAi     ?? false,
            isWinner: p.isWinner ?? false,
          })),
        },
      },
    });
    return match.id;
  }

  /**
   * Update XP, level, skins and badges for one authenticated player.
   * Call this once per authenticated player after createMatch.
   */
  async recordPlayerProgression(input: {
    userId: string;
    points: number;
    isOnline?: boolean;
  }): Promise<GameResultOutput> {
    const { userId, points, isOnline = false } = input;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { badges: { select: { type: true } } },
    });

    const gainedXp = Math.max(10, 200 - points);
    const newXp    = user.experience + gainedXp;

    let level     = user.level;
    let xpBucket  = newXp;
    while (xpBucket >= xpToNextLevel(level)) {
      xpBucket -= xpToNextLevel(level);
      level++;
    }

    const levelUp = level > user.level;

    const newSkins = Object.entries(SKIN_UNLOCKS)
      .filter(([lvl, skin]) => Number(lvl) <= level && !user.unlockedSkins.includes(skin))
      .map(([, skin]) => skin);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalMatches:  { increment: 1 },
        totalPoints:   { increment: points },
        experience:    newXp,
        level,
        unlockedSkins: { push: newSkins },
      },
    });

    const updatedUser  = { ...user, totalMatches: user.totalMatches + 1 };
    const earnedBadges = evaluateBadges(updatedUser, points, level, isOnline);
    if (earnedBadges.length > 0) {
      await this.prisma.badge.createMany({
        data: earnedBadges.map((type) => ({ userId, type })),
        skipDuplicates: true,
      });
    }

    return {
      levelUp,
      newLevel:      level,
      gainedXp,
      newBadges:     earnedBadges,
      unlockedSkins: newSkins,
      jokers:        jokersForLevel(level),
    };
  }

  /**
   * Convenience method for vs-AI games (single authenticated player).
   * Creates the match and records progression in one call.
   */
  async recordGameResult(input: {
    userId: string;
    points: number;
    isOnline?: boolean;
    startedAt?: Date;
    endedAt?: Date;
    allPlayers?: MatchPlayerInput[];
  }): Promise<GameResultOutput> {
    const { userId, points, isOnline = false, startedAt, endedAt, allPlayers } = input;
    const now = new Date();

    await this.createMatch({
      mode:      isOnline ? 'ONLINE' : 'VS_AI',
      startedAt: startedAt ?? now,
      endedAt:   endedAt   ?? now,
      players:   allPlayers ?? [{ userId, name: '', points, isAi: false, isWinner: true }],
    });

    return this.recordPlayerProgression({ userId, points, isOnline });
  }
}
