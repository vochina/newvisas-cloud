/**
 * 密码哈希工具
 * 用于生成 bcrypt 密码哈希值
 * 
 * 使用方法：
 * node scripts/hash-password.js "你的密码"
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
    console.error('❌ 错误：请提供要加密的密码');
    console.log('使用方法: node scripts/hash-password.js "你的密码"');
    process.exit(1);
}

// 生成 salt 和 hash（使用 10 rounds，推荐值）
const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);

console.log('✅ 密码加密成功！\n');
console.log('原始密码:', password);
console.log('加密后的哈希值:', hash);
console.log('\n📝 请将以下哈希值更新到数据库的 password 字段：');
console.log(hash);

// 验证测试
const isValid = await bcrypt.compare(password, hash);
console.log('\n🔐 验证测试:', isValid ? '✅ 通过' : '❌ 失败');
