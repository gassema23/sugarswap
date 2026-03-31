-- CreateEnum
CREATE TYPE "MatchMode" AS ENUM ('VS_AI', 'ONLINE');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "mode" "MatchMode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isAi" BOOLEAN NOT NULL DEFAULT false,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchPlayer_matchId_idx" ON "MatchPlayer"("matchId");

-- CreateIndex
CREATE INDEX "MatchPlayer_userId_idx" ON "MatchPlayer"("userId");

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
