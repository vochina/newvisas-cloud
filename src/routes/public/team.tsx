// Public Team Routes - 专家团队
import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import { team } from '../../db/schema';
import { Layout } from '../../components/Layout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

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

export default app;
