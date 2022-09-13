import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions"
const database_config: MysqlConnectionOptions = {
    type: 'mysql',
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    entities: ['dist/entities/*.entity.js'],
}
export default database_config
