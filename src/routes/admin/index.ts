// Admin Routes Index - 汇总所有后台管理路由
import { Hono } from 'hono';
import type { AppEnv } from '../../types';

// 导入所有子模块
import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import newsRoutes from './news';
import projectRoutes from './project';
import caseRoutes from './case';
import teamRoutes from './team';
import eventRoutes from './event';
import assessmentRoutes from './assessment';
import adRoutes from './ad';
import uploadPageRoutes from './upload-page';
import uploadRoutes from '../upload';

const app = new Hono<AppEnv>();

// Admin 根路径重定向到登录页
app.get('/', (c) => {
    return c.redirect('/admin/login');
});


// 挂载所有路由
app.route('/', authRoutes);
app.route('/', dashboardRoutes);
app.route('/', newsRoutes);
app.route('/', projectRoutes);
app.route('/', caseRoutes);
app.route('/', teamRoutes);
app.route('/', eventRoutes);
app.route('/', assessmentRoutes);
app.route('/', adRoutes);
app.route('/', uploadPageRoutes);
app.route('/', uploadRoutes);

export default app;
