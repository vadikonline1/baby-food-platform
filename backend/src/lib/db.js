require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const url = process.env.DATABASE_URL || 'file:./dev.db';
// unixepoch-ms pastreaza compatibilitatea cu datele scrise de driverul nativ Prisma 5/6
const adapter = new PrismaBetterSqlite3({ url }, { timestampFormat: 'unixepoch-ms' });
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
