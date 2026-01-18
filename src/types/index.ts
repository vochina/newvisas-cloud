// Type definitions for newvisas-cloud

import type { Database } from '../db/client';

// Cloudflare Worker Bindings
export type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
    ASSETS: Fetcher;
    JWT_SECRET: string;
};

// Hono Context Variables
export type Variables = {
    db: Database;
    user?: {
        id: number;
        username: string;
    };
};

// Hono App Environment
export type AppEnv = {
    Bindings: Bindings;
    Variables: Variables;
};
