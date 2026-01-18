#!/bin/bash
# Upload all images to remote R2 bucket with progress display

BUCKET_NAME="newvisas-bucket"
SOURCE_DIR="/Users/alejandro/Code/Archive/newvisas-asp/Mrevisa"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "   上传图片到 Cloudflare R2 (线上)"
echo "============================================"
echo ""

# Count total files
echo "正在统计文件数量..."
total_image=$(find "$SOURCE_DIR/image" -type f 2>/dev/null | wc -l | tr -d ' ')
total_attached=$(find "$SOURCE_DIR/attached/image" -type f 2>/dev/null | wc -l | tr -d ' ')
total=$((total_image + total_attached))

echo "📁 image/ 目录: $total_image 个文件"
echo "📁 attached/image/ 目录: $total_attached 个文件"
echo "📊 总计: $total 个文件"
echo ""
echo "开始上传..."
echo ""

uploaded=0
failed=0
start_time=$(date +%s)

# Function to show progress
show_progress() {
    local current=$1
    local total=$2
    local percent=$((current * 100 / total))
    local elapsed=$(($(date +%s) - start_time))
    local rate=0
    if [ $elapsed -gt 0 ]; then
        rate=$((current / elapsed))
    fi
    printf "\r[%3d%%] 已上传: %d/%d | 失败: %d | 速度: %d/秒 | 用时: %ds     " \
        "$percent" "$current" "$total" "$failed" "$rate" "$elapsed"
}

# Upload image/ directory
echo "📤 上传 image/ 目录..."
for file in "$SOURCE_DIR/image/"*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        if npx wrangler r2 object put "$BUCKET_NAME/image/$filename" --file="$file" --remote 2>/dev/null; then
            uploaded=$((uploaded + 1))
        else
            failed=$((failed + 1))
        fi
        show_progress $((uploaded + failed)) $total
    fi
done
echo ""

# Upload attached/image/ directories
echo ""
echo "📤 上传 attached/image/ 目录..."
for dir in "$SOURCE_DIR/attached/image/"*/; do
    if [ -d "$dir" ]; then
        dirname=$(basename "$dir")
        for file in "$dir"*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                if npx wrangler r2 object put "$BUCKET_NAME/attached/image/$dirname/$filename" --file="$file" --remote 2>/dev/null; then
                    uploaded=$((uploaded + 1))
                else
                    failed=$((failed + 1))
                fi
                show_progress $((uploaded + failed)) $total
            fi
        done
    fi
done

end_time=$(date +%s)
total_time=$((end_time - start_time))

echo ""
echo ""
echo "============================================"
echo "   上传完成!"
echo "============================================"
echo "✅ 成功上传: $uploaded 个文件"
echo "❌ 上传失败: $failed 个文件"
echo "⏱️  总用时: ${total_time}秒"
echo "============================================"
