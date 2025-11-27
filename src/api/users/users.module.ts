import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { UserRepository } from './users.repository';

@Module({
  providers: [UsersService, PrismaService, UserRepository],
  controllers: [UsersController],
  exports: [UserRepository],
})
export class UsersModule {}
