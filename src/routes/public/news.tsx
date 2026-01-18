// Public News Routes - 新闻资讯
import { Hono } from 'hono';
import { desc, eq, asc, count } from 'drizzle-orm';
import { info, newsClass } from '../../db/schema';
import { Layout } from '../../components/Layout';
import { Pagination } from '../../components/Pagination';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 新闻列表
app.get('/news', async (c) => {
    const db = c.get('db');
    const cid = c.req.query('cid');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    // 获取新闻分类
    const categories = await db
        .select()
        .from(newsClass)
        .orderBy(asc(newsClass.sortOrder));

    // 获取新闻列表和总数
    let newsQuery = db.select().from(info);
    let countQuery = db.select({ value: count() }).from(info);

    if (cid) {
        newsQuery = newsQuery.where(eq(info.classId, parseInt(cid)));
        countQuery = countQuery.where(eq(info.classId, parseInt(cid)));
    }

    const newsList = await newsQuery
        .orderBy(desc(info.createdAt))
        .limit(pageSize)
        .offset(offset);

    const [{ value: totalItems }] = await countQuery;
    const totalPages = Math.ceil(totalItems / pageSize);

    const currentCategory = cid ? categories.find(c => c.id === parseInt(cid)) : null;

    return c.html(
        <Layout title={currentCategory ? currentCategory.name : '新闻资讯'}>
            <div class="in_left">
                <div class="pro_title">
                    {currentCategory ? currentCategory.name : '全部新闻'}
                </div>

                {newsList.length > 0 ? (
                    <>
                        {newsList.map(item => (
                            <div class="news_block">
                                <h2><a href={`/news/${item.id}`}>{item.title}</a></h2>
                                <h3>{item.description?.substring(0, 100)}</h3>
                                <h4>
                                    {item.createdAt?.substring(0, 10)}
                                    {item.source && ` | 来源：${item.source}`}
                                </h4>
                            </div>
                        ))}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            baseUrl="/news"
                            queryParams={cid ? `cid=${cid}` : ''}
                        />
                    </>
                ) : (
                    <p style="padding:50px;text-align:center;color:#999">暂无新闻</p>
                )}
            </div>

            <div class="in_right">
                <div class="index_right_title">新闻分类</div>
                <ul class="right_class">
                    <li style={!cid ? 'background:#eee' : ''}>
                        <a href="/news">全部新闻</a>
                    </li>
                    {categories.map(cat => (
                        <li style={cid === String(cat.id) ? 'background:#eee' : ''}>
                            <a href={`/news?cid=${cat.id}`}>{cat.name}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

// 新闻详情
app.get('/news/:id', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    const [article] = await db
        .select()
        .from(info)
        .where(eq(info.id, id))
        .limit(1);

    if (!article) {
        return c.notFound();
    }

    // 获取新闻分类（用于侧边栏）
    const categories = await db
        .select()
        .from(newsClass)
        .orderBy(asc(newsClass.sortOrder));

    return c.html(
        <Layout title={article.title || '新闻详情'}>
            <div class="in_left">
                <div class="news_title">{article.title}</div>
                <div class="news_time">
                    发布时间：{article.createdAt?.substring(0, 10)}
                    {article.source && ` | 来源：${article.source}`}
                </div>

                <div class="news_nav" dangerouslySetInnerHTML={{ __html: article.content || '' }} />

                <div class="news_next">
                    <a href="/news">&lt;&lt; 返回新闻列表</a>
                </div>
            </div>

            <div class="in_right">
                <div class="index_right_title">新闻分类</div>
                <ul class="right_class">
                    {categories.map(cat => (
                        <li>
                            <a href={`/news?cid=${cat.id}`}>{cat.name}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

export default app;
