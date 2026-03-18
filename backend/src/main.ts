import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

async function verifyRequiredTables(dataSource: DataSource) {
  const requiredTables = ['companies', 'users', 'units', 'production_lines', 'buyers'];
  const result = await dataSource.query(
    `
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `,
  );

  const existingTables = new Set<string>(result.map((row: { tablename: string }) => row.tablename));
  const missingTables = requiredTables.filter((table) => !existingTables.has(table));

  if (missingTables.length > 0) {
    const guidance = missingTables.includes('buyers')
      ? 'Run db/add-buyers-table.sql against your database, then restart backend.'
      : 'Run the latest DB schema/migrations, then restart backend.';
    throw new Error(
      `Database compatibility check failed. Missing table(s): ${missingTables.join(', ')}. ${guidance}`,
    );
  }
}

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
    .setTitle('Bonon ERP API')
    .setDescription('Multi-company ERP system for garment manufacturing')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const dataSource = app.get(DataSource);
  await verifyRequiredTables(dataSource);

  const port = Number(process.env.APP_PORT ?? 3002);
  await app.listen(port, () => {
    console.log(`Bonon ERP Backend running on http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
