import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../common/modules/prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [AuthService, AuthRepository],
  controllers: [AuthController],
})
export class AuthModule {}
