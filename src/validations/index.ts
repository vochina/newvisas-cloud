// Zod Validation Schemas for NewVisas Admin
// 表单验证 Schema 定义

import { z } from 'zod';

// ==================== 认证相关 ====================

// 登录表单验证
export const loginSchema = z.object({
    username: z.string().min(1, '请输入用户名'),
    password: z.string().min(1, '请输入密码'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ==================== 新闻管理 ====================

// 新闻表单验证
export const newsSchema = z.object({
    title: z.string().min(1, '请输入新闻标题').max(200, '标题不能超过200字'),
    classId: z.coerce.number().optional(),
    keywords: z.string().max(200, '关键词不能超过200字').optional(),
    description: z.string().max(500, '描述不能超过500字').optional(),
    content: z.string().optional(),
    source: z.string().max(100, '来源不能超过100字').optional(),
    pic: z.string().optional(),
});

export type NewsInput = z.infer<typeof newsSchema>;

// ==================== 项目管理 ====================

// 移民项目表单验证
export const projectSchema = z.object({
    title: z.string().min(1, '请输入项目名称').max(200, '项目名称不能超过200字'),
    zhouId: z.coerce.number().optional(),
    guojiaId: z.coerce.number().min(1, '请选择国家'),
    keywords: z.string().max(200, '关键词不能超过200字').optional(),
    description: z.string().max(500, '描述不能超过500字').optional(),
    content: z.string().optional(),
    advantages: z.string().optional(),  // 项目优势
    process: z.string().optional(),     // 办理流程
    conditions: z.string().optional(),  // 申请条件
    pic: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// ==================== 案例管理 ====================

// 成功案例表单验证
export const caseSchema = z.object({
    title: z.string().min(1, '请输入案例标题').max(200, '标题不能超过200字'),
    guojiaId: z.coerce.number().min(1, '请选择国家'),
    keywords: z.string().max(200, '关键词不能超过200字').optional(),
    description: z.string().max(500, '描述不能超过500字').optional(),
    content: z.string().optional(),
    pic: z.string().optional(),
});

export type CaseInput = z.infer<typeof caseSchema>;

// ==================== 团队管理 ====================

// 团队成员表单验证
export const teamSchema = z.object({
    name: z.string().min(1, '请输入姓名').max(50, '姓名不能超过50字'),
    title: z.string().max(100, '职务不能超过100字').optional(),
    keywords: z.string().max(200, '关键词不能超过200字').optional(),
    description: z.string().max(500, '描述不能超过500字').optional(),
    content: z.string().optional(),
    pic: z.string().optional(),
    qq: z.string().max(20, 'QQ号不能超过20字').optional(),
    sortOrder: z.coerce.number().default(0),
});

export type TeamInput = z.infer<typeof teamSchema>;

// ==================== 评估申请 (前台) ====================

// 移民评估表单验证
export const assessmentSchema = z.object({
    name: z.string().min(1, '请输入姓名').max(50, '姓名不能超过50字'),
    gender: z.enum(['男', '女']).optional(),
    phone: z.string().min(1, '请输入联系电话').max(20, '电话号码格式不正确'),
    phone2: z.string().max(20).optional(),
    birthday: z.string().optional(),
    email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
    targetCountry: z.string().min(1, '请选择目标国家'),
    targetCountry2: z.string().optional(),
    intention: z.string().optional(),
    callbackTime: z.string().optional(),
    budget: z.string().optional(),
    english: z.string().optional(),
    legalPerson: z.string().optional(),
    shareholder: z.string().optional(),
    position: z.string().optional(),
    company: z.string().optional(),
    referral: z.string().optional(),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;

// ==================== 图片上传 ====================

// 图片上传验证
export const uploadSchema = z.object({
    file: z.any().refine(
        (file) => file instanceof File,
        '请选择要上传的文件'
    ),
});

// 允许的图片类型
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

// 最大文件大小 (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 验证图片文件
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { valid: false, error: '仅支持 JPG, PNG, GIF, WEBP 格式图片' };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: '图片大小不能超过 5MB' };
    }
    return { valid: true };
}

// ==================== 通用工具 ====================

// 格式化 Zod 错误
export function formatZodErrors(error: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) {
            errors[path] = issue.message;
        }
    }
    return errors;
}
