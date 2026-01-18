// Storage Routes - R2 文件访问路由

import { Hono } from 'hono';
import type { AppEnv } from '../types';

const app = new Hono<AppEnv>();

// R2 图片访问路由
// 支持路径: /image/* 和 /attached/image/*
app.get('/*', async (c) => {
    // 使用原始 URL 路径，而不是子路由路径
    // 因为 Hono 的 route() 会移除前缀
    const url = new URL(c.req.url);
    const path = url.pathname;

    // 移除开头的斜杠
    const key = path.startsWith('/') ? path.slice(1) : path;

    // 从 R2 获取文件
    const object = await c.env.BUCKET.get(key);

    if (!object) {
        return c.notFound();
    }

    // 获取文件元数据
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1年缓存

    return new Response(object.body, { headers });
});

export default app;
