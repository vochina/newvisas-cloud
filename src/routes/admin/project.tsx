// Admin Project Routes - 项目管理
import { Hono } from 'hono';
import { eq, desc, asc, like, and, sql } from 'drizzle-orm';
import { xm, guojia, zhou } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import { projectSchema, formatZodErrors, type ProjectInput } from '../../validations';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 项目列表
app.get('/projects', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const search = c.req.query('search') || '';
    const countryId = c.req.query('country') || '';
    const pageSize = 15;

    // 获取国家列表
    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));

    // 查询项目列表
    let conditions = [];
    if (search) {
        conditions.push(like(xm.title, `%${search}%`));
    }
    if (countryId) {
        conditions.push(eq(xm.guojiaId, parseInt(countryId)));
    }

    const projectsQuery = db
        .select({
            id: xm.id,
            title: xm.title,
            guojiaId: xm.guojiaId,
            createdAt: xm.createdAt,
            hits: xm.hits,
        })
        .from(xm)
        .orderBy(desc(xm.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    if (conditions.length > 0) {
        projectsQuery.where(and(...conditions));
    }

    const projectList = await projectsQuery;

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(xm);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="项目管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/projects/add" class="btn btn-primary">+ 添加项目</a>
                <form method="get" style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="search" placeholder="搜索项目..." value={search} class="form-control" style={{ width: '200px' }} />
                    <select name="country" class="form-control" style={{ width: '150px' }}>
                        <option value="">全部国家</option>
                        {countries.map(c => (
                            <option value={c.id.toString()} selected={countryId === c.id.toString()}>{c.name}</option>
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
                            <th>项目名称</th>
                            <th style={{ width: '120px' }}>国家</th>
                            <th style={{ width: '100px' }}>浏览</th>
                            <th style={{ width: '160px' }}>发布时间</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>
                                    <a href={`/program/${item.id}`} target="_blank" style={{ color: '#333', textDecoration: 'none' }}>
                                        {item.title?.substring(0, 50)}
                                    </a>
                                </td>
                                <td>{countries.find(c => c.id === item.guojiaId)?.name || '-'}</td>
                                <td>{item.hits}</td>
                                <td>{item.createdAt?.substring(0, 10)}</td>
                                <td class="action-btns">
                                    <a href={`/admin/projects/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                    <form method="post" action={`/admin/projects/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除这个项目吗？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {projectList.length === 0 && (
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
                        {page > 1 && <a href={`/admin/projects?page=${page - 1}&search=${search}&country=${countryId}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/projects?page=${p}&search=${search}&country=${countryId}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/projects?page=${page + 1}&search=${search}&country=${countryId}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 添加项目页面
app.get('/projects/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));
    const continents = await db.select().from(zhou).orderBy(asc(zhou.sortOrder));

    return c.html(
        <AdminLayout title="添加项目" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/projects/add">
                    <div class="form-group">
                        <label>项目名称 *</label>
                        <input type="text" name="title" class="form-control" required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>所属洲</label>
                            <select name="zhouId" class="form-control">
                                <option value="">请选择</option>
                                {continents.map(z => (
                                    <option value={String(z.id)}>{z.name}</option>
                                ))}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>所属国家 *</label>
                            <select name="guojiaId" class="form-control" required>
                                <option value="">请选择国家</option>
                                {countries.map(c => (
                                    <option value={String(c.id)}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>关键词</label>
                        <input type="text" name="keywords" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <div id="editor-description" class="quill-editor" data-field="description"></div>
                        <input type="hidden" name="description" id="input-description" value="" />
                    </div>

                    <div class="form-group">
                        <label>项目优势</label>
                        <div id="editor-advantages" class="quill-editor" data-field="advantages"></div>
                        <input type="hidden" name="advantages" id="input-advantages" value="" />
                    </div>

                    <div class="form-group">
                        <label>申请条件</label>
                        <div id="editor-conditions" class="quill-editor" data-field="conditions"></div>
                        <input type="hidden" name="conditions" id="input-conditions" value="" />
                    </div>

                    <div class="form-group">
                        <label>办理流程</label>
                        <div id="editor-process" class="quill-editor" data-field="process"></div>
                        <input type="hidden" name="process" id="input-process" value="" />
                    </div>

                    <div class="form-group">
                        <label>详细内容</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value="" />
                    </div>

                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" placeholder="图片URL" />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/projects" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理添加项目
app.post('/projects/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    const data: ProjectInput = {
        title: body.title as string,
        zhouId: body.zhouId ? parseInt(body.zhouId as string) : undefined,
        guojiaId: parseInt(body.guojiaId as string),
        keywords: body.keywords as string,
        description: body.description as string,
        content: body.content as string,
        advantages: body.advantages as string,
        process: body.process as string,
        conditions: body.conditions as string,
        pic: body.pic as string,
    };

    const result = projectSchema.safeParse(data);
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
                    <a href="/admin/projects/add">返回</a>
                </body>
            </html>,
            400
        );
    }

    await db.insert(xm).values({
        title: result.data.title,
        zhouId: result.data.zhouId,
        guojiaId: result.data.guojiaId,
        keywords: result.data.keywords,
        description: result.data.description,
        content: result.data.content,
        advantages: result.data.advantages,
        process: result.data.process,
        conditions: result.data.conditions,
        pic: result.data.pic,
        createdAt: new Date().toISOString(),
        hits: 0,
    });

    return c.redirect('/admin/projects');
});

// 编辑项目页面
app.get('/projects/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [project] = await db.select().from(xm).where(eq(xm.id, id)).limit(1);
    if (!project) {
        return c.redirect('/admin/projects');
    }

    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));
    const continents = await db.select().from(zhou).orderBy(asc(zhou.sortOrder));

    return c.html(
        <AdminLayout title="编辑项目" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/projects/edit/${id}`}>
                    <div class="form-group">
                        <label>项目名称 *</label>
                        <input type="text" name="title" class="form-control" value={project.title || ''} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>所属洲</label>
                            <select name="zhouId" class="form-control">
                                <option value="">请选择</option>
                                {continents.map(z => (
                                    <option value={String(z.id)} selected={z.id === project.zhouId}>{z.name}</option>
                                ))}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>所属国家 *</label>
                            <select name="guojiaId" class="form-control" required>
                                <option value="">请选择国家</option>
                                {countries.map(ctry => (
                                    <option value={String(ctry.id)} selected={ctry.id === project.guojiaId}>{ctry.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>关键词</label>
                        <input type="text" name="keywords" class="form-control" value={project.keywords || ''} />
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <div id="editor-description" class="quill-editor" data-field="description"></div>
                        <input type="hidden" name="description" id="input-description" value={project.description || ''} />
                    </div>

                    <div class="form-group">
                        <label>项目优势</label>
                        <div id="editor-advantages" class="quill-editor" data-field="advantages"></div>
                        <input type="hidden" name="advantages" id="input-advantages" value={project.advantages || ''} />
                    </div>

                    <div class="form-group">
                        <label>申请条件</label>
                        <div id="editor-conditions" class="quill-editor" data-field="conditions"></div>
                        <input type="hidden" name="conditions" id="input-conditions" value={project.conditions || ''} />
                    </div>

                    <div class="form-group">
                        <label>办理流程</label>
                        <div id="editor-process" class="quill-editor" data-field="process"></div>
                        <input type="hidden" name="process" id="input-process" value={project.process || ''} />
                    </div>

                    <div class="form-group">
                        <label>详细内容</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value={project.content || ''} />
                    </div>

                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" value={project.pic || ''} />
                        {project.pic && (
                            <img src={project.pic} alt="封面" style={{ maxWidth: '200px', marginTop: '10px' }} />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/projects" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理编辑项目
app.post('/projects/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    const data: ProjectInput = {
        title: body.title as string,
        zhouId: body.zhouId ? parseInt(body.zhouId as string) : undefined,
        guojiaId: parseInt(body.guojiaId as string),
        keywords: body.keywords as string,
        description: body.description as string,
        content: body.content as string,
        advantages: body.advantages as string,
        process: body.process as string,
        conditions: body.conditions as string,
        pic: body.pic as string,
    };

    const result = projectSchema.safeParse(data);
    if (!result.success) {
        return c.redirect(`/admin/projects/edit/${id}?error=1`);
    }

    await db.update(xm)
        .set({
            title: result.data.title,
            zhouId: result.data.zhouId,
            guojiaId: result.data.guojiaId,
            keywords: result.data.keywords,
            description: result.data.description,
            content: result.data.content,
            advantages: result.data.advantages,
            process: result.data.process,
            conditions: result.data.conditions,
            pic: result.data.pic,
        })
        .where(eq(xm.id, id));

    return c.redirect('/admin/projects');
});

// 删除项目
app.post('/projects/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    await db.delete(xm).where(eq(xm.id, id));

    return c.redirect('/admin/projects');
});

export default app;
