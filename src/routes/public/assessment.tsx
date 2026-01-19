// Public Assessment Routes - 移民评估
import { Hono } from 'hono';
import { pinggu, link } from '../../db/schema';
import { Layout } from '../../components/Layout';
import { assessmentSchema } from '../../validations';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 移民评估
app.get('/assessment', async (c) => {
    const db = c.get('db');
    const friendshipLinks = await db.select().from(link);

    return c.html(
        <Layout title="免费评估" links={friendshipLinks}>
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
        const db = c.get('db');
        const friendshipLinks = await db.select().from(link);

        return c.html(
            <Layout title="验证错误" links={friendshipLinks}>
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

    const friendshipLinks = await db.select().from(link);

    return c.html(
        <Layout title="提交成功" links={friendshipLinks}>
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
