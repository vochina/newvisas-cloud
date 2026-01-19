// Public Contact Route - 联系我们
import { Hono } from 'hono';
import { link } from '../../db/schema';
import { Layout } from '../../components/Layout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 联系我们
app.get('/contact', async (c) => {
    const db = c.get('db');
    const friendshipLinks = await db.select().from(link);

    return c.html(
        <Layout title="联系我们" links={friendshipLinks}>
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

export default app;
