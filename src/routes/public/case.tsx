// Public Case Routes - 成功案例
import { Hono } from 'hono';
import { desc, eq, count } from 'drizzle-orm';
import { anli } from '../../db/schema';
import { Layout } from '../../components/Layout';
import { Pagination } from '../../components/Pagination';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 成功案例列表
app.get('/case', async (c) => {
    const db = c.get('db');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const cases = await db
        .select()
        .from(anli)
        .orderBy(desc(anli.createdAt))
        .limit(pageSize)
        .offset(offset);

    const [{ value: totalItems }] = await db.select({ value: count() }).from(anli);
    const totalPages = Math.ceil(totalItems / pageSize);

    return c.html(
        <Layout title="成功案例">
            <div class="in_left">
                <div class="pro_title">成功案例</div>

                {cases.length > 0 ? (
                    <>
                        {cases.map(item => (
                            <div class="index_left_xiangmu">
                                <div class="index_left_xm_left">
                                    <a href={`/case/${item.id}`}>
                                        <img src={item.pic || '/image/gjpic.jpg'} alt={item.title || ''} />
                                    </a>
                                </div>
                                <div class="in_left_xm_right" style="float:right;width:630px">
                                    <h3 style="font-size:16px;margin-bottom:10px">
                                        <a href={`/case/${item.id}`}>{item.title}</a>
                                    </h3>
                                    <p style="color:#666;line-height:22px">
                                        {item.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                                    </p>
                                    <p style="margin-top:10px">
                                        <a href={`/case/${item.id}`} class="pgbutton">查看详情</a>
                                    </p>
                                </div>
                                <div class="clear"></div>
                            </div>
                        ))}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            baseUrl="/case"
                        />
                    </>
                ) : (
                    <p style="padding:50px;text-align:center;color:#999">暂无案例</p>
                )}
            </div>

            <div class="in_right">
                <div class="index_right_title">联系我们</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;line-height:28px">
                    <p><b>咨询热线：</b>023-89698386</p>
                    <p><b>邮箱：</b>service@mail.newvisas.com</p>
                </div>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

// 案例详情
app.get('/case/:id', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    const [caseItem] = await db
        .select()
        .from(anli)
        .where(eq(anli.id, id))
        .limit(1);

    if (!caseItem) {
        return c.notFound();
    }

    return c.html(
        <Layout title={caseItem.title || '案例详情'}>
            <div class="in_left">
                <div class="news_title">{caseItem.title}</div>
                <div class="news_time">
                    发布时间：{caseItem.createdAt?.substring(0, 10)}
                </div>

                {caseItem.pic && (
                    <div class="in_nav_pic">
                        <img src={caseItem.pic} alt={caseItem.title || ''} style="max-width:100%" />
                    </div>
                )}

                <div class="news_nav" dangerouslySetInnerHTML={{ __html: caseItem.content || '' }} />

                <div class="news_next">
                    <a href="/case">&lt;&lt; 返回案例列表</a>
                </div>
            </div>

            <div class="in_right">
                <div class="index_right_title">联系我们</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;line-height:28px">
                    <p><b>咨询热线：</b>023-89698386</p>
                    <p><b>邮箱：</b>service@mail.newvisas.com</p>
                </div>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

export default app;
