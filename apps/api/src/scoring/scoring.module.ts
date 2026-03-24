import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { RequestSessionModule } from '../request-session/request-session.module';
import { InMemoryScoringRepository } from './in-memory-scoring.repository';
import { ScoringController } from './scoring.controller';
import { ScoringRepository } from './scoring.repository';
import { ScoringService } from './scoring.service';

@Module({
  imports: [ProfileModule, RequestSessionModule],
  controllers: [ScoringController],
  providers: [
    InMemoryScoringRepository,
    {
      provide: ScoringRepository,
      useExisting: InMemoryScoringRepository,
    },
    ScoringService,
  ],
  exports: [ScoringService],
})
export class ScoringModule {}
