// Authentication Middleware for Hono
// Verifies JWT token from cookies

import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import type { AppEnv } from '../types';

export interface JWTPayload {
    sub: string;
    username: string;
    exp: number;
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    const token = getCookie(c, 'auth_token');

    if (!token) {
        return c.redirect('/admin/login');
    }

    try {
        // Hono JWT verify: verify(token, secret, algorithm)
        const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as unknown as JWTPayload;

        c.set('user', {
            id: parseInt(payload.sub),
            username: payload.username,
        });

        await next();
    } catch {
        return c.redirect('/admin/login');
    }
});
