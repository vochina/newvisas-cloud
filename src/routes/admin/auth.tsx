// Admin Auth Routes - 登录/登出
import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { user } from '../../db/schema';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 登录页面
app.get('/login', (c) => {
    return c.html(
        <html lang="zh-CN">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>后台登录 - 鑫嘉园</title>
                <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .login-box {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
          }
          h1 { text-align: center; margin-bottom: 30px; color: #333; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 8px; color: #555; }
          input { 
            width: 100%; 
            padding: 12px 16px; 
            border: 2px solid #e1e1e1; 
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
          }
          input:focus { outline: none; border-color: #667eea; }
          button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102,126,234,0.4); }
          .error { color: #e74c3c; text-align: center; margin-bottom: 20px; }
        `}</style>
            </head>
            <body>
                <div class="login-box">
                    <h1>后台管理系统</h1>
                    <form method="post" action="/admin/login">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" name="username" placeholder="请输入用户名" required />
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" name="password" placeholder="请输入密码" required />
                        </div>
                        <button type="submit">登 录</button>
                    </form>
                </div>
            </body>
        </html>
    );
});

// 处理登录
app.post('/login', async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();
    const username = body.username as string;
    const password = body.password as string;

    // 查找用户
    const [admin] = await db
        .select()
        .from(user)
        .where(eq(user.username, username))
        .limit(1);

    // 验证用户和密码 (使用 bcrypt 安全比对)
    if (!admin || !await bcrypt.compare(password, admin.password)) {
        return c.html(
            <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8" />
                    <title>登录失败</title>
                    <style>{`
            body { font-family: system-ui; text-align: center; padding: 50px; }
            .error { color: #e74c3c; margin-bottom: 20px; }
            a { color: #667eea; text-decoration: none; }
          `}</style>
                </head>
                <body>
                    <div class="error">用户名或密码错误</div>
                    <a href="/admin/login">返回登录</a>
                </body>
            </html>,
            401
        );
    }

    // 生成 JWT Token
    const token = await sign(
        {
            sub: admin.id.toString(),
            username: admin.username,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7天
        },
        c.env.JWT_SECRET
    );

    // 设置 Cookie
    setCookie(c, 'auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    return c.redirect('/admin/dashboard');
});

// 登出
app.get('/logout', (c) => {
    deleteCookie(c, 'auth_token');
    return c.redirect('/admin/login');
});

export default app;
