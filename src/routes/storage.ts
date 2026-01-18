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
    let object = await c.env.BUCKET.get(key);

    // 如果文件不存在，尝试不同的扩展名大小写组合
    if (!object) {
        // 获取文件扩展名
        const lastDotIndex = key.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            const basePath = key.substring(0, lastDotIndex);
            const extension = key.substring(lastDotIndex + 1);

            // 尝试不同的扩展名大小写组合
            const variations = [
                extension.toLowerCase(),  // 全小写
                extension.toUpperCase(),  // 全大写
            ].filter(ext => ext !== extension); // 过滤掉原始的扩展名(已经尝试过)

            for (const ext of variations) {
                const alternativeKey = `${basePath}.${ext}`;
                object = await c.env.BUCKET.get(alternativeKey);
                if (object) {
                    break;
                }
            }
        }
    }

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
