/**
 * 验证密码哈希值
 */

import bcrypt from 'bcryptjs';

// 数据库中存储的哈希值
const storedHash = '$2b$10$CjIXLNGWDylFIjfe53qx8e84Zu47WoEetC.ddrg6X4CQXUj97aZz2';

// 尝试的密码列表
const passwords = ['admin123', 'admin', '123456', 'password', 'admin888'];

console.log('🔍 验证密码哈希...\n');
console.log('数据库中的哈希值:', storedHash);
console.log('\n测试以下密码:\n');

for (const password of passwords) {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log(`密码 "${password}": ${isValid ? '✅ 匹配' : '❌ 不匹配'}`);
}

console.log('\n如果所有密码都不匹配,请使用以下命令生成新的哈希值:');
console.log('node scripts/hash-password.js "您的密码"');
