// Admin Dashboard - 控制面板
import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { info, xm, anli, team } from '../../db/schema';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

// 控制面板
app.get('/dashboard', authMiddleware, async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    // 获取统计数据
    const [newsCount] = await db.select({ count: sql<number>`count(*)` }).from(info);
    const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(xm);
    const [caseCount] = await db.select({ count: sql<number>`count(*)` }).from(anli);
    const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(team);

    return c.html(
        <AdminLayout title="控制面板" username={currentUser?.username}>
            <div class="card">
                <h3 style={{ marginBottom: '20px' }}>欢迎回来！</h3>
                <p>系统运行正常，您可以通过左侧菜单管理网站内容。</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>📰</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{newsCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>新闻资讯</div>
                </div>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>🌍</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{projectCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>移民项目</div>
                </div>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>✅</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{caseCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>成功案例</div>
                </div>
                <div class="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', color: '#667eea', marginBottom: '10px' }}>👥</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{teamCount?.count || 0}</div>
                    <div style={{ color: '#666' }}>团队成员</div>
                </div>
            </div>
        </AdminLayout>
    );
});

export default app;
