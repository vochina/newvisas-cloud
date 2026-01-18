// Admin Team Routes - 团队管理
import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { team } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 团队列表
app.get('/team', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 15;

    const teamList = await db
        .select()
        .from(team)
        .orderBy(asc(team.sortOrder))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(team);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="团队管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/team/add" class="btn btn-primary">+ 添加成员</a>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th>姓名</th>
                            <th>职务</th>
                            <th style={{ width: '80px' }}>排序</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>{item.name}</td>
                                <td>{item.title}</td>
                                <td>{item.sortOrder}</td>
                                <td class="action-btns">
                                    <a href={`/admin/team/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                    <form method="post" action={`/admin/team/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {teamList.length === 0 && (
                            <tr><td colspan="5" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无数据</td></tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div class="pagination">
                        {page > 1 && <a href={`/admin/team?page=${page - 1}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/team?page=${p}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/team?page=${page + 1}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 添加团队成员
app.get('/team/add', authMiddleware, async (c) => {
    const currentUser = c.get('user');

    return c.html(
        <AdminLayout title="添加团队成员" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/team/add">
                    <div class="form-group">
                        <label>姓名 *</label>
                        <input type="text" name="name" class="form-control" required />
                    </div>
                    <div class="form-group">
                        <label>职务</label>
                        <input type="text" name="title" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>简介</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value="" />
                    </div>
                    <div class="form-group">
                        <label>头像</label>
                        <input type="text" name="pic" class="form-control" placeholder="图片URL" />
                    </div>
                    <div class="form-group">
                        <label>排序 (数字越小越靠前)</label>
                        <input type="number" name="sortOrder" class="form-control" value="0" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/team" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/team/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    await db.insert(team).values({
        name: body.name as string,
        title: body.title as string,
        content: body.content as string,
        pic: body.pic as string,
        sortOrder: parseInt(body.sortOrder as string) || 0,
        createdAt: new Date().toISOString(),
        hits: 0,
    });

    return c.redirect('/admin/team');
});

// 编辑团队成员
app.get('/team/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [item] = await db.select().from(team).where(eq(team.id, id)).limit(1);
    if (!item) return c.redirect('/admin/team');

    return c.html(
        <AdminLayout title="编辑团队成员" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/team/edit/${id}`}>
                    <div class="form-group">
                        <label>姓名 *</label>
                        <input type="text" name="name" class="form-control" value={item.name || ''} required />
                    </div>
                    <div class="form-group">
                        <label>职务</label>
                        <input type="text" name="title" class="form-control" value={item.title || ''} />
                    </div>
                    <div class="form-group">
                        <label>简介</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value={item.content || ''} />
                    </div>
                    <div class="form-group">
                        <label>头像</label>
                        <input type="text" name="pic" class="form-control" value={item.pic || ''} />
                    </div>
                    <div class="form-group">
                        <label>排序</label>
                        <input type="number" name="sortOrder" class="form-control" value={String(item.sortOrder || 0)} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/team" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/team/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    await db.update(team).set({
        name: body.name as string,
        title: body.title as string,
        content: body.content as string,
        pic: body.pic as string,
        sortOrder: parseInt(body.sortOrder as string) || 0,
    }).where(eq(team.id, id));

    return c.redirect('/admin/team');
});

app.post('/team/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    await db.delete(team).where(eq(team.id, id));
    return c.redirect('/admin/team');
});

export default app;
