import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { AuthModule } from '../auth/auth.module';
import { ProgressionModule } from '../progression/progression.module';

@Module({
  imports: [AuthModule, ProgressionModule],
  providers: [GameGateway],
})
export class GameModule {}
