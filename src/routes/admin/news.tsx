// Admin News Routes - 新闻管理
import { Hono } from 'hono';
import { eq, desc, asc, like, and, sql } from 'drizzle-orm';
import { info, newsClass } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import { newsSchema, formatZodErrors, type NewsInput } from '../../validations';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 新闻列表
app.get('/news', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const search = c.req.query('search') || '';
    const classId = c.req.query('class') || '';
    const pageSize = 15;

    // 获取分类列表
    const categories = await db.select().from(newsClass).orderBy(asc(newsClass.sortOrder));

    // 构建查询条件
    let conditions = [];
    if (search) {
        conditions.push(like(info.title, `%${search}%`));
    }
    if (classId) {
        conditions.push(eq(info.classId, parseInt(classId)));
    }

    // 查询新闻列表
    const newsQuery = db
        .select({
            id: info.id,
            title: info.title,
            classId: info.classId,
            createdAt: info.createdAt,
            hits: info.hits,
        })
        .from(info)
        .orderBy(desc(info.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    if (conditions.length > 0) {
        newsQuery.where(and(...conditions));
    }

    const newsList = await newsQuery;

    // 获取总数
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(info);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="新闻管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/news/add" class="btn btn-primary">+ 添加新闻</a>
                <form method="get" style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="search" placeholder="搜索标题..." value={search} class="form-control" style={{ width: '200px' }} />
                    <select name="class" class="form-control" style={{ width: '150px' }}>
                        <option value="">全部分类</option>
                        {categories.map(cat => (
                            <option value={cat.id.toString()} selected={classId === cat.id.toString()}>{cat.name}</option>
                        ))}
                    </select>
                    <button type="submit" class="btn btn-secondary">搜索</button>
                </form>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th>标题</th>
                            <th style={{ width: '120px' }}>分类</th>
                            <th style={{ width: '100px' }}>浏览</th>
                            <th style={{ width: '160px' }}>发布时间</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newsList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>
                                    <a href={`/news/${item.id}`} target="_blank" style={{ color: '#333', textDecoration: 'none' }}>
                                        {item.title?.substring(0, 50)}
                                    </a>
                                </td>
                                <td>{categories.find(c => c.id === item.classId)?.name || '-'}</td>
                                <td>{item.hits}</td>
                                <td>{item.createdAt?.substring(0, 10)}</td>
                                <td class="action-btns">
                                    <a href={`/admin/news/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                    <form method="post" action={`/admin/news/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除这条新闻吗？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {newsList.length === 0 && (
                            <tr>
                                <td colspan="6" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                    暂无数据
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div class="pagination">
                        {page > 1 && <a href={`/admin/news?page=${page - 1}&search=${search}&class=${classId}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/news?page=${p}&search=${search}&class=${classId}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/news?page=${page + 1}&search=${search}&class=${classId}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 添加新闻页面
app.get('/news/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    const categories = await db.select().from(newsClass).orderBy(asc(newsClass.sortOrder));

    return c.html(
        <AdminLayout title="添加新闻" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/news/add" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>新闻标题 *</label>
                        <input type="text" name="title" class="form-control" required />
                    </div>

                    <div class="form-group">
                        <label>分类</label>
                        <select name="classId" class="form-control">
                            <option value="">请选择分类</option>
                            {categories.map(cat => (
                                <option value={String(cat.id)}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>关键词</label>
                        <input type="text" name="keywords" class="form-control" placeholder="多个关键词用逗号分隔" />
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <textarea name="description" class="form-control" rows="3" placeholder="新闻简介"></textarea>
                    </div>

                    <div class="form-group">
                        <label>内容</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value="" />
                    </div>

                    <div class="form-group">
                        <label>来源</label>
                        <input type="text" name="source" class="form-control" placeholder="新闻来源" />
                    </div>

                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" placeholder="图片URL，如 /uploads/xxx.jpg" />
                        <p style={{ color: '#999', fontSize: '13px', marginTop: '5px' }}>
                            可通过 <a href="/admin/upload-page" target="_blank">上传工具</a> 上传图片获取URL
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/news" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理添加新闻
app.post('/news/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    const data: NewsInput = {
        title: body.title as string,
        classId: body.classId ? parseInt(body.classId as string) : undefined,
        keywords: body.keywords as string,
        description: body.description as string,
        content: body.content as string,
        source: body.source as string,
        pic: body.pic as string,
    };

    // 验证
    const result = newsSchema.safeParse(data);
    if (!result.success) {
        const errors = formatZodErrors(result.error);
        return c.html(
            <html>
                <body>
                    <h3>验证错误</h3>
                    <ul>
                        {Object.entries(errors).map(([field, msg]) => (
                            <li>{field}: {msg}</li>
                        ))}
                    </ul>
                    <a href="/admin/news/add">返回</a>
                </body>
            </html>,
            400
        );
    }

    // 插入数据
    await db.insert(info).values({
        title: result.data.title,
        classId: result.data.classId,
        keywords: result.data.keywords,
        description: result.data.description,
        content: result.data.content,
        source: result.data.source,
        pic: result.data.pic,
        createdAt: new Date().toISOString(),
        hits: 0,
    });

    return c.redirect('/admin/news');
});

// 编辑新闻页面
app.get('/news/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [newsItem] = await db.select().from(info).where(eq(info.id, id)).limit(1);
    if (!newsItem) {
        return c.redirect('/admin/news');
    }

    const categories = await db.select().from(newsClass).orderBy(asc(newsClass.sortOrder));

    return c.html(
        <AdminLayout title="编辑新闻" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/news/edit/${id}`}>
                    <div class="form-group">
                        <label>新闻标题 *</label>
                        <input type="text" name="title" class="form-control" value={newsItem.title || ''} required />
                    </div>

                    <div class="form-group">
                        <label>分类</label>
                        <select name="classId" class="form-control">
                            <option value="">请选择分类</option>
                            {categories.map(cat => (
                                <option value={String(cat.id)} selected={cat.id === newsItem.classId}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>关键词</label>
                        <input type="text" name="keywords" class="form-control" value={newsItem.keywords || ''} />
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <textarea name="description" class="form-control" rows="3">{newsItem.description}</textarea>
                    </div>

                    <div class="form-group">
                        <label>内容</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value={newsItem.content || ''} />
                    </div>

                    <div class="form-group">
                        <label>来源</label>
                        <input type="text" name="source" class="form-control" value={newsItem.source || ''} />
                    </div>

                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" value={newsItem.pic || ''} />
                        {newsItem.pic && (
                            <img src={newsItem.pic} alt="封面" style={{ maxWidth: '200px', marginTop: '10px' }} />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/news" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理编辑新闻
app.post('/news/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    const data: NewsInput = {
        title: body.title as string,
        classId: body.classId ? parseInt(body.classId as string) : undefined,
        keywords: body.keywords as string,
        description: body.description as string,
        content: body.content as string,
        source: body.source as string,
        pic: body.pic as string,
    };

    // 验证
    const result = newsSchema.safeParse(data);
    if (!result.success) {
        return c.redirect(`/admin/news/edit/${id}?error=1`);
    }

    // 更新数据
    await db.update(info)
        .set({
            title: result.data.title,
            classId: result.data.classId,
            keywords: result.data.keywords,
            description: result.data.description,
            content: result.data.content,
            source: result.data.source,
            pic: result.data.pic,
        })
        .where(eq(info.id, id));

    return c.redirect('/admin/news');
});

// 删除新闻
app.post('/news/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    await db.delete(info).where(eq(info.id, id));

    return c.redirect('/admin/news');
});

export default app;
