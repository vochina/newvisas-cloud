// Admin Upload Page - 上传工具页面
import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { AdminLayout } from '../../components/AdminLayout';
import type { AppEnv } from '../../types';

const app = new Hono<AppEnv>();

app.get('/upload-page', authMiddleware, async (c) => {
    const currentUser = c.get('user');

    return c.html(
        <AdminLayout title="上传图片" username={currentUser?.username}>
            <div class="card">
                <h3 style={{ marginBottom: '20px' }}>图片上传工具</h3>

                <div class="form-group">
                    <label>选择图片</label>
                    <input type="file" id="fileInput" accept="image/*" class="form-control" />
                    <p style={{ color: '#999', fontSize: '13px', marginTop: '5px' }}>
                        支持 JPG, PNG, GIF, WEBP 格式，最大 5MB
                    </p>
                </div>

                <button onclick="uploadFile()" class="btn btn-primary">上传</button>

                <div id="result" style={{ marginTop: '20px' }}></div>
            </div>

            <script>{`
                async function uploadFile() {
                    const fileInput = document.getElementById('fileInput');
                    const resultDiv = document.getElementById('result');
                    
                    if (!fileInput.files || !fileInput.files[0]) {
                        resultDiv.innerHTML = '<div class="alert alert-error">请选择文件</div>';
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    
                    resultDiv.innerHTML = '<p>上传中...</p>';
                    
                    try {
                        const response = await fetch('/admin/upload', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            resultDiv.innerHTML = \`
                                <div class="alert alert-success">上传成功!</div>
                                <p><strong>URL:</strong> <input type="text" value="\${data.url}" onclick="this.select()" class="form-control" readonly /></p>
                                <p><img src="\${data.url}" style="max-width: 300px; margin-top: 10px;" /></p>
                            \`;
                        } else {
                            resultDiv.innerHTML = '<div class="alert alert-error">' + data.error + '</div>';
                        }
                    } catch (err) {
                        resultDiv.innerHTML = '<div class="alert alert-error">上传失败: ' + err.message + '</div>';
                    }
                }
            `}</script>
        </AdminLayout>
    );
});

export default app;
