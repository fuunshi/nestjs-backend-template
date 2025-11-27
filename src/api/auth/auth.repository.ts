import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { handlePrismaError } from 'src/utils/error/handler/prisma.handler';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Logs user login data
   * @param data User ID, IP, User Agent
   */
  async login(data: {
    userId: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    try {
      await this.prisma.loginHistory.create({ data });
    } catch (error) {
      this.logger.error(`Error during login: ${error}`);
      handlePrismaError(error, 'Something went wrong.');
    }
  }

  /**
   * Logs user logout data
   * @param data User ID, User Agent
   */
  async logout(data: { userId: string; userAgent: string }): Promise<void> {
    try {
      await this.prisma.loginHistory.updateMany({
        where: {
          userId: data.userId,
          userAgent: data.userAgent,
          logoutAt: null,
        },
        data: { logoutAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Error during logout: ${error}`);
      handlePrismaError(error, 'Something went wrong.');
    }
  }
}
