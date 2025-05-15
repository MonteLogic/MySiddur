import * as schema from './schema';
import 'dotenv/config';
import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/http';

export function tursoClient(): LibSQLDatabase<typeof schema> {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (url === undefined) {
    throw new Error('TURSO_URL is not defined', url);
  }

  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (authToken === undefined) {
    if (!url.includes('file:')) {
      throw new Error('TURSO_AUTH_TOKEN is not defined');
    }
  }

  return drizzle(
    createClient({
      url,
      authToken,
    }),
    { schema },
  );
}
