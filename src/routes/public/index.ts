// Public Routes Index - 汇总所有前台路由
import { Hono } from 'hono';
import type { AppEnv } from '../../types';

// 导入所有子模块
import homeRoutes from './home';
import programRoutes from './program';
import newsRoutes from './news';
import caseRoutes from './case';
import teamRoutes from './team';
import eventRoutes from './event';
import aboutRoutes from './about';
import contactRoutes from './contact';
import assessmentRoutes from './assessment';

const app = new Hono<AppEnv>();

// 挂载所有路由
app.route('/', homeRoutes);
app.route('/', programRoutes);
app.route('/', newsRoutes);
app.route('/', caseRoutes);
app.route('/', teamRoutes);
app.route('/', eventRoutes);
app.route('/', aboutRoutes);
app.route('/', contactRoutes);
app.route('/', assessmentRoutes);

export default app;
