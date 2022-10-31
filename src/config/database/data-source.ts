import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';

export const AppDataSource = new DataSource({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  entities: ['dist/**/entities/*.entity.js', 'dist/**/**/entities/*.entity.js'],
  migrations: ["src/migrations/*.ts"],
  type: process.env.DATABASE_TYPE,
  dropSchema: false,
  keepConnectionAlive: true,
  logging: false,
  cli: {
    migrationsDir: 'src/migration',
  },
} as DataSourceOptions);
