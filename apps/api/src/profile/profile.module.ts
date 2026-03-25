import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { PrismaProfileRepository } from './prisma-profile.repository';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [
    PrismaProfileRepository,
    {
      provide: ProfileRepository,
      useExisting: PrismaProfileRepository,
    },
    ProfileService,
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
