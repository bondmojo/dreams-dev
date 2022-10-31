import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      url: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
      entities: ['dist/**/entities/*.entity.js', 'dist/**/**/entities/*.entity.js'],
      migrations: ["src/migrations/*.js"],
      migrationsRun: true,
      dropSchema: false,
      keepConnectionAlive: true,
      logging: false,
      cli: {
        migrationsDir: 'src/migrations',

      },
    } as TypeOrmModuleOptions;
  }
}
