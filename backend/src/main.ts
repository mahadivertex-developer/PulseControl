import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  
  // Enable CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('PulseControlERP API')
    .setDescription('Multi-company ERP system for garment manufacturing')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.APP_PORT ?? 3002);
  await app.listen(port, () => {
    console.log(`PulseControlERP Backend running on http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
