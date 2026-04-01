import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AiService } from './ai.service';

interface AiActionDto {
  /** Observation vector of length 60 (matches sugar_swap_env.py _obs()). */
  observation:  number[];
  /** Indices of actions that are legal in the current state. */
  validActions: number[];
}

interface AiActionResponse {
  action: number;
}

/**
 * POST /api/ai/action
 *
 * Accepts the current game observation and valid actions,
 * returns the expert AI's chosen action index.
 *
 * No authentication required — the model runs locally.
 */
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('action')
  @HttpCode(200)
  async action(@Body() dto: AiActionDto): Promise<AiActionResponse> {
    const action = await this.ai.chooseAction(dto.observation, dto.validActions);
    return { action };
  }
}
