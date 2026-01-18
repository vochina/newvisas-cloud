// Admin Case Routes - 案例管理
import { Hono } from 'hono';
import { eq, desc, asc, like, and, sql } from 'drizzle-orm';
import { anli, guojia } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 案例列表
app.get('/cases', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const search = c.req.query('search') || '';
    const pageSize = 15;

    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));

    let conditions = [];
    if (search) {
        conditions.push(like(anli.title, `%${search}%`));
    }

    const casesQuery = db
        .select()
        .from(anli)
        .orderBy(desc(anli.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    if (conditions.length > 0) {
        casesQuery.where(and(...conditions));
    }

    const casesList = await casesQuery;

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(anli);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="案例管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/cases/add" class="btn btn-primary">+ 添加案例</a>
                <form method="get" style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="search" placeholder="搜索案例..." value={search} class="form-control" style={{ width: '200px' }} />
                    <button type="submit" class="btn btn-secondary">搜索</button>
                </form>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th>案例标题</th>
                            <th style={{ width: '120px' }}>国家</th>
                            <th style={{ width: '100px' }}>浏览</th>
                            <th style={{ width: '160px' }}>发布时间</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {casesList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>{item.title?.substring(0, 50)}</td>
                                <td>{countries.find(c => c.id === item.guojiaId)?.name || '-'}</td>
                                <td>{item.hits}</td>
                                <td>{item.createdAt?.substring(0, 10)}</td>
                                <td class="action-btns">
                                    <a href={`/admin/cases/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                    <form method="post" action={`/admin/cases/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {casesList.length === 0 && (
                            <tr><td colspan="6" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无数据</td></tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div class="pagination">
                        {page > 1 && <a href={`/admin/cases?page=${page - 1}&search=${search}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/cases?page=${p}&search=${search}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/cases?page=${page + 1}&search=${search}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 添加案例
app.get('/cases/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));

    return c.html(
        <AdminLayout title="添加案例" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/cases/add">
                    <div class="form-group">
                        <label>案例标题 *</label>
                        <input type="text" name="title" class="form-control" required />
                    </div>
                    <div class="form-group">
                        <label>所属国家</label>
                        <select name="guojiaId" class="form-control">
                            <option value="">请选择</option>
                            {countries.map(c => (<option value={String(c.id)}>{c.name}</option>))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>内容</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value="" />
                    </div>
                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" placeholder="图片URL" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/cases" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/cases/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    await db.insert(anli).values({
        title: body.title as string,
        guojiaId: body.guojiaId ? parseInt(body.guojiaId as string) : null,
        content: body.content as string,
        pic: body.pic as string,
        createdAt: new Date().toISOString(),
        hits: 0,
    });

    return c.redirect('/admin/cases');
});

// 编辑案例
app.get('/cases/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [item] = await db.select().from(anli).where(eq(anli.id, id)).limit(1);
    if (!item) return c.redirect('/admin/cases');

    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));

    return c.html(
        <AdminLayout title="编辑案例" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/cases/edit/${id}`}>
                    <div class="form-group">
                        <label>案例标题 *</label>
                        <input type="text" name="title" class="form-control" value={item.title || ''} required />
                    </div>
                    <div class="form-group">
                        <label>所属国家</label>
                        <select name="guojiaId" class="form-control">
                            <option value="">请选择</option>
                            {countries.map(ctry => (<option value={String(ctry.id)} selected={ctry.id === item.guojiaId}>{ctry.name}</option>))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>内容</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value={item.content || ''} />
                    </div>
                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" value={item.pic || ''} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/cases" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/cases/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    await db.update(anli).set({
        title: body.title as string,
        guojiaId: body.guojiaId ? parseInt(body.guojiaId as string) : null,
        content: body.content as string,
        pic: body.pic as string,
    }).where(eq(anli.id, id));

    return c.redirect('/admin/cases');
});

app.post('/cases/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    await db.delete(anli).where(eq(anli.id, id));
    return c.redirect('/admin/cases');
});

export default app;
