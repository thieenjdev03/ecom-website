require('dotenv/config');
const { DataSource } = require('typeorm');

module.exports = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../modules/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl: (process.env.DATABASE_URL && process.env.DATABASE_URL.indexOf('sslmode=require') !== -1)
    ? { rejectUnauthorized: false }
    : false,
});


