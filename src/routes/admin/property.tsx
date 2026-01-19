// Admin Property Routes - 房产管理
import { Hono } from 'hono';
import { eq, desc, asc, like, and, sql } from 'drizzle-orm';
import { loupan, guojia, zhou } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import { propertySchema, formatZodErrors, type PropertyInput } from '../../validations';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 房产列表
app.get('/properties', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const search = c.req.query('search') || '';
    const countryId = c.req.query('country') || '';
    const status = c.req.query('status') || '';
    const pageSize = 15;

    // 获取国家列表
    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));

    // 查询房产列表
    let conditions = [];
    if (search) {
        conditions.push(like(loupan.title, `%${search}%`));
    }
    if (countryId) {
        conditions.push(eq(loupan.guojiaId, parseInt(countryId)));
    }
    if (status) {
        conditions.push(eq(loupan.status, parseInt(status)));
    }

    const propertiesQuery = db
        .select({
            id: loupan.id,
            title: loupan.title,
            guojiaId: loupan.guojiaId,
            city: loupan.city,
            totalPrice: loupan.totalPrice,
            status: loupan.status,
            createdAt: loupan.createdAt,
            hits: loupan.hits,
        })
        .from(loupan)
        .orderBy(desc(loupan.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    if (conditions.length > 0) {
        propertiesQuery.where(and(...conditions));
    }

    const propertyList = await propertiesQuery;

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(loupan);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.html(
        <AdminLayout title="房产管理" username={currentUser?.username}>
            <div class="toolbar">
                <a href="/admin/properties/add" class="btn btn-primary">+ 添加房产</a>
                <form method="get" style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="search" placeholder="搜索房产..." value={search} class="form-control" style={{ width: '200px' }} />
                    <select name="country" class="form-control" style={{ width: '150px' }}>
                        <option value="">全部国家</option>
                        {countries.map(c => (
                            <option value={c.id.toString()} selected={countryId === c.id.toString()}>{c.name}</option>
                        ))}
                    </select>
                    <select name="status" class="form-control" style={{ width: '120px' }}>
                        <option value="">全部状态</option>
                        <option value="1" selected={status === '1'}>已发布</option>
                        <option value="0" selected={status === '0'}>已下架</option>
                    </select>
                    <button type="submit" class="btn btn-secondary">搜索</button>
                </form>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th>房产标题</th>
                            <th style={{ width: '100px' }}>国家</th>
                            <th style={{ width: '100px' }}>城市</th>
                            <th style={{ width: '120px' }}>总价</th>
                            <th style={{ width: '80px' }}>状态</th>
                            <th style={{ width: '100px' }}>浏览</th>
                            <th style={{ width: '160px' }}>发布时间</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {propertyList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>
                                    <a href={`/property/${item.id}`} target="_blank" style={{ color: '#333', textDecoration: 'none' }}>
                                        {item.title?.substring(0, 40)}
                                    </a>
                                </td>
                                <td>{countries.find(c => c.id === item.guojiaId)?.name || '-'}</td>
                                <td>{item.city || '-'}</td>
                                <td>{item.totalPrice || '-'}</td>
                                <td>
                                    <span style={{ color: item.status === 1 ? '#28a745' : '#999' }}>
                                        {item.status === 1 ? '已发布' : '已下架'}
                                    </span>
                                </td>
                                <td>{item.hits}</td>
                                <td>{item.createdAt?.substring(0, 10)}</td>
                                <td class="action-btns">
                                    <a href={`/admin/properties/edit/${item.id}`} class="btn btn-secondary btn-sm">编辑</a>
                                    <form method="post" action={`/admin/properties/delete/${item.id}`} style={{ display: 'inline' }} onsubmit="return confirm('确定删除这个房产吗？')">
                                        <button type="submit" class="btn btn-danger btn-sm">删除</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {propertyList.length === 0 && (
                            <tr>
                                <td colspan="9" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                    暂无数据
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div class="pagination">
                        {page > 1 && <a href={`/admin/properties?page=${page - 1}&search=${search}&country=${countryId}&status=${status}`}>上一页</a>}
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                            <a href={`/admin/properties?page=${p}&search=${search}&country=${countryId}&status=${status}`} class={p === page ? 'active' : ''}>{p}</a>
                        ))}
                        {page < totalPages && <a href={`/admin/properties?page=${page + 1}&search=${search}&country=${countryId}&status=${status}`}>下一页</a>}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

// 添加房产页面
app.get('/properties/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));
    const continents = await db.select().from(zhou).orderBy(asc(zhou.sortOrder));

    return c.html(
        <AdminLayout title="添加房产" username={currentUser?.username}>
            <div class="card">
                <form method="post" action="/admin/properties/add">
                    <div class="form-group">
                        <label>房产标题 *</label>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>城市</label>
                            <input type="text" name="city" class="form-control" />
                        </div>
                        <div class="form-group">
                            <label>房产类别</label>
                            <input type="text" name="category" class="form-control" placeholder="例如：公寓、别墅" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>总价</label>
                            <input type="text" name="totalPrice" class="form-control" placeholder="例如：200万人民币" />
                        </div>
                        <div class="form-group">
                            <label>单价</label>
                            <input type="text" name="unitPrice" class="form-control" placeholder="例如：2万元/平米" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>产权</label>
                            <input type="text" name="ownership" class="form-control" placeholder="例如：永久产权" />
                        </div>
                        <div class="form-group">
                            <label>户型</label>
                            <input type="text" name="layout" class="form-control" placeholder="例如：3室2厅2卫" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>装修状况</label>
                            <input type="text" name="decoration" class="form-control" placeholder="例如：精装修" />
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select name="status" class="form-control">
                                <option value="1" selected>已发布</option>
                                <option value="0">已下架</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>关键词</label>
                        <input type="text" name="keywords" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label>房产特色</label>
                        <input type="text" name="features" class="form-control" placeholder="简短描述房产特色" />
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <div id="editor-description" class="quill-editor" data-field="description"></div>
                        <input type="hidden" name="description" id="input-description" value="" />
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
                        <a href="/admin/properties" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理添加房产
app.post('/properties/add', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    const data: PropertyInput = {
        title: body.title as string,
        zhouId: body.zhouId ? parseInt(body.zhouId as string) : undefined,
        guojiaId: parseInt(body.guojiaId as string),
        city: body.city as string,
        features: body.features as string,
        keywords: body.keywords as string,
        description: body.description as string,
        content: body.content as string,
        pic: body.pic as string,
        totalPrice: body.totalPrice as string,
        unitPrice: body.unitPrice as string,
        category: body.category as string,
        ownership: body.ownership as string,
        layout: body.layout as string,
        decoration: body.decoration as string,
        status: body.status ? parseInt(body.status as string) : 1,
    };

    const result = propertySchema.safeParse(data);
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
                    <a href="/admin/properties/add">返回</a>
                </body>
            </html>,
            400
        );
    }

    await db.insert(loupan).values({
        title: result.data.title,
        zhouId: result.data.zhouId,
        guojiaId: result.data.guojiaId,
        city: result.data.city,
        features: result.data.features,
        keywords: result.data.keywords,
        description: result.data.description,
        content: result.data.content,
        pic: result.data.pic,
        totalPrice: result.data.totalPrice,
        unitPrice: result.data.unitPrice,
        category: result.data.category,
        ownership: result.data.ownership,
        layout: result.data.layout,
        decoration: result.data.decoration,
        status: result.data.status,
        createdAt: new Date().toISOString(),
        hits: 0,
    });

    return c.redirect('/admin/properties');
});

// 编辑房产页面
app.get('/properties/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    const [property] = await db.select().from(loupan).where(eq(loupan.id, id)).limit(1);
    if (!property) {
        return c.redirect('/admin/properties');
    }

    const countries = await db.select().from(guojia).orderBy(asc(guojia.sortOrder));
    const continents = await db.select().from(zhou).orderBy(asc(zhou.sortOrder));

    return c.html(
        <AdminLayout title="编辑房产" username={currentUser?.username}>
            <div class="card">
                <form method="post" action={`/admin/properties/edit/${id}`}>
                    <div class="form-group">
                        <label>房产标题 *</label>
                        <input type="text" name="title" class="form-control" value={property.title || ''} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>所属洲</label>
                            <select name="zhouId" class="form-control">
                                <option value="">请选择</option>
                                {continents.map(z => (
                                    <option value={String(z.id)} selected={z.id === property.zhouId}>{z.name}</option>
                                ))}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>所属国家 *</label>
                            <select name="guojiaId" class="form-control" required>
                                <option value="">请选择国家</option>
                                {countries.map(ctry => (
                                    <option value={String(ctry.id)} selected={ctry.id === property.guojiaId}>{ctry.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>城市</label>
                            <input type="text" name="city" class="form-control" value={property.city || ''} />
                        </div>
                        <div class="form-group">
                            <label>房产类别</label>
                            <input type="text" name="category" class="form-control" value={property.category || ''} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>总价</label>
                            <input type="text" name="totalPrice" class="form-control" value={property.totalPrice || ''} />
                        </div>
                        <div class="form-group">
                            <label>单价</label>
                            <input type="text" name="unitPrice" class="form-control" value={property.unitPrice || ''} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>产权</label>
                            <input type="text" name="ownership" class="form-control" value={property.ownership || ''} />
                        </div>
                        <div class="form-group">
                            <label>户型</label>
                            <input type="text" name="layout" class="form-control" value={property.layout || ''} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div class="form-group">
                            <label>装修状况</label>
                            <input type="text" name="decoration" class="form-control" value={property.decoration || ''} />
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select name="status" class="form-control">
                                <option value="1" selected={property.status === 1}>已发布</option>
                                <option value="0" selected={property.status === 0}>已下架</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>关键词</label>
                        <input type="text" name="keywords" class="form-control" value={property.keywords || ''} />
                    </div>

                    <div class="form-group">
                        <label>房产特色</label>
                        <input type="text" name="features" class="form-control" value={property.features || ''} />
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <div id="editor-description" class="quill-editor" data-field="description"></div>
                        <input type="hidden" name="description" id="input-description" value={property.description || ''} />
                    </div>

                    <div class="form-group">
                        <label>详细内容</label>
                        <div id="editor-content" class="quill-editor" data-field="content"></div>
                        <input type="hidden" name="content" id="input-content" value={property.content || ''} />
                    </div>

                    <div class="form-group">
                        <label>封面图片</label>
                        <input type="text" name="pic" class="form-control" value={property.pic || ''} />
                        {property.pic && (
                            <img src={property.pic} alt="封面" style={{ maxWidth: '200px', marginTop: '10px' }} />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" class="btn btn-primary">保存</button>
                        <a href="/admin/properties" class="btn btn-secondary">返回列表</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 处理编辑房产
app.post('/properties/edit/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();

    const data: PropertyInput = {
        title: body.title as string,
        zhouId: body.zhouId ? parseInt(body.zhouId as string) : undefined,
        guojiaId: parseInt(body.guojiaId as string),
        city: body.city as string,
        features: body.features as string,
        keywords: body.keywords as string,
        description: body.description as string,
        content: body.content as string,
        pic: body.pic as string,
        totalPrice: body.totalPrice as string,
        unitPrice: body.unitPrice as string,
        category: body.category as string,
        ownership: body.ownership as string,
        layout: body.layout as string,
        decoration: body.decoration as string,
        status: body.status ? parseInt(body.status as string) : 1,
    };

    const result = propertySchema.safeParse(data);
    if (!result.success) {
        return c.redirect(`/admin/properties/edit/${id}?error=1`);
    }

    await db.update(loupan)
        .set({
            title: result.data.title,
            zhouId: result.data.zhouId,
            guojiaId: result.data.guojiaId,
            city: result.data.city,
            features: result.data.features,
            keywords: result.data.keywords,
            description: result.data.description,
            content: result.data.content,
            pic: result.data.pic,
            totalPrice: result.data.totalPrice,
            unitPrice: result.data.unitPrice,
            category: result.data.category,
            ownership: result.data.ownership,
            layout: result.data.layout,
            decoration: result.data.decoration,
            status: result.data.status,
        })
        .where(eq(loupan.id, id));

    return c.redirect('/admin/properties');
});

// 删除房产
app.post('/properties/delete/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    await db.delete(loupan).where(eq(loupan.id, id));

    return c.redirect('/admin/properties');
});

export default app;
