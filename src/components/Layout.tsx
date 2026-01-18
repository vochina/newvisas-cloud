// Layout Component - 公共页面布局 (原版样式)

import type { FC, PropsWithChildren } from 'hono/jsx';

type LayoutProps = PropsWithChildren<{
    title: string;
}>;

export const Layout: FC<LayoutProps> = ({ title, children }) => (
    <html lang="zh-CN">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>{title} - NewVisas 移民签证服务</title>
            <link rel="stylesheet" href="/static/css/style.css" />
        </head>
        <body>
            {/* 头部 Logo 区域 */}
            <div class="header">
                <div class="header_logo">
                    <a href="/">
                        <img src="/image/logo.png" alt="NewVisas" />
                    </a>
                </div>
                <div class="header_right">
                    <div class="header1">
                        <span class="pp_weixin"></span>关注微信公众号
                    </div>
                    <div class="header2">
                        <a href="tel:023-89698386">
                            <img src="/image/tel.png" alt="电话" style="height:30px;vertical-align:middle" />
                        </a>
                    </div>
                </div>
                <div class="clear"></div>
            </div>

            {/* 导航栏 */}
            <div class="nav">
                <div class="nav_in">
                    <ul class="nav_left">
                        <li>
                            <a href="/">
                                <b>首页</b><br />
                                <span>Home</span>
                            </a>
                        </li>
                        <li>
                            <a href="/program">
                                <b>移民项目</b><br />
                                <span>Programs</span>
                            </a>
                            <ul>
                                <dl><a href="/program?pid=1">美国</a></dl>
                                <dl><a href="/program?pid=2">加拿大</a></dl>
                                <dl><a href="/program?pid=3">澳大利亚</a></dl>
                                <dl><a href="/program?pid=4">欧洲</a></dl>
                            </ul>
                        </li>
                        <li>
                            <a href="/news">
                                <b>新闻资讯</b><br />
                                <span>News</span>
                            </a>
                        </li>
                        <li>
                            <a href="/case">
                                <b>成功案例</b><br />
                                <span>Cases</span>
                            </a>
                        </li>
                        <li>
                            <a href="/team">
                                <b>专家团队</b><br />
                                <span>Team</span>
                            </a>
                        </li>
                        <li>
                            <a href="/events">
                                <b>活动讲座</b><br />
                                <span>Events</span>
                            </a>
                        </li>
                        <li>
                            <a href="/about">
                                <b>关于我们</b><br />
                                <span>About</span>
                            </a>
                        </li>
                    </ul>
                    <div class="nav_right">
                        <a href="/assessment">免费评估</a>
                    </div>
                    <div class="clear"></div>
                </div>
            </div>

            {/* 主内容区域 */}
            <div class="index_section">
                {children}
                <div class="clear"></div>
            </div>

            {/* 友情链接 */}
            <div class="index_link">
                <div class="index_link_in">
                    友情链接：
                    <a href="#">移民资讯</a>
                    <a href="#">签证服务</a>
                    <a href="#">海外房产</a>
                    <a href="#">出国留学</a>
                </div>
            </div>

            {/* 底部 */}
            <div class="bottom">
                <div class="bottom_in">
                    <div class="bottom_left">
                        <div class="bottom_nav">
                            <a href="/">首页</a>
                            <a href="/program">移民项目</a>
                            <a href="/news">新闻资讯</a>
                            <a href="/case">成功案例</a>
                            <a href="/team">专家团队</a>
                            <a href="/events">活动讲座</a>
                            <a href="/about">关于我们</a>
                            <a href="/contact">联系我们</a>
                        </div>
                        <p style="color:#999;line-height:25px;margin-top:10px">
                            重庆鑫嘉园出入境服务有限公司<br />
                            地址：重庆渝中区解放碑邹容路68号大都会东方广场37楼<br />
                            电话：023-89698386 &nbsp; 邮箱：service@mail.newvisas.com<br />
                            © 2013-{new Date().getFullYear()} NewVisas. All rights reserved.
                        </p>
                    </div>
                    <div class="bottom_right">
                        <div class="bottom_erweima">
                            <img src="/image/erweima_weixin.jpg" alt="微信公众号" style="width:100px;height:100px" />
                            关注微信公众号
                        </div>
                    </div>
                    <div class="clear"></div>
                </div>
            </div>

            <script src="/static/js/app.js"></script>
        </body>
    </html>
);
