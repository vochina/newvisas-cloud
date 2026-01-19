// AdminLayout - 后台管理统一布局组件

import type { FC, PropsWithChildren } from 'hono/jsx';
import { raw } from 'hono/html';

type AdminLayoutProps = PropsWithChildren<{
    title: string;
    username?: string;
}>;

export const AdminLayout: FC<AdminLayoutProps> = ({ title, username, children }) => (
    <html lang="zh-CN">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>{title} - 鑫嘉园 后台</title>
            {/* QuillJS CDN */}
            <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet" />
            <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                    font-family: system-ui, -apple-system, sans-serif;
                    background: #f5f7fa;
                    min-height: 100vh;
                }
                .admin-layout {
                    display: flex;
                    min-height: 100vh;
                }
                /* 侧边栏 */
                .sidebar {
                    width: 240px;
                    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
                    color: white;
                    position: fixed;
                    height: 100vh;
                    overflow-y: auto;
                }
                .sidebar-header {
                    padding: 24px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .sidebar-header h1 {
                    font-size: 20px;
                    font-weight: 600;
                }
                .sidebar-menu {
                    padding: 16px 0;
                }
                .menu-item {
                    display: flex;
                    align-items: center;
                    padding: 14px 24px;
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    transition: all 0.2s;
                    border-left: 3px solid transparent;
                }
                .menu-item:hover {
                    background: rgba(255,255,255,0.05);
                    color: white;
                    border-left-color: #667eea;
                }
                .menu-item.active {
                    background: rgba(102,126,234,0.2);
                    color: white;
                    border-left-color: #667eea;
                }
                .menu-item .icon {
                    margin-right: 12px;
                    font-size: 18px;
                }
                /* 主内容区 */
                .main-content {
                    flex: 1;
                    margin-left: 240px;
                    min-height: 100vh;
                }
                .topbar {
                    background: white;
                    padding: 16px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .topbar h2 {
                    font-size: 20px;
                    color: #333;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .user-info span {
                    color: #666;
                }
                .user-info a {
                    color: #667eea;
                    text-decoration: none;
                }
                .user-info a:hover {
                    text-decoration: underline;
                }
                .content-area {
                    padding: 24px 32px;
                }
                /* 通用卡片 */
                .card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                    padding: 24px;
                    margin-bottom: 24px;
                }
                /* 表格样式 */
                .table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .table th,
                .table td {
                    padding: 14px 16px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                .table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #555;
                }
                .table tr:hover td {
                    background: #f8f9fa;
                }
                /* 按钮样式 */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    text-decoration: none;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102,126,234,0.4);
                }
                .btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .btn-secondary:hover {
                    background: #e0e0e0;
                }
                .btn-danger {
                    background: #e74c3c;
                    color: white;
                }
                .btn-danger:hover {
                    background: #c0392b;
                }
                .btn-sm {
                    padding: 6px 12px;
                    font-size: 13px;
                }
                /* 表单样式 */
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #333;
                }
                .form-control {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 15px;
                    transition: border-color 0.2s;
                }
                .form-control:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .form-control.error {
                    border-color: #e74c3c;
                }
                .error-message {
                    color: #e74c3c;
                    font-size: 13px;
                    margin-top: 6px;
                }
                textarea.form-control {
                    min-height: 150px;
                    resize: vertical;
                }
                select.form-control {
                    cursor: pointer;
                }
                /* 工具栏 */
                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                /* 分页 */
                .pagination {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    margin-top: 24px;
                }
                .pagination a {
                    padding: 8px 14px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    color: #666;
                    text-decoration: none;
                }
                .pagination a:hover,
                .pagination a.active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                /* 操作按钮组 */
                .action-btns {
                    display: flex;
                    gap: 8px;
                }
                /* Alert 消息 */
                .alert {
                    padding: 14px 18px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .alert-success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .alert-error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                /* QuillJS 编辑器样式 */
                .quill-editor {
                    background: white;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    height: calc(50vh - 50px);
                }
                /* QuillJS 会将编辑器容器添加 ql-container 类到 .quill-editor 元素 */
                .quill-editor.ql-container {
                    border: 2px solid #e1e5e9;
                    border-top: none;
                    height: calc(50vh - 50px);
                    font-size: 15px;
                    border-radius: 0 0 8px 8px;
                }
                .quill-editor.ql-container .ql-editor {
                    height: calc(50vh - 100px);
                    max-height: calc(50vh - 100px);
                    overflow-y: auto;
                }
                /* 工具栏样式 - QuillJS 会将工具栏作为兄弟元素插入 */
                .ql-toolbar.ql-snow {
                    border: 2px solid #e1e5e9;
                    border-radius: 8px 8px 0 0;
                    background: #fafafa;
                }
            `}</style>
        </head>
        <body>
            <div class="admin-layout">
                {/* 侧边栏 */}
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <h1>🌍 鑫嘉园</h1>
                    </div>
                    <nav class="sidebar-menu">
                        <a href="/admin/dashboard" class="menu-item">
                            <span class="icon">📊</span>
                            控制面板
                        </a>
                        <a href="/admin/countries" class="menu-item">
                            <span class="icon">🌎</span>
                            国家管理
                        </a>
                        <a href="/admin/categories" class="menu-item">
                            <span class="icon">📑</span>
                            分类管理
                        </a>
                        <a href="/admin/properties" class="menu-item">
                            <span class="icon">🏠</span>
                            房产管理
                        </a>
                        <a href="/admin/news" class="menu-item"
                        >
                            <span class="icon">📰</span>
                            新闻管理
                        </a>
                        <a href="/admin/projects" class="menu-item">
                            <span class="icon">🌍</span>
                            项目管理
                        </a>
                        <a href="/admin/cases" class="menu-item">
                            <span class="icon">✅</span>
                            案例管理
                        </a>
                        <a href="/admin/team" class="menu-item">
                            <span class="icon">👥</span>
                            团队管理
                        </a>
                        <a href="/admin/events" class="menu-item">
                            <span class="icon">📅</span>
                            活动管理
                        </a>
                        <a href="/admin/pinggu" class="menu-item">
                            <span class="icon">📋</span>
                            评估申请
                        </a>
                        <a href="/admin/ads" class="menu-item">
                            <span class="icon">📣</span>
                            广告管理
                        </a>
                        <a href="/admin/links" class="menu-item">
                            <span class="icon">🔗</span>
                            友链管理
                        </a>
                        <a href="/admin/users" class="menu-item">
                            <span class="icon">👤</span>
                            用户管理
                        </a>
                    </nav>
                </aside>

                {/* 主内容 */}
                <main class="main-content">
                    <header class="topbar">
                        <h2>{title}</h2>
                        <div class="user-info">
                            <span>👤 {username || '管理员'}</span>
                            <a href="/admin/logout">退出登录</a>
                        </div>
                    </header>
                    <div class="content-area">
                        {children}
                    </div>
                </main>
            </div>
            {/* QuillJS 初始化脚本 */}
            <script dangerouslySetInnerHTML={{
                __html: `
                document.addEventListener('DOMContentLoaded', function() {
                    // QuillJS 配置
                    var quillConfig = {
                        theme: 'snow',
                        modules: {
                            toolbar: [
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'color': [] }, { 'background': [] }],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                [{ 'align': [] }],
                                ['link', 'image'],
                                ['clean']
                            ]
                        }
                    };
                    
                    // 存储所有编辑器实例
                    window.quillEditors = {};
                    
                    // 初始化所有 Quill 编辑器
                    document.querySelectorAll('.quill-editor').forEach(function(container) {
                        var fieldName = container.dataset.field;
                        if (!fieldName) return;
                        
                        var hiddenInput = document.getElementById('input-' + fieldName);
                        if (!hiddenInput) return;
                        
                        var quill = new Quill(container, quillConfig);
                        
                        // 设置初始内容
                        if (hiddenInput.value) {
                            quill.root.innerHTML = hiddenInput.value;
                        }
                        
                        // 存储实例
                        window.quillEditors[fieldName] = quill;
                    });
                    
                    // 表单提交时同步内容
                    document.querySelectorAll('form').forEach(function(form) {
                        form.addEventListener('submit', function() {
                            for (var fieldName in window.quillEditors) {
                                var quill = window.quillEditors[fieldName];
                                var hiddenInput = document.getElementById('input-' + fieldName);
                                if (hiddenInput && quill) {
                                    hiddenInput.value = quill.root.innerHTML;
                                }
                            }
                        });
                    });
                });
            ` }} />
        </body>
    </html>
);
