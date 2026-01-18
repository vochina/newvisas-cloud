// Admin Assessment Routes - 评估申请管理
import { Hono } from 'hono';
import { eq, desc, and, sql } from 'drizzle-orm';
import { pinggu } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

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

export default app;
