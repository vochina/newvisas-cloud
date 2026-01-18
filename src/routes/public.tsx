// Public Routes - 前台路由 (原版样式)

import { Hono } from 'hono';
import { desc, eq, asc, count } from 'drizzle-orm';
import { zhou, guojia, xm, info, newsClass, anli, team, ad, jiangzuo, pinggu } from '../db/schema';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import { assessmentSchema } from '../validations';
import type { AppEnv } from '../types';

const app = new Hono<AppEnv>();

// 首页
app.get('/', async (c) => {
    const db = c.get('db');

    // 获取最新新闻
    const latestNews = await db
        .select()
        .from(info)
        .orderBy(desc(info.createdAt))
        .limit(8);

    // 获取移民项目
    const projects = await db
        .select()
        .from(xm)
        .orderBy(desc(xm.createdAt))
        .limit(6);

    // 获取国家列表
    const countries = await db
        .select()
        .from(guojia)
        .orderBy(asc(guojia.sortOrder))
        .limit(10);

    // 获取广告/轮播图
    const ads = await db
        .select()
        .from(ad)
        .where(eq(ad.status, 1))
        .orderBy(desc(ad.createdAt))
        .limit(5);

    // 获取活动讲座
    const events = await db
        .select()
        .from(jiangzuo)
        .orderBy(desc(jiangzuo.createdAt))
        .limit(3);

    return c.html(
        <Layout title="首页">
            {/* 通栏区域：左侧国家导航 + 中间轮播图 + 右侧评估 */}
            <div class="index_tonglan">
                {/* 左侧国家导航 */}
                <div class="index_tonglan_l">
                    <ul>
                        {countries.map(country => (
                            <li>
                                <a href={`/program?pid=${country.id}`}>
                                    <img src={country.flag || '/image/gjpic.jpg'} alt={country.name || ''} />
                                    {country.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 中间轮播图 */}
                <div id="banner">
                    <div class="slides">
                        <ul class="slide-pic">
                            {ads.length > 0 ?
                                ads.map((item, index) => (
                                    <li class={index === 0 ? 'cur' : ''} style={index === 0 ? {} : { display: 'none' }}>
                                        <a href={item.url || '#'} target="_blank">
                                            <img src={item.pic || ''} alt={item.title || ''} />
                                        </a>
                                    </li>
                                ))
                                :
                                <li class="cur">
                                    <img src="/image/topbg.jpg" alt="NewVisas" />
                                </li>
                            }
                        </ul>
                        {ads.length > 1 && (
                            <>
                                <ul class="slide-li op">
                                    {ads.map((_, index) => (
                                        <li class={index === 0 ? 'cur' : ''}></li>
                                    ))}
                                </ul>
                                <ul class="slide-li slide-txt">
                                    {ads.map((_, index) => (
                                        <li class={index === 0 ? 'cur' : ''}><a href="#"></a></li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>

                {/* 右侧评估入口 */}
                <div class="index_tonglan_r">
                    <div class="index_tonglan_r_title" style="background:#795312;padding:10px">
                        免费移民评估
                    </div>
                    <div class="index_tonglan_r_nav" style="padding:15px;background:#fff">
                        <p style="line-height:24px;color:#666">
                            想知道您是否符合移民条件？立即进行免费评估！
                        </p>
                        <a href="/assessment" class="pgbutton" style="display:block;text-align:center;margin-top:15px">
                            立即评估
                        </a>
                    </div>
                </div>
                <div class="clear"></div>
            </div>

            {/* 主内容区域 */}
            <div class="index_left">
                {/* 热门移民项目 */}
                <div class="index_left_title">
                    <b>热门移民项目</b>
                    <a href="/program" class="float_r">更多 &gt;&gt;</a>
                </div>

                {projects.map(project => (
                    <div class="index_left_xiangmu">
                        <div class="index_left_xm_left">
                            <a href={`/program/${project.id}`}>
                                <img src={project.pic || '/image/gjpic.jpg'} alt={project.title || ''} />
                            </a>
                        </div>
                        <div class="index_left_xm_right">
                            <h3 style="font-size:16px;margin-bottom:10px">
                                <a href={`/program/${project.id}`}>{project.title}</a>
                            </h3>
                            <p style="color:#666;line-height:22px">
                                {project.description?.substring(0, 150)}
                                {project.description && project.description.length > 150 ? '...' : ''}
                            </p>
                            <p style="margin-top:10px">
                                <a href={`/program/${project.id}`} class="pgbutton">查看详情</a>
                            </p>
                        </div>
                        <div class="clear"></div>
                    </div>
                ))}

                {/* 新闻资讯 */}
                <div class="index_left_title" style="margin-top:30px">
                    <b>新闻资讯</b>
                    <a href="/news" class="float_r">更多 &gt;&gt;</a>
                </div>

                <ul class="list">
                    {latestNews.map(item => (
                        <li>
                            <a href={`/news/${item.id}`}>
                                {item.title}
                                <span class="float_r" style="color:#999">{item.createdAt?.substring(0, 10)}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 右侧栏 */}
            <div class="index_right">
                {/* 移民国家 */}
                <div class="index_right_title">移民国家</div>
                <div class="index_right_ymnav">
                    {countries.slice(0, 6).map(country => (
                        <div class="guojia">
                            <a href={`/program?pid=${country.id}`}>
                                <img src={country.flag || '/image/gjpic.jpg'} alt={country.name || ''} />
                                {country.name}
                            </a>
                        </div>
                    ))}
                    <div class="clear"></div>
                </div>

                {/* 活动讲座 */}
                <div class="index_right_title" style="margin-top:20px">活动讲座</div>
                {events.map(event => (
                    <div class="index_right_jiangzuo">
                        <div class="jiangzuo_left">
                            <div class="line2">
                                {event.time?.substring(5, 7)}/{event.time?.substring(8, 10)}
                            </div>
                        </div>
                        <div class="jiangzuo_right">
                            <a href={`/events/${event.id}`}>{event.title}</a>
                            <div class="jiangzuo_text">{event.address}</div>
                        </div>
                        <div class="clear"></div>
                    </div>
                ))}

                {/* 联系我们 */}
                <div class="index_right_title" style="margin-top:20px">联系我们</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;line-height:28px">
                    <p><b>咨询热线：</b>023-89698386</p>
                    <p><b>邮箱：</b>service@mail.newvisas.com</p>
                    <p><b>地址：</b>重庆渝中区解放碑邹容路68号大都会东方广场37楼</p>
                </div>
            </div>

            <div class="clear"></div>
        </Layout>
    );
});

// 移民项目列表
app.get('/program', async (c) => {
    const db = c.get('db');
    const pid = c.req.query('pid');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    // 获取所有国家
    const countries = await db
        .select()
        .from(guojia)
        .orderBy(asc(guojia.sortOrder));

    // 获取项目列表和总数
    let projectQuery = db.select().from(xm);
    let countQuery = db.select({ value: count() }).from(xm);

    if (pid) {
        projectQuery = projectQuery.where(eq(xm.guojiaId, parseInt(pid)));
        countQuery = countQuery.where(eq(xm.guojiaId, parseInt(pid)));
    }

    const projects = await projectQuery
        .orderBy(desc(xm.createdAt))
        .limit(pageSize)
        .offset(offset);

    const [{ value: totalItems }] = await countQuery;
    const totalPages = Math.ceil(totalItems / pageSize);

    // 获取当前国家名称
    const currentCountry = pid ? countries.find(c => c.id === parseInt(pid)) : null;

    return c.html(
        <Layout title={currentCountry ? `${currentCountry.name}移民项目` : '移民项目'}>
            <div class="in_left">
                <div class="pro_title">
                    {currentCountry ? `${currentCountry.name}移民项目` : '全部移民项目'}
                </div>

                {projects.length > 0 ? (
                    <>
                        {projects.map(project => (
                            <div class="index_left_xiangmu">
                                <div class="index_left_xm_left">
                                    <a href={`/program/${project.id}`}>
                                        <img src={project.pic || '/image/gjpic.jpg'} alt={project.title || ''} />
                                    </a>
                                </div>
                                <div class="in_left_xm_right" style="float:right;width:630px">
                                    <h3 style="font-size:16px;margin-bottom:10px">
                                        <a href={`/program/${project.id}`}>{project.title}</a>
                                    </h3>
                                    <p style="color:#666;line-height:22px">
                                        {project.description?.substring(0, 200)}
                                        {project.description && project.description.length > 200 ? '...' : ''}
                                    </p>
                                    <p style="margin-top:10px">
                                        <a href={`/program/${project.id}`} class="pgbutton">查看详情</a>
                                    </p>
                                </div>
                                <div class="clear"></div>
                            </div>
                        ))}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            baseUrl="/program"
                            queryParams={pid ? `pid=${pid}` : ''}
                        />
                    </>
                ) : (
                    <p style="padding:50px;text-align:center;color:#999">暂无项目</p>
                )}
            </div>

            <div class="in_right">
                <div class="index_right_title">移民国家</div>
                <ul class="right_class">
                    <li style={!pid ? 'background:#eee' : ''}>
                        <a href="/program">全部项目</a>
                    </li>
                    {countries.map(country => (
                        <li style={pid === String(country.id) ? 'background:#eee' : ''}>
                            <a href={`/program?pid=${country.id}`}>{country.name}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

// 项目详情
app.get('/program/:id', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    const [project] = await db
        .select()
        .from(xm)
        .where(eq(xm.id, id))
        .limit(1);

    if (!project) {
        return c.notFound();
    }

    // 获取国家列表（用于侧边栏）
    const countries = await db
        .select()
        .from(guojia)
        .orderBy(asc(guojia.sortOrder));

    return c.html(
        <Layout title={project.title || '项目详情'}>
            <div class="in_left">
                <div class="news_title">{project.title}</div>
                <div class="news_time">
                    发布时间：{project.createdAt?.substring(0, 10)}
                </div>

                {project.pic && (
                    <div class="in_nav_pic">
                        <img src={project.pic} alt={project.title || ''} style="max-width:100%" />
                    </div>
                )}

                {project.advantages && (
                    <div class="in_nav">
                        <div class="pro_title">项目优势</div>
                        <div class="in_nav_text" dangerouslySetInnerHTML={{ __html: project.advantages }} />
                    </div>
                )}

                {project.conditions && (
                    <div class="in_nav" style="margin-top:20px">
                        <div class="pro_title">申请条件</div>
                        <div class="in_nav_text" dangerouslySetInnerHTML={{ __html: project.conditions }} />
                    </div>
                )}

                {project.process && (
                    <div class="in_nav" style="margin-top:20px">
                        <div class="pro_title">申请流程</div>
                        <div class="in_nav_text" dangerouslySetInnerHTML={{ __html: project.process }} />
                    </div>
                )}

                {project.content && (
                    <div class="in_nav" style="margin-top:20px">
                        <div class="pro_title">详细介绍</div>
                        <div class="in_nav_text" dangerouslySetInnerHTML={{ __html: project.content }} />
                    </div>
                )}

                <div class="news_next">
                    <a href="/program">&lt;&lt; 返回项目列表</a>
                </div>
            </div>

            <div class="in_right">
                <div class="index_right_title">移民国家</div>
                <ul class="right_class">
                    {countries.map(country => (
                        <li>
                            <a href={`/program?pid=${country.id}`}>{country.name}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

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

// 团队介绍
app.get('/team', async (c) => {
    const db = c.get('db');

    const members = await db
        .select()
        .from(team)
        .orderBy(asc(team.sortOrder));

    return c.html(
        <Layout title="专家团队">
            <div class="in_left">
                <div class="pro_title">专家团队</div>

                <div style="padding:20px 0">
                    {members.map((member, index) => (
                        <div class={index % 3 === 2 ? 'team_block2' : 'team_block'}>
                            <a href={`/team/${member.id}`}>
                                <img src={member.pic || '/image/goodteam.jpg'} alt={member.name || ''} />
                                <h3 style="font-size:16px;text-align:center">{member.name}</h3>
                                <p style="text-align:center;color:#795312">{member.title}</p>
                            </a>
                        </div>
                    ))}
                    <div class="clear"></div>
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

// 团队详情
app.get('/team/:id', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));

    const [member] = await db
        .select()
        .from(team)
        .where(eq(team.id, id))
        .limit(1);

    if (!member) {
        return c.notFound();
    }

    return c.html(
        <Layout title={member.name || '专家详情'}>
            <div class="in_left">
                <div class="news_title">{member.name}</div>
                <div class="news_time">
                    职务：{member.title}
                </div>

                <div class="in_nav">
                    <div style="text-align:center;margin-bottom:20px">
                        <img src={member.pic || '/image/goodteam.jpg'} alt={member.name || ''} style="max-width:300px;border:1px solid #eee;padding:5px" />
                    </div>
                    <div class="in_nav_text" dangerouslySetInnerHTML={{ __html: member.content || '' }} />
                </div>

                <div class="news_next">
                    <a href="/team">&lt;&lt; 返回团队列表</a>
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

// 关于我们
app.get('/about', async (c) => {
    return c.html(
        <Layout title="关于我们">
            <div class="in_left">
                <div class="pro_title">关于我们</div>

                <div class="in_nav" style="padding:20px 0">
                    <div class="in_nav_pic">
                        <img src="/image/about1.jpg" alt="公司介绍" />
                    </div>

                    <div class="in_nav_text" style="margin-top:20px">
                        <p style="line-height:28px;text-indent:2em">
                            NewVisas 是一家专业的移民签证服务机构，致力于为客户提供高品质的移民咨询和签证服务。
                            我们拥有多年的行业经验和专业的顾问团队，成功帮助数千个家庭实现了海外移民的梦想。
                        </p>
                        <p style="line-height:28px;text-indent:2em;margin-top:15px">
                            我们的服务涵盖美国、加拿大、澳大利亚、欧洲等热门移民国家，提供投资移民、技术移民、
                            家庭团聚、留学签证等多种移民方案。无论您的需求是什么，我们都能为您量身定制最适合的移民方案。
                        </p>
                    </div>

                    <div class="pro_title" style="margin-top:30px">公司荣誉</div>
                    <div style="display:flex;flex-wrap:wrap;gap:20px;padding:20px 0">
                        <img src="/image/rongyu1.jpg" alt="荣誉证书" style="width:200px" />
                        <img src="/image/rongyu2.jpg" alt="荣誉证书" style="width:200px" />
                        <img src="/image/rongyu3.jpg" alt="荣誉证书" style="width:200px" />
                    </div>
                </div>
            </div>

            <div class="in_right">
                <div class="index_right_title">联系我们</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;line-height:28px">
                    <p><b>咨询热线：</b>023-89698386</p>
                    <p><b>邮箱：</b>service@mail.newvisas.com</p>
                    <p><b>地址：</b>重庆渝中区解放碑邹容路68号大都会东方广场37楼</p>
                </div>

                <div class="index_right_title" style="margin-top:20px">关注微信</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;text-align:center">
                    <img src="/image/erweima_weixin.jpg" alt="微信公众号" style="width:120px" />
                    <p style="margin-top:10px">扫码关注公众号</p>
                </div>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

// 联系我们
app.get('/contact', async (c) => {
    return c.html(
        <Layout title="联系我们">
            <div class="in_left">
                <div class="pro_title">联系我们</div>

                <div class="in_nav" style="padding:20px 0">
                    <table class="ttable" style="width:100%">
                        <tr>
                            <td class="title" style="width:120px">公司名称：</td>
                            <td>重庆鑫嘉园出入境服务有限公司</td>
                        </tr>
                        <tr>
                            <td class="title">咨询热线：</td>
                            <td style="font-size:18px;color:#795312;font-weight:bold">023-89698386</td>
                        </tr>
                        <tr>
                            <td class="title">电子邮箱：</td>
                            <td>service@mail.newvisas.com</td>
                        </tr>
                        <tr>
                            <td class="title">公司地址：</td>
                            <td>重庆渝中区解放碑邹容路68号大都会东方广场37楼</td>
                        </tr>
                        <tr>
                            <td class="title">工作时间：</td>
                            <td>周一至周五 9:00-18:00</td>
                        </tr>
                    </table>

                    <div class="pro_title" style="margin-top:30px">办公环境</div>
                    <div style="display:flex;flex-wrap:wrap;gap:15px;padding:20px 0">
                        <img src="/image/huanjing_qiantai.jpg" alt="前台" style="width:250px" />
                        <img src="/image/huanjing_huiyishi.jpg" alt="会议室" style="width:250px" />
                        <img src="/image/huanjing_bangongshi.jpg" alt="办公室" style="width:250px" />
                    </div>
                </div>
            </div>

            <div class="in_right">
                <div class="index_right_title">关注微信</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;text-align:center">
                    <img src="/image/erweima_weixin.jpg" alt="微信公众号" style="width:120px" />
                    <p style="margin-top:10px">扫码关注公众号</p>
                </div>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

// 移民评估
app.get('/assessment', async (c) => {
    return c.html(
        <Layout title="免费评估">
            <div class="in_left">
                <div class="pro_title">免费移民评估</div>

                <div class="in_nav" style="padding:20px 0">
                    <p style="line-height:28px;margin-bottom:20px">
                        请填写以下信息，我们的专业顾问将在24小时内与您联系，为您提供免费的移民评估服务。
                    </p>

                    <form method="post" action="/assessment" style="max-width:600px">
                        <table class="ttable" style="width:100%">
                            <tr>
                                <td class="title" style="width:100px">姓名：</td>
                                <td>
                                    <input type="text" name="name" required
                                        style="width:300px;padding:8px;border:1px solid #ccc" />
                                </td>
                            </tr>
                            <tr>
                                <td class="title">手机：</td>
                                <td>
                                    <input type="tel" name="phone" required
                                        style="width:300px;padding:8px;border:1px solid #ccc" />
                                </td>
                            </tr>
                            <tr>
                                <td class="title">邮箱：</td>
                                <td>
                                    <input type="email" name="email"
                                        style="width:300px;padding:8px;border:1px solid #ccc" />
                                </td>
                            </tr>
                            <tr>
                                <td class="title">意向国家：</td>
                                <td>
                                    <select name="targetCountry" style="width:316px;padding:8px;border:1px solid #ccc">
                                        <option value="">请选择</option>
                                        <option value="美国">美国</option>
                                        <option value="加拿大">加拿大</option>
                                        <option value="澳大利亚">澳大利亚</option>
                                        <option value="欧洲">欧洲</option>
                                        <option value="其他">其他</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td class="title" style="vertical-align:top;padding-top:15px">留言：</td>
                                <td>
                                    <textarea name="intention" rows="5"
                                        style="width:300px;padding:8px;border:1px solid #ccc"></textarea>
                                </td>
                            </tr>
                            <tr>
                                <td></td>
                                <td style="padding-top:15px">
                                    <button type="submit" class="pgbutton">提交评估</button>
                                </td>
                            </tr>
                        </table>
                    </form>
                </div>
            </div>

            <div class="in_right">
                <div class="index_right_title">为什么选择我们</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;line-height:28px">
                    <p>✓ 专业团队，经验丰富</p>
                    <p>✓ 成功率高，案例众多</p>
                    <p>✓ 一对一服务，全程跟进</p>
                    <p>✓ 收费透明，无隐藏费用</p>
                </div>

                <div class="index_right_title" style="margin-top:20px">联系我们</div>
                <div style="padding:15px;background:#fff;border:1px solid #eee;line-height:28px">
                    <p><b>咨询热线：</b>023-89698386</p>
                    <p><b>邮箱：</b>service@mail.newvisas.com</p>
                </div>
            </div>
            <div class="clear"></div>
        </Layout>
    );
});

// 评估表单提交
app.post('/assessment', async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();

    // 验证数据
    const result = assessmentSchema.safeParse({
        name: body.name,
        phone: body.phone,
        email: body.email || undefined,
        targetCountry: body.targetCountry,
        intention: body.intention,
    });

    if (!result.success) {
        return c.html(
            <Layout title="验证错误">
                <div class="in_left">
                    <div class="pro_title">提交失败</div>
                    <div style="padding:50px;text-align:center">
                        <p style="font-size:18px;color:#e74c3c;margin-bottom:20px">
                            输入信息有误，请检查后重新提交。
                        </p>
                        <ul style="text-align:left;display:inline-block;margin-bottom:20px">
                            {result.error.issues.map(issue => (
                                <li style={{ color: '#e74c3c' }}>{issue.message}</li>
                            ))}
                        </ul>
                        <p>
                            <a href="/assessment" class="pgbutton">返回重填</a>
                        </p>
                    </div>
                </div>
                <div class="clear"></div>
            </Layout>
        );
    }

    // 保存到数据库
    await db.insert(pinggu).values({
        name: result.data.name,
        phone: result.data.phone,
        email: result.data.email,
        targetCountry: result.data.targetCountry,
        intention: result.data.intention,
        createdAt: new Date().toISOString(),
        status: 0,
    });

    return c.html(
        <Layout title="提交成功">
            <div class="in_left">
                <div class="pro_title">提交成功</div>
                <div style="padding:50px;text-align:center">
                    <p style="font-size:18px;color:#795312;margin-bottom:20px">
                        感谢您的信任！
                    </p>
                    <p style="line-height:28px">
                        我们的专业顾问将在24小时内与您联系。<br />
                        如有紧急问题，请拨打咨询热线：023-89698386
                    </p>
                    <p style="margin-top:30px">
                        <a href="/" class="pgbutton">返回首页</a>
                    </p>
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
