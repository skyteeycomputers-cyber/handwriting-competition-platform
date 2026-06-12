import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('🎯 Handwriting Platform API')
    .setDescription(
      'Global Handwriting Competition Platform REST API Documentation',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Competitions', 'Competition management endpoints')
    .addTag('Enrollments', 'Competition enrollment endpoints')
    .addTag('Submissions', 'Handwriting submission endpoints')
    .addTag('Payments', 'Payment processing endpoints')
    .addTag('Wallet', 'User wallet management endpoints')
    .addTag('Learning', 'Learning academy endpoints')
    .addTag('Notifications', 'Notification management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api/v1');

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  logger.log(
    `✅ Application is running on: http://localhost:${port}`,
  );
  logger.log(
    `📖 Swagger documentation: http://localhost:${port}/api/docs`,
  );
  logger.log(`🚀 Environment: ${process.env.NODE_ENV}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
