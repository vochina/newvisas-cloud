// Admin Country Routes - 国家管理
import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { guojia, zhou } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 国家列表
app.get('/countries', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 15;

    // 获取所有大洲用于筛选
    const zhouList = await db.select().from(zhou).orderBy(asc(zhou.sortOrder));

    const countryList = await db
        .select({
            id: guojia.id,
            name: guojia.name,
            nameEn: guojia.nameEn,
            zhouId: guojia.zhouId,
            sortOrder: guojia.sortOrder,
            flag: guojia.flag,
            zhouName: zhou.name,
        })
        .from(guojia)
        .leftJoin(zhou, eq(guojia.zhouId, zhou.id))
        .orderBy(asc(guojia.sortOrder))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(guojia);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="国家管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/countries/add" class="btn btn-primary">+ 添加国家</a>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th style={{ width: '80px' }}>国旗</th>
                            <th>国家名称</th>
                            <th>英文名称</th>
                            <th>所属大洲</th>
                            <th style={{ width: '80px' }}>排序</th>
                            <th style={{ width: '180px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {countryList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>
                                    {item.flag && <img src={item.flag} alt={item.name || ''} style={{ width: '40px', height: 'auto' }} />}
                                </td>
                                <td>{item.name}</td>
                                <td>{item.nameEn}</td>
                                <td>{item.zhouName}</td>
                                <td>{item.sortOrder}</td>
                                <td class="action-btns">
                                    <a href={`/admin/countries/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                    <form method="post" action={`/admin/countries/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除该国家？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {countryList.length === 0 && (
                            <tr><td colspan="7" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无数据</td></tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div class="pagination">
                        {page > 1 && <a href={`/admin/countries?page=${page - 1}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/countries?page=${p}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/countries?page=${page + 1}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 添加国家
app.get('/countries/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const zhouList = await db.select().from(zhou).orderBy(asc(zhou.sortOrder));

    return c.html(
        <AdminLayout title="添加国家" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/countries/add">
                    <div class="form-group">
                        <label>国家名称 *</label>
                        <input type="text" name="name" class="form-control" required />
                    </div>
                    <div class="form-group">
                        <label>英文名称</label>
                        <input type="text" name="nameEn" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>所属大洲</label>
                        <select name="zhouId" class="form-control">
                            <option value="">请选择大洲</option>
                            {zhouList.map(z => (
                                <option value={String(z.id)}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>排序 (数字越小越靠前)</label>
                        <input type="number" name="sortOrder" class="form-control" value="0" />
                    </div>
                    <div class="form-group">
                        <label>国旗图片 URL</label>
                        <input type="text" name="flag" class="form-control" placeholder="/image/flags/usa.png" />
                    </div>
                    <div class="form-group">
                        <label>封面图片 URL</label>
                        <input type="text" name="coverPic" class="form-control" />
                    </div>

                    <h3 style={{ marginTop: '30px', marginBottom: '20px', color: '#333' }}>内容板块</h3>

                    <div class="form-group">
                        <label>基本介绍</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value="" />
                    </div>

                    <div class="form-group">
                        <label>视频内容</label>
                        <div id="editor-videoContent" class="quill-editor" data-field="videoContent"></div>
                        <input type="hidden" name="videoContent" id="input-videoContent" value="" />
                    </div>
                    <div class="form-group">
                        <label>视频封面图 URL</label>
                        <input type="text" name="videoPic" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label>生活内容</label>
                        <div id="editor-lifeContent" class="quill-editor" data-field="lifeContent"></div>
                        <input type="hidden" name="lifeContent" id="input-lifeContent" value="" />
                    </div>
                    <div class="form-group">
                        <label>生活图片 URL</label>
                        <input type="text" name="lifePic" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label>教育内容</label>
                        <div id="editor-eduContent" class="quill-editor" data-field="eduContent"></div>
                        <input type="hidden" name="eduContent" id="input-eduContent" value="" />
                    </div>
                    <div class="form-group">
                        <label>教育图片 URL</label>
                        <input type="text" name="eduPic" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label>房产内容</label>
                        <div id="editor-housingContent" class="quill-editor" data-field="housingContent"></div>
                        <input type="hidden" name="housingContent" id="input-housingContent" value="" />
                    </div>
                    <div class="form-group">
                        <label>房产图片 URL</label>
                        <input type="text" name="housingPic" class="form-control" />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/countries" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/countries/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    await db.insert(guojia).values({
        name: body.name as string,
        nameEn: body.nameEn as string || null,
        zhouId: body.zhouId ? parseInt(body.zhouId as string) : null,
        sortOrder: parseInt(body.sortOrder as string) || 0,
        flag: body.flag as string || null,
        coverPic: body.coverPic as string || null,
        content: body.content as string || null,
        videoContent: body.videoContent as string || null,
        videoPic: body.videoPic as string || null,
        lifeContent: body.lifeContent as string || null,
        lifePic: body.lifePic as string || null,
        eduContent: body.eduContent as string || null,
        eduPic: body.eduPic as string || null,
        housingContent: body.housingContent as string || null,
        housingPic: body.housingPic as string || null,
    });

    return c.redirect('/admin/countries');
});

// 编辑国家
app.get('/countries/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [country] = await db.select().from(guojia).where(eq(guojia.id, id)).limit(1);
    if (!country) return c.redirect('/admin/countries');

    const zhouList = await db.select().from(zhou).orderBy(asc(zhou.sortOrder));

    return c.html(
        <AdminLayout title="编辑国家" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/countries/edit/${id}`}>
                    <div class="form-group">
                        <label>国家名称 *</label>
                        <input type="text" name="name" class="form-control" value={country.name || ''} required />
                    </div>
                    <div class="form-group">
                        <label>英文名称</label>
                        <input type="text" name="nameEn" class="form-control" value={country.nameEn || ''} />
                    </div>
                    <div class="form-group">
                        <label>所属大洲</label>
                        <select name="zhouId" class="form-control">
                            <option value="">请选择大洲</option>
                            {zhouList.map(z => (
                                <option value={String(z.id)} selected={z.id === country.zhouId}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>排序</label>
                        <input type="number" name="sortOrder" class="form-control" value={String(country.sortOrder || 0)} />
                    </div>
                    <div class="form-group">
                        <label>国旗图片 URL</label>
                        <input type="text" name="flag" class="form-control" value={country.flag || ''} />
                    </div>
                    <div class="form-group">
                        <label>封面图片 URL</label>
                        <input type="text" name="coverPic" class="form-control" value={country.coverPic || ''} />
                    </div>

                    <h3 style={{ marginTop: '30px', marginBottom: '20px', color: '#333' }}>内容板块</h3>

                    <div class="form-group">
                        <label>基本介绍</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value={country.content || ''} />
                    </div>

                    <div class="form-group">
                        <label>视频内容</label>
                        <div id="editor-videoContent" class="quill-editor" data-field="videoContent"></div>
                        <input type="hidden" name="videoContent" id="input-videoContent" value={country.videoContent || ''} />
                    </div>
                    <div class="form-group">
                        <label>视频封面图 URL</label>
                        <input type="text" name="videoPic" class="form-control" value={country.videoPic || ''} />
                    </div>

                    <div class="form-group">
                        <label>生活内容</label>
                        <div id="editor-lifeContent" class="quill-editor" data-field="lifeContent"></div>
                        <input type="hidden" name="lifeContent" id="input-lifeContent" value={country.lifeContent || ''} />
                    </div>
                    <div class="form-group">
                        <label>生活图片 URL</label>
                        <input type="text" name="lifePic" class="form-control" value={country.lifePic || ''} />
                    </div>

                    <div class="form-group">
                        <label>教育内容</label>
                        <div id="editor-eduContent" class="quill-editor" data-field="eduContent"></div>
                        <input type="hidden" name="eduContent" id="input-eduContent" value={country.eduContent || ''} />
                    </div>
                    <div class="form-group">
                        <label>教育图片 URL</label>
                        <input type="text" name="eduPic" class="form-control" value={country.eduPic || ''} />
                    </div>

                    <div class="form-group">
                        <label>房产内容</label>
                        <div id="editor-housingContent" class="quill-editor" data-field="housingContent"></div>
                        <input type="hidden" name="housingContent" id="input-housingContent" value={country.housingContent || ''} />
                    </div>
                    <div class="form-group">
                        <label>房产图片 URL</label>
                        <input type="text" name="housingPic" class="form-control" value={country.housingPic || ''} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/countries" class="btn btn-secondary">返回</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

app.post('/countries/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    await db.update(guojia).set({
        name: body.name as string,
        nameEn: body.nameEn as string || null,
        zhouId: body.zhouId ? parseInt(body.zhouId as string) : null,
        sortOrder: parseInt(body.sortOrder as string) || 0,
        flag: body.flag as string || null,
        coverPic: body.coverPic as string || null,
        content: body.content as string || null,
        videoContent: body.videoContent as string || null,
        videoPic: body.videoPic as string || null,
        lifeContent: body.lifeContent as string || null,
        lifePic: body.lifePic as string || null,
        eduContent: body.eduContent as string || null,
        eduPic: body.eduPic as string || null,
        housingContent: body.housingContent as string || null,
        housingPic: body.housingPic as string || null,
    }).where(eq(guojia.id, id));

    return c.redirect('/admin/countries');
});

app.post('/countries/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    await db.delete(guojia).where(eq(guojia.id, id));
    return c.redirect('/admin/countries');
});

export default app;
