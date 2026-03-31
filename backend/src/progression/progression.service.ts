import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType, MatchMode, User } from '@prisma/client';

// ─── Level thresholds ─────────────────────────────────────────────────────────

/** XP required to reach the *next* level from the current one. */
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
  peek: number;    // reveal a hidden card
  swap: number;    // swap two cards with opponent
  freeze: number;  // freeze opponent for 1 turn
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

  const grant = (b: BadgeType) => {
    if (!existing.has(b)) earned.push(b);
  };

  if (user.totalMatches === 1) grant(BadgeType.FIRST_WIN);
  if (user.totalMatches >= 10) grant(BadgeType.VETERAN);
  if (user.totalMatches >= 50) grant(BadgeType.GRAND_MASTER);
  if (pointsThisGame <= 10) grant(BadgeType.SHARP_MIND);
  if (pointsThisGame === 0) grant(BadgeType.PERFECTIONIST);
  if (newLevel >= 5)  grant(BadgeType.LEVEL_5);
  if (newLevel >= 10) grant(BadgeType.LEVEL_10);
  if (newLevel >= 15) grant(BadgeType.LEVEL_15);
  if (isOnline) grant(BadgeType.SOCIAL_BUTTERFLY);

  return earned;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface MatchPlayerInput {
  userId: string | null; // null = AI or guest
  name: string;
  points: number;
  isAi?: boolean;
  isWinner?: boolean;
}

export interface GameResultInput {
  userId: string;
  points: number;       // lower is better in Sugar Swap scoring
  isOnline?: boolean;
  startedAt?: Date;
  endedAt?: Date;
  allPlayers?: MatchPlayerInput[]; // full player list for match history
}

export interface GameResultOutput {
  levelUp: boolean;
  newLevel: number;
  gainedXp: number;
  newBadges: BadgeType[];
  unlockedSkins: string[];
  jokers: JokerConfig;
}

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  async recordGameResult(input: GameResultInput): Promise<GameResultOutput> {
    const { userId, points, isOnline = false, startedAt, endedAt, allPlayers } = input;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { badges: { select: { type: true } } },
    });

    // XP gained: inversely proportional to score (max 200 XP per game)
    const gainedXp = Math.max(10, 200 - points);
    const prevXp = user.experience;
    const newXp   = prevXp + gainedXp;

    // Compute new level
    let level = user.level;
    let xpBucket = newXp;
    while (xpBucket >= xpToNextLevel(level)) {
      xpBucket -= xpToNextLevel(level);
      level++;
    }

    const levelUp = level > user.level;

    // Determine newly unlocked skins
    const newSkins = Object.entries(SKIN_UNLOCKS)
      .filter(([lvl, skin]) => Number(lvl) <= level && !user.unlockedSkins.includes(skin))
      .map(([, skin]) => skin);

    // Persist updated stats
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalMatches: { increment: 1 },
        totalPoints:  { increment: points },
        experience:   newXp,
        level,
        unlockedSkins: { push: newSkins },
      },
    });

    // Evaluate & save new badges
    const updatedUser = { ...user, totalMatches: user.totalMatches + 1 };
    const earnedBadges = evaluateBadges(updatedUser, points, level, isOnline);
    if (earnedBadges.length > 0) {
      await this.prisma.badge.createMany({
        data: earnedBadges.map((type) => ({ userId, type })),
        skipDuplicates: true,
      });
    }

    // Record match history
    const now = new Date();
    const players = allPlayers ?? [{ userId, name: '', points, isAi: false, isWinner: true }];
    await this.prisma.match.create({
      data: {
        mode:      isOnline ? MatchMode.ONLINE : MatchMode.VS_AI,
        startedAt: startedAt ?? now,
        endedAt:   endedAt   ?? now,
        players: {
          create: players.map((p) => ({
            userId:   p.userId ?? null,
            name:     p.name,
            points:   p.points,
            isAi:     p.isAi     ?? false,
            isWinner: p.isWinner ?? false,
          })),
        },
      },
    });

    return {
      levelUp,
      newLevel:     level,
      gainedXp,
      newBadges:    earnedBadges,
      unlockedSkins: newSkins,
      jokers:       jokersForLevel(level),
    };
  }
}
