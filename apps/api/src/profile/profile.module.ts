import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { InMemoryProfileRepository } from './in-memory-profile.repository';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [
    InMemoryProfileRepository,
    {
      provide: ProfileRepository,
      useExisting: InMemoryProfileRepository,
    },
    ProfileService,
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
