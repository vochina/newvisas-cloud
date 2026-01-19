// Admin User Routes - 用户管理
import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { user } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 用户列表
app.get('/users', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    const userList = await db
        .select()
        .from(user)
        .orderBy(asc(user.createdAt));

    return c.html(
        <AdminLayout title="用户管理" username={currentUser?.username}>
            <div class="toolbar">
                <h3 style={{ margin: 0, color: '#666' }}>管理员列表</h3>
                <a href="/admin/users/new" class="btn btn-primary">新建用户</a>
            </div>

            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>ID</th>
                            <th>用户名</th>
                            <th style={{ width: '180px' }}>创建时间</th>
                            <th style={{ width: '120px' }}>登录次数</th>
                            <th style={{ width: '200px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userList.map(item => (
                            <tr>
                                <td>{item.id}</td>
                                <td>
                                    <strong>{item.username}</strong>
                                    {currentUser?.username === item.username && (
                                        <span style={{ marginLeft: '10px', color: '#667eea', fontSize: '12px' }}>(当前用户)</span>
                                    )}
                                </td>
                                <td>{item.createdAt || '-'}</td>
                                <td>{item.loginCount || 0}</td>
                                <td class="action-btns">
                                    <a href={`/admin/users/${item.id}/edit`} class="btn btn-primary btn-sm">修改密码</a>
                                    <form
                                        method="post"
                                        action={`/admin/users/${item.id}/delete`}
                                        style={{ display: 'inline' }}
                                        onsubmit={`return confirm('确定删除用户 ${item.username} 吗？此操作不可恢复！')`}
                                    >
                                        <button
                                            type="submit"
                                            class="btn btn-danger btn-sm"
                                            disabled={currentUser?.username === item.username}
                                        >
                                            删除
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {userList.length === 0 && (
                            <tr><td colspan="5" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无用户</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
});

// 新建用户页面
app.get('/users/new', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    const error = c.req.query('error');

    return c.html(
        <AdminLayout title="新建用户" username={currentUser?.username}>
            <div class="toolbar">
                <h3 style={{ margin: 0, color: '#666' }}>新建管理员</h3>
                <a href="/admin/users" class="btn btn-secondary">返回列表</a>
            </div>

            <div class="card">
                {error && (
                    <div style={{
                        padding: '12px 20px',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        border: '1px solid #fcc'
                    }}>
                        {decodeURIComponent(error)}
                    </div>
                )}

                <form method="post" action="/admin/users">
                    <div class="form-group">
                        <label>用户名 *</label>
                        <input
                            type="text"
                            name="username"
                            class="form-control"
                            required
                            placeholder="请输入用户名"
                            pattern="[a-zA-Z0-9_-]+"
                            title="用户名只能包含字母、数字、下划线和连字符"
                        />
                        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                            只能包含字母、数字、下划线和连字符
                        </small>
                    </div>

                    <div class="form-group">
                        <label>密码 *</label>
                        <input
                            type="password"
                            name="password"
                            class="form-control"
                            required
                            minlength="8"
                            placeholder="请输入密码（至少8位）"
                        />
                        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                            密码长度至少8个字符
                        </small>
                    </div>

                    <div class="form-group">
                        <label>确认密码 *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            class="form-control"
                            required
                            minlength="8"
                            placeholder="请再次输入密码"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        <button type="submit" class="btn btn-primary">创建用户</button>
                        <a href="/admin/users" class="btn btn-secondary">取消</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 创建用户
app.post('/users', authMiddleware, async (c) => {
    const db = c.get('db');
    const body = await c.req.parseBody();
    const username = (body.username as string)?.trim();
    const password = body.password as string;
    const confirmPassword = body.confirmPassword as string;

    // 验证输入
    if (!username || !password) {
        return c.redirect('/admin/users/new?error=' + encodeURIComponent('用户名和密码不能为空'));
    }

    if (password.length < 8) {
        return c.redirect('/admin/users/new?error=' + encodeURIComponent('密码长度至少8个字符'));
    }

    if (password !== confirmPassword) {
        return c.redirect('/admin/users/new?error=' + encodeURIComponent('两次输入的密码不一致'));
    }

    // 检查用户名是否已存在
    const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.username, username))
        .limit(1);

    if (existingUser) {
        return c.redirect('/admin/users/new?error=' + encodeURIComponent('用户名已存在'));
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    await db.insert(user).values({
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        loginCount: 0,
    });

    return c.redirect('/admin/users');
});

// 编辑用户页面（仅修改密码）
app.get('/users/:id/edit', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));
    const error = c.req.query('error');

    const [targetUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

    if (!targetUser) {
        return c.redirect('/admin/users');
    }

    return c.html(
        <AdminLayout title="修改密码" username={currentUser?.username}>
            <div class="toolbar">
                <h3 style={{ margin: 0, color: '#666' }}>修改密码 - {targetUser.username}</h3>
                <a href="/admin/users" class="btn btn-secondary">返回列表</a>
            </div>

            <div class="card">
                {error && (
                    <div style={{
                        padding: '12px 20px',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        border: '1px solid #fcc'
                    }}>
                        {decodeURIComponent(error)}
                    </div>
                )}

                <form method="post" action={`/admin/users/${id}`}>
                    <div class="form-group">
                        <label>新密码 *</label>
                        <input
                            type="password"
                            name="password"
                            class="form-control"
                            required
                            minlength="8"
                            placeholder="请输入新密码（至少8位）"
                        />
                        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                            密码长度至少8个字符
                        </small>
                    </div>

                    <div class="form-group">
                        <label>确认新密码 *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            class="form-control"
                            required
                            minlength="8"
                            placeholder="请再次输入新密码"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        <button type="submit" class="btn btn-primary">更新密码</button>
                        <a href="/admin/users" class="btn btn-secondary">取消</a>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
});

// 更新用户密码
app.post('/users/:id', authMiddleware, async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.parseBody();
    const password = body.password as string;
    const confirmPassword = body.confirmPassword as string;

    // 验证输入
    if (!password) {
        return c.redirect(`/admin/users/${id}/edit?error=` + encodeURIComponent('密码不能为空'));
    }

    if (password.length < 8) {
        return c.redirect(`/admin/users/${id}/edit?error=` + encodeURIComponent('密码长度至少8个字符'));
    }

    if (password !== confirmPassword) {
        return c.redirect(`/admin/users/${id}/edit?error=` + encodeURIComponent('两次输入的密码不一致'));
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 更新密码
    await db.update(user).set({
        password: hashedPassword,
    }).where(eq(user.id, id));

    return c.redirect('/admin/users');
});

// 删除用户
app.post('/users/:id/delete', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');
    const id = parseInt(c.req.param('id'));

    // 获取目标用户
    const [targetUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

    if (!targetUser) {
        return c.redirect('/admin/users');
    }

    // 防止删除自己
    if (currentUser?.username === targetUser.username) {
        return c.html(
            <AdminLayout title="错误" username={currentUser?.username}>
                <div class="card">
                    <div style={{
                        padding: '20px',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '6px',
                        border: '1px solid #fcc',
                        marginBottom: '20px'
                    }}>
                        <strong>操作失败：</strong> 不能删除当前登录的用户！
                    </div>
                    <a href="/admin/users" class="btn btn-secondary">返回用户列表</a>
                </div>
            </AdminLayout>,
            403
        );
    }

    // 检查是否是最后一个管理员
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(user);

    if (count <= 1) {
        return c.html(
            <AdminLayout title="错误" username={currentUser?.username}>
                <div class="card">
                    <div style={{
                        padding: '20px',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '6px',
                        border: '1px solid #fcc',
                        marginBottom: '20px'
                    }}>
                        <strong>操作失败：</strong> 系统至少需要保留一个管理员账户！
                    </div>
                    <a href="/admin/users" class="btn btn-secondary">返回用户列表</a>
                </div>
            </AdminLayout>,
            403
        );
    }

    // 删除用户
    await db.delete(user).where(eq(user.id, id));

    return c.redirect('/admin/users');
});

export default app;
