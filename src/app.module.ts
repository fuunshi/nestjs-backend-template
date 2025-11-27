import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// API Module
import { ApiModule } from './api/api.module';

// Common Modules
import { ConfigModule } from './common/modules/config/config.module';
import { LoggerModule } from './common/modules/logger/logger.module';
import { ThrottlerModule } from './common/modules/throttler/throttler.module';
import { QueueModule } from './common/modules/queue/queue.module';
import { PrismaModule } from './common/modules/prisma/prisma.module';
import { CloudinaryModule } from './common/modules/cloudinary/cloudinary.module';
import { CaslModule } from './common/modules/casl/casl.module';
import { AuditModule } from './common/modules/audit/audit.module';
import { TokenModule } from './common/modules/token/token.module';

// Guards and Filters
import { AuthGuard } from './common/guard/auth.guard';
import { PoliciesGuard } from './common/guard/policies.guard';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';

// Interceptors
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestLogInterceptor } from './common/interceptors/request-log.interceptor';

@Module({
  imports: [
    // Global Config Module - must be first
    ConfigModule,
    // Global JWT Module
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: (configService.get<string>('auth.jwtExpiresIn') || '1d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
    // Global Common Modules
    LoggerModule,
    ThrottlerModule,
    QueueModule,
    PrismaModule,
    CloudinaryModule,
    CaslModule,
    AuditModule,
    TokenModule,
    // API Module (contains all API-related modules)
    ApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLogInterceptor,
    },
  ],
})
export class AppModule {}
