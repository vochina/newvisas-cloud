// Admin Event Routes - 活动管理
import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { jiangzuo } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 活动列表
app.get('/events', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 15;

    const eventsList = await db
        .select()
        .from(jiangzuo)
        .orderBy(desc(jiangzuo.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(jiangzuo);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="活动管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/events/add" class="btn btn-primary">+ 添加活动</a>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th>活动标题</th>
                            <th style={{ width: '150px' }}>时间</th>
                            <th>地点</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventsList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>{item.title?.substring(0, 40)}</td>
                                <td>{item.time}</td>
                                <td>{item.address}</td>
                                <td class="action-btns">
                                    <a href={`/admin/events/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                    <form method="post" action={`/admin/events/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {eventsList.length === 0 && (
                            <tr><td colspan="5" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无数据</td></tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div class="pagination">
                        {page > 1 && <a href={`/admin/events?page=${page - 1}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/events?page=${p}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/events?page=${page + 1}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 添加活动
app.get('/events/add', authMiddleware, async (c) => {
    const currentUser = c.get('user');

    return c.html(
        <AdminLayout title="添加活动" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/events/add">
                    <div class="form-group">
                        <label>活动标题 *</label>
                        <input type="text" name="title" class="form-control" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>活动时间</label>
                            <input type="text" name="time" class="form-control" placeholder="如：2026-01-20 14:00" />
                        </div>
                        <div class="form-group">
                            <label>活动地点</label>
                            <input type="text" name="address" class="form-control" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>相关国家</label>
                        <input type="text" name="guojia" class="form-control" placeholder="如：加拿大、澳洲" />
                    </div>
                    <div class="form-group">
                        <label>活动详情</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value="" />
                    </div>
                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" placeholder="图片URL" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/events" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/events/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    await db.insert(jiangzuo).values({
        title: body.title as string,
        time: body.time as string,
        address: body.address as string,
        guojia: body.guojia as string,
        content: body.content as string,
        pic: body.pic as string,
        createdAt: new Date().toISOString(),
        hits: 0,
    });

    return c.redirect('/admin/events');
});

// 编辑活动
app.get('/events/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [item] = await db.select().from(jiangzuo).where(eq(jiangzuo.id, id)).limit(1);
    if (!item) return c.redirect('/admin/events');

    return c.html(
        <AdminLayout title="编辑活动" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/events/edit/${id}`}>
                    <div class="form-group">
                        <label>活动标题 *</label>
                        <input type="text" name="title" class="form-control" value={item.title || ''} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>活动时间</label>
                            <input type="text" name="time" class="form-control" value={item.time || ''} />
                        </div>
                        <div class="form-group">
                            <label>活动地点</label>
                            <input type="text" name="address" class="form-control" value={item.address || ''} />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>相关国家</label>
                        <input type="text" name="guojia" class="form-control" value={item.guojia || ''} />
                    </div>
                    <div class="form-group">
                        <label>活动详情</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value={item.content || ''} />
                    </div>
                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" value={item.pic || ''} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/events" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/events/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    await db.update(jiangzuo).set({
        title: body.title as string,
        time: body.time as string,
        address: body.address as string,
        guojia: body.guojia as string,
        content: body.content as string,
        pic: body.pic as string,
    }).where(eq(jiangzuo.id, id));

    return c.redirect('/admin/events');
});

app.post('/events/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    await db.delete(jiangzuo).where(eq(jiangzuo.id, id));
    return c.redirect('/admin/events');
});

export default app;
