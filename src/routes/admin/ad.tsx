// Admin Ad Routes - 广告管理
import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { ad } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

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

export default app;
