// tests/db-create/index.ts
import { createClient } from '@libsql/client';
import fs from 'fs/promises';
import path from 'path';

// Database configuration
const TEST_DB_PATH = path.join(process.cwd(), 'test.db');
const PROD_DB_PATH = path.join(process.cwd(), 'local.db');

  const db = createClient({
      url: `file:${TEST_DB_PATH}`,
    });