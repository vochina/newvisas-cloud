// Public Home Route - 首页
import { Hono } from 'hono';
import { desc, eq, asc } from 'drizzle-orm';
import { guojia, xm, info, ad, jiangzuo, link } from '../../db/schema';
import { Layout } from '../../components/Layout';
import type { AppEnv } from '../../types';

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
        .limit(5);

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

    // 获取友情链接
    const friendshipLinks = await db
        .select()
        .from(link);

    return c.html(
        <Layout title="首页" links={friendshipLinks}>
            {/* 通栏区域：左侧国家导航 + 中间轮播图 + 右侧评估 */}
            <div class="index_tonglan">
                {/* 左侧国家导航 */}
                <div class="index_tonglan_l">
                    <div style="background:#5D4117;color:#fff;text-align:center;padding:15px 10px;line-height:24px">
                        <div style="font-size:16px;font-weight:bold;margin-bottom:5px">移民国家</div>
                        <div style="font-size:12px;opacity:0.9">Countries</div>
                    </div>
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
                                    <img src="/image/topbg.jpg" alt="鑫嘉园" />
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

export default app;
