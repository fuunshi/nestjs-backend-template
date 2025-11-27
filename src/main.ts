import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConsoleLogger } from '@nestjs/common';
import compression from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: new ConsoleLogger({
        prefix: 'NestTemplate',
        colors: true,
        logLevels: ['debug', 'log', 'warn', 'error', 'verbose'],
        timestamp: true,
      }),
    },
  );

  await app.register(compression);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  await app.register(fastifyHelmet);

  const config = new DocumentBuilder()
    .setTitle('Template API')
    .setDescription('API Documentation for template.')
    .setVersion('1.0')
    .addTag('Template')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
