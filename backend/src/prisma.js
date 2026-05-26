const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const defaultUrl = `file:${path.join(__dirname, '..', 'dev.db').replace(/\\/g, '/')}`;
const url = process.env.DATABASE_URL || defaultUrl;

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
