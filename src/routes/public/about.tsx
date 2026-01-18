// Public About Route - 关于我们
import { Hono } from 'hono';
import { Layout } from '../../components/Layout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

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

export default app;
