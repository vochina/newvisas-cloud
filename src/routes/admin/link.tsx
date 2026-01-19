// Admin Link Routes - 友情链接管理
import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import { link } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 链接列表
app.get('/links', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    const linkList = await db
        .select()
        .from(link)
        .orderBy(asc(link.createdAt));

    return c.html(
        <AdminLayout title="友情链接管理" username={currentUser?.username}>
            <div class="toolbar">
                <h3 style={{ margin: 0, color: '#666' }}>链接列表</h3>
            </div>

            <div class="card">
                <form method="post" action="/admin/links/add" style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '2px solid #f0f0f0' }}>
                    <h4 style={{ marginBottom: '15px', color: '#333' }}>添加新链接</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                        <div class="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label>链接标题 *</label>
                            <input type="text" name="title" class="form-control" required placeholder="例如: 移民资讯网" />
                        </div>
                        <div class="form-group" style={{ flex: 2, marginBottom: 0 }}>
                            <label>链接地址 *</label>
                            <input
                                type="url"
                                name="url"
                                class="form-control"
                                required
                                placeholder="https://example.com"
                                pattern="https?://.+"
                                title="请输入完整的URL，包括 http:// 或 https://"
                            />
                        </div>
                        <button type="submit" class="btn btn-primary">添加</button>
                    </div>
                </form>

                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>ID</th>
                            <th style={{ width: '250px' }}>标题</th>
                            <th>链接地址</th>
                            <th style={{ width: '180px' }}>创建时间</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linkList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>
                                    <form method="post" action={`/admin/links/edit/${item.id}`} id={`form-${item.id}`} style={{ display: 'inline' }}>
                                        <input
                                            type="text"
                                            name="title"
                                            value={item.title || ''}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                width: '100%',
                                                padding: '4px 0'
                                            }}
                                            onchange={`document.getElementById('save-btn-${item.id}').style.display='inline-flex'`}
                                        />
                                    </form>
                                </td>
                                <td>
                                    <input
                                        type="url"
                                        name="url"
                                        value={item.url || ''}
                                        form={`form-${item.id}`}
                                        style={{
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '6px',
                                            width: '100%'
                                        }}
                                        onchange={`document.getElementById('save-btn-${item.id}').style.display='inline-flex'`}
                                        pattern="https?://.+"
                                        title="请输入完整的URL"
                                    />
                                </td>
                                <td style={{ fontSize: '13px', color: '#666' }}>{item.createdAt || '-'}</td>
                                <td class="action-btns">
                                    <button
                                        type="submit"
                                        form={`form-${item.id}`}
                                        id={`save-btn-${item.id}`}
                                        class="btn btn-primary btn-sm"
                                        style={{ display: 'none' }}
                                    >
                                        保存
                                    </button>
                                    <form method="post" action={`/admin/links/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除该链接吗？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {linkList.length === 0 && (
                            <tr><td colspan="5" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无友情链接</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
});

// 添加链接
app.post('/links/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();
    const title = (body.title as string)?.trim();
    const url = (body.url as string)?.trim();

    // 验证URL格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // 简单重定向回列表页，实际应用中可以显示错误
        return c.redirect('/admin/links');
    }

    await db.insert(link).values({
        title,
        url,
        createdAt: new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
    });

    return c.redirect('/admin/links');
});

// 编辑链接 (内联编辑)
app.post('/links/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();
    const title = (body.title as string)?.trim();
    const url = (body.url as string)?.trim();

    // 验证URL格式
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        return c.redirect('/admin/links');
    }

    await db.update(link).set({
        title,
        url,
    }).where(eq(link.id, id));

    return c.redirect('/admin/links');
});

// 删除链接
app.post('/links/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    await db.delete(link).where(eq(link.id, id));
    return c.redirect('/admin/links');
});

export default app;
