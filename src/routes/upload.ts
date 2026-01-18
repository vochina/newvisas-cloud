// Upload Routes - 文件上传路由
// POST /admin/upload - 上传图片到 R2

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { validateImageFile } from '../validations';
import type { AppEnv } from '../types';

const app = new Hono<AppEnv>();

// 所有上传路由需要认证
app.use('*', authMiddleware);

// 上传图片
app.post('/upload', async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return c.json({ success: false, error: '请选择要上传的文件' }, 400);
        }

        // file is now File type
        const fileObj = file as File;

        // 验证文件
        const validation = validateImageFile(fileObj);
        if (!validation.valid) {
            return c.json({ success: false, error: validation.error }, 400);
        }

        // 生成唯一文件名
        const ext = fileObj.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const key = `uploads/${timestamp}-${random}.${ext}`;

        // 上传到 R2
        await c.env.BUCKET.put(key, fileObj.stream(), {
            httpMetadata: {
                contentType: fileObj.type,
            },
        });

        // 返回可访问的 URL
        return c.json({
            success: true,
            url: `/${key}`,
            key,
            filename: fileObj.name,
            size: fileObj.size,
            type: fileObj.type,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return c.json({ success: false, error: '上传失败，请重试' }, 500);
    }
});

// 批量上传
app.post('/upload/batch', async (c) => {
    try {
        const formData = await c.req.formData();
        const filesRaw = formData.getAll('files');

        // Filter to only File objects (not strings)
        const files: File[] = [];
        for (const f of filesRaw) {
            if (typeof f !== 'string' && f instanceof File) {
                files.push(f);
            }
        }

        if (files.length === 0) {
            return c.json({ success: false, error: '请选择要上传的文件' }, 400);
        }

        const results: Array<{
            success: boolean;
            url?: string;
            key?: string;
            filename: string;
            error?: string;
        }> = [];

        for (const file of files) {
            // 验证文件
            const validation = validateImageFile(file);
            if (!validation.valid) {
                results.push({
                    success: false,
                    filename: file.name,
                    error: validation.error,
                });
                continue;
            }

            // 生成唯一文件名
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const key = `uploads/${timestamp}-${random}.${ext}`;

            try {
                // 上传到 R2
                await c.env.BUCKET.put(key, file.stream(), {
                    httpMetadata: {
                        contentType: file.type,
                    },
                });

                results.push({
                    success: true,
                    url: `/${key}`,
                    key,
                    filename: file.name,
                });
            } catch {
                results.push({
                    success: false,
                    filename: file.name,
                    error: '上传失败',
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        return c.json({
            success: successCount > 0,
            total: files.length,
            uploaded: successCount,
            failed: files.length - successCount,
            results,
        });
    } catch (error) {
        console.error('Batch upload error:', error);
        return c.json({ success: false, error: '批量上传失败，请重试' }, 500);
    }
});

// 删除文件
app.post('/upload/delete', async (c) => {
    try {
        const { key } = await c.req.json<{ key: string }>();

        if (!key) {
            return c.json({ success: false, error: '请提供文件路径' }, 400);
        }

        // 从 R2 删除
        await c.env.BUCKET.delete(key);

        return c.json({ success: true, message: '文件已删除' });
    } catch (error) {
        console.error('Delete error:', error);
        return c.json({ success: false, error: '删除失败，请重试' }, 500);
    }
});

export default app;
