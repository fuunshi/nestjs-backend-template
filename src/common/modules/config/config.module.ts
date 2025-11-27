import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import appConfig from "./app.config";
import authConfig from "./auth.config";
import redisConfig from "./redis.config";
import throttlerConfig from "./throttler.config";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, redisConfig, throttlerConfig],
      envFilePath: [".env", ".env.local"],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
