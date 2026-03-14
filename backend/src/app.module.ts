import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';

const nodeEnv = process.env.NODE_ENV || 'development';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT ?? 5432);
const dbUser =
  nodeEnv === 'test'
    ? process.env.TEST_DB_USER || process.env.DB_USER || 'postgres'
    : nodeEnv === 'development'
      ? process.env.DEV_DB_USER || process.env.DB_USER || 'postgres'
      : process.env.DB_USER || 'postgres';
const dbPassword =
  nodeEnv === 'test'
    ? process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD
    : nodeEnv === 'development'
      ? process.env.DEV_DB_PASSWORD || process.env.DB_PASSWORD
      : process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'pulse_erp_db';

if (Number.isNaN(dbPort)) {
  throw new Error('Invalid DB_PORT value. Please update backend/.env with a valid numeric port.');
}

if (!dbPassword || dbPassword === 'password') {
  throw new Error(
    `Database password is missing or placeholder for NODE_ENV=${nodeEnv}. Set DEV_DB_PASSWORD/TEST_DB_PASSWORD (or DB_PASSWORD) in backend/.env and restart.`,
  );
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPassword,
      database: dbName,
      entities: ['src/**/*.entity.ts'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.NODE_ENV === 'development',
      retryAttempts: 2,
      retryDelay: 1000,
    }),
    CompaniesModule,
    UsersModule,
    AuthModule,
    OrdersModule,
  ],
})
export class AppModule {}
