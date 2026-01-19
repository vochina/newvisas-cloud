// Admin Category Routes - 新闻分类管理
import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { newsClass } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 分类列表
app.get('/categories', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    const categoryList = await db
        .select()
        .from(newsClass)
        .orderBy(asc(newsClass.sortOrder));

    return c.html(
        <AdminLayout title="新闻分类管理" username={currentUser?.username}>
            <div class="toolbar">
                <h3 style={{ margin: 0, color: '#666' }}>分类列表</h3>
            </div>

            <div class="card">
                <form method="post" action="/admin/categories/add" style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '2px solid #f0f0f0' }}>
                    <h4 style={{ marginBottom: '15px', color: '#333' }}>添加新分类</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                        <div class="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label>分类名称 *</label>
                            <input type="text" name="name" class="form-control" required placeholder="例如: 移民政策" />
                        </div>
                        <div class="form-group" style={{ width: '150px', marginBottom: 0 }}>
                            <label>排序</label>
                            <input type="number" name="sortOrder" class="form-control" value="0" />
                        </div>
                        <button type="submit" class="btn btn-primary">添加</button>
                    </div>
                </form>

                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>ID</th>
                            <th>分类名称</th>
                            <th style={{ width: '120px' }}>排序</th>
                            <th style={{ width: '200px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoryList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>
                                    <form method="post" action={`/admin/categories/edit/${item.id}`} id={`form-${item.id}`} style={{ display: 'inline' }}>
                                        <input
                                            type="text"
                                            name="name"
                                            value={item.name || ''}
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
                                        type="number"
                                        name="sortOrder"
                                        value={String(item.sortOrder || 0)}
                                        form={`form-${item.id}`}
                                        style={{
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '6px',
                                            width: '80px'
                                        }}
                                        onchange={`document.getElementById('save-btn-${item.id}').style.display='inline-flex'`}
                                    />
                                </td>
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
                                    <form method="post" action={`/admin/categories/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除该分类？注意：删除分类可能影响相关新闻。')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {categoryList.length === 0 && (
                            <tr><td colspan="4" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无分类</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
});

// 添加分类
app.post('/categories/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    await db.insert(newsClass).values({
        name: body.name as string,
        sortOrder: parseInt(body.sortOrder as string) || 0,
    });

    return c.redirect('/admin/categories');
});

// 编辑分类 (内联编辑)
app.post('/categories/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    await db.update(newsClass).set({
        name: body.name as string,
        sortOrder: parseInt(body.sortOrder as string) || 0,
    }).where(eq(newsClass.id, id));

    return c.redirect('/admin/categories');
});

// 删除分类
app.post('/categories/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    await db.delete(newsClass).where(eq(newsClass.id, id));
    return c.redirect('/admin/categories');
});

export default app;
