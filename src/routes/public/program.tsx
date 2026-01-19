// Public Program Routes - 移民项目
import { Hono } from 'hono';
import { desc, eq, asc, count } from 'drizzle-orm';
import { guojia, xm, link } from '../../db/schema';
import { Layout } from '../../components/Layout';
import { Pagination } from '../../components/Pagination';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

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

export default app;
