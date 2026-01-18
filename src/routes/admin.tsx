// Admin Routes - 后台管理路由
// 包含登录、控制面板、新闻管理、项目管理等

import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';
import { eq, desc, asc, like, and, sql } from 'drizzle-orm';
import { user, info, newsClass, xm, guojia, zhou, anli, team, jiangzuo, pinggu, ad } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { AdminLayout } from '../components/AdminLayout';
import { newsSchema, projectSchema, formatZodErrors, type NewsInput, type ProjectInput } from '../validations';
import type { AppEnv } from '../types';

const app = new Hono<AppEnv>();

// ==================== 登录相关 ====================

// 登录页面
app.get('/login', (c) => {
    return c.html(
        <html lang="zh-CN">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>后台登录 - NewVisas</title>
                <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .login-box {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
          }
          h1 { text-align: center; margin-bottom: 30px; color: #333; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 8px; color: #555; }
          input { 
            width: 100%; 
            padding: 12px 16px; 
            border: 2px solid #e1e1e1; 
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
          }
          input:focus { outline: none; border-color: #667eea; }
          button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102,126,234,0.4); }
          .error { color: #e74c3c; text-align: center; margin-bottom: 20px; }
        `}</style>
            </head>
            <body>
                <div class="login-box">
                    <h1>后台管理系统</h1>
                    <form method="post" action="/admin/login">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" name="username" placeholder="请输入用户名" required />
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" name="password" placeholder="请输入密码" required />
                        </div>
                        <button type="submit">登 录</button>
                    </form>
                </div>
            </body>
        </html>
    );
});

// 处理登录
app.post('/login', async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();
    const username = body.username as string;
    const password = body.password as string;

    // 查找用户 (注意：旧系统密码可能是明文或MD5)
    const [admin] = await db
        .select()
        .from(user)
        .where(eq(user.username, username))
        .limit(1);

    if (!admin || admin.password !== password) {
        return c.html(
            <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8" />
                    <title>登录失败</title>
                    <style>{`
            body { font-family: system-ui; text-align: center; padding: 50px; }
            .error { color: #e74c3c; margin-bottom: 20px; }
            a { color: #667eea; text-decoration: none; }
          `}</style>
                </head>
                <body>
                    <div class="error">用户名或密码错误</div>
                    <a href="/admin/login">返回登录</a>
                </body>
            </html>,
            401
        );
    }

    // 生成 JWT Token
    const token = await sign(
        {
            sub: admin.id.toString(),
            username: admin.username,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7天
        },
        c.env.JWT_SECRET
    );

    // 设置 Cookie
    setCookie(c, 'auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    return c.redirect('/admin/dashboard');
});

// 登出
app.get('/logout', (c) => {
    deleteCookie(c, 'auth_token');
    return c.redirect('/admin/login');
});

// ==================== 需要认证的路由 ====================

// 控制面板
app.get('/dashboard', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    // 获取统计数据
    const [newsCount] = await db.select({ count: sql<number>`count(*)` }).from(info);
    const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(xm);
    const [caseCount] = await db.select({ count: sql<number>`count(*)` }).from(anli);
    const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(team);

    return c.html(
        <AdminLayout title="控制面板" username={currentUser?.username}>
            <div class="card">
                <h3 style={{ marginBottom: '20px' }}>欢迎回来！</h3>
                <p>系统运行正常，您可以通过左侧菜单管理网站内容。</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>📰</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{newsCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>新闻资讯</div>
                </div>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>🌍</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{projectCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>移民项目</div>
                </div>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>✅</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{caseCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>成功案例</div>
                </div>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>👥</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{teamCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>团队成员</div>
                </div>
            </div>
        </AdminLayout>
    );
});

// ==================== 新闻管理 ====================

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

// ==================== 项目管理 ====================

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

// ==================== 案例管理 ====================

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

// ==================== 团队管理 ====================

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

// ==================== 活动管理 ====================

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

// ==================== 评估申请管理 ====================

// 评估申请列表
app.get('/pinggu', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const status = c.req.query('status') || '';
    const pageSize = 15;

    let conditions = [];
    if (status !== '') {
        conditions.push(eq(pinggu.status, parseInt(status)));
    }

    const pingguQuery = db
        .select()
        .from(pinggu)
        .orderBy(desc(pinggu.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    if (conditions.length > 0) {
        pingguQuery.where(and(...conditions));
    }

    const pingguList = await pingguQuery;

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(pinggu);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="评估申请管理" username={currentUser?.username}>
            <div class="toolbar">
                <form method="get" style={{ display: 'flex', gap: '10px' }}>
                    <select name="status" class="form-control" style={{ width: '150px' }}>
                        <option value="">全部状态</option>
                        <option value="0" selected={status === '0'}>未处理</option>
                        <option value="1" selected={status === '1'}>已处理</option>
                    </select>
                    <button type="submit" class="btn btn-secondary">筛选</button>
                </form>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th>姓名</th>
                            <th>电话</th>
                            <th>目标国家</th>
                            <th style={{ width: '100px' }}>状态</th>
                            <th style={{ width: '160px' }}>提交时间</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pingguList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>{item.name}</td>
                                <td>{item.phone}</td>
                                <td>{item.targetCountry}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        background: item.status === 0 ? '#fff3cd' : '#d4edda',
                                        color: item.status === 0 ? '#856404' : '#155724'
                                    }}>
                                        {item.status === 0 ? '未处理' : '已处理'}
                                    </span>
                                </td>
                                <td>{item.createdAt?.substring(0, 16)}</td>
                                <td class="action-btns">
                                    <a href={`/admin/pinggu/${item.id}`} class="btn btn-secondary btn-sm">查看</a>
                                    {item.status === 0 && (
                                        <form method="post" action={`/admin/pinggu/process/${item.id}`} style={{ display: 'inline' }}>
                                            <button type="submit" class="btn btn-primary btn-sm">处理</button>
                                        </form>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {pingguList.length === 0 && (
                            <tr><td colspan="7" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无数据</td></tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div class="pagination">
                        {page > 1 && <a href={`/admin/pinggu?page=${page - 1}&status=${status}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/pinggu?page=${p}&status=${status}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/pinggu?page=${page + 1}&status=${status}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 评估申请详情
app.get('/pinggu/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [item] = await db.select().from(pinggu).where(eq(pinggu.id, id)).limit(1);
    if (!item) return c.redirect('/admin/pinggu');

    return c.html(
        <AdminLayout title="评估申请详情" username={currentUser?.username}>
            <div class="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>申请 #{item.id}</h3>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: item.status === 0 ? '#fff3cd' : '#d4edda',
                        color: item.status === 0 ? '#856404' : '#155724'
                    }}>
                        {item.status === 0 ? '未处理' : '已处理'}
                    </span>
                </div>

                <table class="table">
                    <tbody>
                        <tr><td style={{ width: '150px', fontWeight: 'bold' }}>姓名</td><td>{item.name}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>性别</td><td>{item.gender}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>电话</td><td>{item.phone} {item.phone2 && `/ ${item.phone2}`}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>邮箱</td><td>{item.email}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>生日</td><td>{item.birthday}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>目标国家</td><td>{item.targetCountry} {item.targetCountry2 && `/ ${item.targetCountry2}`}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>移民意向</td><td>{item.intention}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>回电时间</td><td>{item.callbackTime}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>预算</td><td>{item.budget}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>英语水平</td><td>{item.english}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>是否法人</td><td>{item.legalPerson}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>是否股东</td><td>{item.shareholder}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>职位</td><td>{item.position}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>企业名称</td><td>{item.company}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>推荐来源</td><td>{item.referral}</td></tr>
                        <tr><td style={{ fontWeight: 'bold' }}>提交时间</td><td>{item.createdAt}</td></tr>
                        {item.processedAt && <tr><td style={{ fontWeight: 'bold' }}>处理时间</td><td>{item.processedAt}</td></tr>}
                    </tbody>
                </table>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {item.status === 0 && (
                        <form method="post" action={`/admin/pinggu/process/${item.id}`}>
                            <button type="submit" class="btn btn-primary">标记为已处理</button>
                        </form>
                    )}
                    <a href="/admin/pinggu" class="btn btn-secondary">返回列表</a>
                </div>
            </div>
        </AdminLayout>
    );
});

// 处理评估申请
app.post('/pinggu/process/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    await db.update(pinggu).set({
        status: 1,
        processedAt: new Date().toISOString(),
    }).where(eq(pinggu.id, id));

    return c.redirect('/admin/pinggu');
});

// ==================== 广告管理 ====================

// 广告列表
app.get('/ads', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    // 获取所有广告
    const adList = await db
        .select()
        .from(ad)
        .orderBy(desc(ad.id));

    return c.html(
        <AdminLayout title="广告管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/ads/add" class="btn btn-primary">+ 添加广告</a>
            </div>

            <div class="card">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {adList.map(item => (
                        <div style={{
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            padding: '15px',
                            background: '#fafafa'
                        }}>
                            {item.pic && (
                                <a href={item.url || '#'} target="_blank" style={{ display: 'block', marginBottom: '10px' }}>
                                    <img
                                        src={item.pic}
                                        alt={item.title || ''}
                                        style={{ width: '100%', borderRadius: '6px', display: 'block' }}
                                    />
                                </a>
                            )}
                            <div style={{ marginBottom: '10px' }}>
                                <strong>{item.title}</strong>
                                <span style={{
                                    marginLeft: '10px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    background: item.status === 1 ? '#d4edda' : '#f8d7da',
                                    color: item.status === 1 ? '#155724' : '#721c24'
                                }}>
                                    {item.status === 1 ? '启用' : '暂停'}
                                </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                                链接: {item.url || '-'}
                            </div>
                            <div class="action-btns">
                                <a href={`/admin/ads/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                <form method="post" action={`/admin/ads/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除此广告吗？删除后将不可恢复！')">
                                    <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                </form>
                            </div>
                        </div>
                    ))}
                    {adList.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px', gridColumn: '1 / -1' }}>
                            暂无广告
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
});

// 添加广告页面
app.get('/ads/add', authMiddleware, async (c) => {
    const currentUser = c.get('user');

    return c.html(
        <AdminLayout title="添加广告" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/ads/add">
                    <div class="form-group">
                        <label>广告名称 *</label>
                        <input type="text" name="title" class="form-control" required />
                        <p style={{ color: '#999', fontSize: '13px', marginTop: '5px' }}>
                            推荐图片尺寸: 760×560 或 1100×400
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>广告图片 *</label>
                            <input type="text" name="pic" class="form-control" placeholder="图片URL，如 /uploads/ad.jpg" required />
                            <p style={{ color: '#999', fontSize: '13px', marginTop: '5px' }}>
                                可通过 <a href="/admin/upload-page" target="_blank">上传工具</a> 上传图片获取URL
                            </p>
                        </div>
                        <div class="form-group">
                            <label>链接地址</label>
                            <input type="text" name="url" class="form-control" placeholder="点击广告跳转的URL" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">提交</button>
                        <a href="/admin/ads" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理添加广告
app.post('/ads/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    const title = body.title as string;
    const pic = body.pic as string;
    const url = body.url as string || '';

    if (!title || !pic) {
        return c.html(
            <html>
                <body>
                    <h3>数据不能为空！</h3>
                    <a href="/admin/ads/add">返回</a>
                </body>
            </html>,
            400
        );
    }

    await db.insert(ad).values({
        title,
        pic,
        url,
        status: 1,
        createdAt: new Date().toISOString(),
    });

    return c.redirect('/admin/ads');
});

// 编辑广告页面
app.get('/ads/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [adItem] = await db.select().from(ad).where(eq(ad.id, id)).limit(1);
    if (!adItem) {
        return c.redirect('/admin/ads');
    }

    return c.html(
        <AdminLayout title="修改广告" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/ads/edit/${id}`}>
                    <div class="form-group">
                        <label>广告名称 *</label>
                        <input type="text" name="title" class="form-control" value={adItem.title || ''} required />
                        <p style={{ color: '#999', fontSize: '13px', marginTop: '5px' }}>
                            推荐图片尺寸: 760×560 或 1100×400
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>广告图片 *</label>
                            <input type="text" name="pic" class="form-control" value={adItem.pic || ''} required />
                            {adItem.pic && (
                                <img src={adItem.pic} alt="预览" style={{ maxWidth: '300px', marginTop: '10px', borderRadius: '6px' }} />
                            )}
                        </div>
                        <div class="form-group">
                            <label>链接地址</label>
                            <input type="text" name="url" class="form-control" value={adItem.url || ''} />
                        </div>
                    </div>

                    <div class="form-group">
                        <label>状态</label>
                        <select name="status" class="form-control" style={{ width: '200px' }}>
                            <option value="1" selected={adItem.status === 1}>启用</option>
                            <option value="0" selected={adItem.status === 0}>暂停</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">修改</button>
                        <a href="/admin/ads" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理编辑广告
app.post('/ads/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    const title = body.title as string;
    const pic = body.pic as string;
    const url = body.url as string || '';
    const status = parseInt(body.status as string) || 0;

    if (!title || !pic) {
        return c.redirect(`/admin/ads/edit/${id}?error=1`);
    }

    await db.update(ad).set({
        title,
        pic,
        url,
        status,
    }).where(eq(ad.id, id));

    return c.redirect('/admin/ads');
});

// 删除广告
app.post('/ads/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    await db.delete(ad).where(eq(ad.id, id));

    return c.redirect('/admin/ads');
});

// ==================== 上传工具页面 ====================

app.get('/upload-page', authMiddleware, async (c) => {
    const currentUser = c.get('user');

    return c.html(
        <AdminLayout title="上传图片" username={currentUser?.username}>
            <div class="card">
                <h3 style={{ marginBottom: '20px' }}>图片上传工具</h3>

                <div class="form-group">
                    <label>选择图片</label>
                    <input type="file" id="fileInput" accept="image/*" class="form-control" />
                    <p style={{ color: '#999', fontSize: '13px', marginTop: '5px' }}>
                        支持 JPG, PNG, GIF, WEBP 格式，最大 5MB
                    </p>
                </div>

                <button onclick="uploadFile()" class="btn btn-primary">上传</button>

                <div id="result" style={{ marginTop: '20px' }}></div>
            </div>

            <script>{`
                async function uploadFile() {
                    const fileInput = document.getElementById('fileInput');
                    const resultDiv = document.getElementById('result');
                    
                    if (!fileInput.files || !fileInput.files[0]) {
                        resultDiv.innerHTML = '<div class="alert alert-error">请选择文件</div>';
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    
                    resultDiv.innerHTML = '<p>上传中...</p>';
                    
                    try {
                        const response = await fetch('/admin/upload', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            resultDiv.innerHTML = \`
                                <div class="alert alert-success">上传成功!</div>
                                <p><strong>URL:</strong> <input type="text" value="\${data.url}" onclick="this.select()" class="form-control" readonly /></p>
                                <p><img src="\${data.url}" style="max-width: 300px; margin-top: 10px;" /></p>
                            \`;
                        } else {
                            resultDiv.innerHTML = '<div class="alert alert-error">' + data.error + '</div>';
                        }
                    } catch (err) {
                        resultDiv.innerHTML = '<div class="alert alert-error">上传失败: ' + err.message + '</div>';
                    }
                }
            `}</script>
        </AdminLayout>
    );
});

// 注册上传路由
import uploadRoutes from './upload';
app.route('/', uploadRoutes);

export default app;
