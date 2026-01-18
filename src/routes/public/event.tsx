// Public Event Routes - 活动讲座
import { Hono } from 'hono';
import { desc, eq, count } from 'drizzle-orm';
import { jiangzuo } from '../../db/schema';
import { Layout } from '../../components/Layout';
import { Pagination } from '../../components/Pagination';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 活动讲座
app.get('/events', async (c) => {
    const db = c.get('db');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const events = await db
        .select()
        .from(jiangzuo)
        .orderBy(desc(jiangzuo.createdAt))
        .limit(pageSize)
        .offset(offset);

    const [{ value: totalItems }] = await db.select({ value: count() }).from(jiangzuo);
    const totalPages = Math.ceil(totalItems / pageSize);

    return c.html(
        <Layout title="活动讲座">
            <div class="in_left">
                <div class="pro_title">活动讲座</div>

                {events.length > 0 ? (
                    <>
                        {events.map(event => (
                            <div class="index_right_jiangzuo" style="width:100%;border-bottom:1px solid #eee;padding:15px 0">
                                <div class="jiangzuo_left" style="width:80px;height:80px">
                                    <div style="font-size:24px;line-height:40px">{event.time?.substring(8, 10)}</div>
                                    <div style="font-size:14px;line-height:20px">{event.time?.substring(0, 7)}</div>
                                </div>
                                <div style="margin-left:100px">
                                    <h3 style="font-size:16px;line-height:30px">
                                        <a href={`/events/${event.id}`}>{event.title}</a>
                                    </h3>
                                    <p style="color:#666">时间：{event.time}</p>
                                    <p style="color:#666">地点：{event.address}</p>
                                </div>
                                <div class="clear"></div>
                            </div>
                        ))}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            baseUrl="/events"
                        />
                    </>
                ) : (
                    <p style="padding:50px;text-align:center;color:#999">暂无活动</p>
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

// 活动详情
app.get('/events/:id', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    const [event] = await db
        .select()
        .from(jiangzuo)
        .where(eq(jiangzuo.id, id))
        .limit(1);

    if (!event) {
        return c.notFound();
    }

    return c.html(
        <Layout title={event.title || '活动详情'}>
            <div class="in_left">
                <div class="news_title">{event.title}</div>
                <div class="news_time">
                    时间：{event.time} | 地点：{event.address}
                </div>

                {event.pic && (
                    <div class="in_nav_pic">
                        <img src={event.pic} alt={event.title || ''} style="max-width:100%" />
                    </div>
                )}

                <div class="news_nav" dangerouslySetInnerHTML={{ __html: event.content || '' }} />

                <div class="news_next">
                    <a href="/events">&lt;&lt; 返回活动列表</a>
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
