import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProgressionService, MatchPlayerInput } from './progression.service';

interface RecordBody {
  points: number;
  startedAt: string;   // ISO string
  endedAt: string;     // ISO string
  allPlayers: MatchPlayerInput[];
}

@Controller('progression')
export class ProgressionController {
  constructor(private readonly progression: ProgressionService) {}

  /** POST /api/progression/record — record a vs-AI game result for the authenticated user. */
  @Post('record')
  @UseGuards(AuthGuard('jwt'))
  record(@Req() req: { user: { id: string } }, @Body() body: RecordBody) {
    const myPlayer = body.allPlayers?.find((p) => p.userId === req.user.id);
    return this.progression.recordGameResult({
      userId:     req.user.id,
      points:     myPlayer?.points ?? Number(body.points),
      isOnline:   false,
      startedAt:  body.startedAt ? new Date(body.startedAt) : undefined,
      endedAt:    body.endedAt   ? new Date(body.endedAt)   : undefined,
      allPlayers: body.allPlayers,
    });
  }
}
