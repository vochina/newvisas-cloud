// Database Middleware for Hono
// Injects Drizzle DB instance into context

import { createMiddleware } from 'hono/factory';
import { createDb } from '../db/client';
import type { AppEnv } from '../types';

export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    const db = createDb(c.env.DB);
    c.set('db', db);
    await next();
});
