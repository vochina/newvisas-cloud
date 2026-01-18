// newvisas-cloud - Main Entry Point
// Cloudflare Workers + Hono + D1 + Drizzle

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { dbMiddleware } from './middleware/db';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import storageRoutes from './routes/storage';
import uploadRoutes from './routes/upload';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

// Global Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', dbMiddleware);

// R2 Storage Routes (静态图片)
app.route('/image', storageRoutes);
app.route('/attached', storageRoutes);
app.route('/uploads', storageRoutes);  // 上传文件访问

// Static Files (CSS, JS)
app.get('/static/*', async (c) => {
    // 从 assets 目录提供静态文件
    // ASSETS binding 使用根路径，所以需要去掉 /static 前缀
    const path = c.req.path.replace('/static', '');
    const request = new Request(new URL(path, c.req.url).href, {
        method: c.req.method,
        headers: c.req.raw.headers,
    });
    return c.env.ASSETS.fetch(request);
});

// Public Routes (前台)
app.route('/', publicRoutes);

// Admin Routes (后台)
app.route('/admin', adminRoutes);

// 404 Handler
app.notFound((c) => {
    return c.html(
        <html>
            <head>
                <title>404 - 页面未找到</title>
                <meta charset="UTF-8" />
            </head>
            <body style={{ fontFamily: 'system-ui', textAlign: 'center', padding: '50px' }}>
                <h1>404</h1>
                <p>抱歉，您访问的页面不存在。</p>
                <a href="/">返回首页</a>
            </body>
        </html>,
        404
    );
});

// Error Handler
app.onError((err, c) => {
    console.error('Error:', err);
    return c.html(
        <html>
            <head>
                <title>500 - 服务器错误</title>
                <meta charset="UTF-8" />
            </head>
            <body style={{ fontFamily: 'system-ui', textAlign: 'center', padding: '50px' }}>
                <h1>500</h1>
                <p>服务器发生错误，请稍后重试。</p>
                <a href="/">返回首页</a>
            </body>
        </html>,
        500
    );
});

export default app;
