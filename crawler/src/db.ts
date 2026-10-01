import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load backend .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
dotenv.config(); // Also check local .env if present

const require = createRequire(import.meta.url);
const prismaModulePath = path.resolve(__dirname, '../../backend/node_modules/@prisma/client');
const { PrismaClient } = require(prismaModulePath);

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('connect_timeout')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connect_timeout=30&pool_timeout=30';
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});
export type { PrismaClient } from '../../backend/node_modules/@prisma/client';
