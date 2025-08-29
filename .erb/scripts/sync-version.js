import fs from 'fs';
import path from 'path';

// 读取根目录的 package.json
const rootPackagePath = path.join(__dirname, '../../package.json');
const appPackagePath = path.join(__dirname, '../../release/app/package.json');

try {
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  
  // 检查 release/app/package.json 是否存在
  if (fs.existsSync(appPackagePath)) {
    const appPackage = JSON.parse(fs.readFileSync(appPackagePath, 'utf8'));
    
    // 同步版本号和基本信息
    appPackage.version = rootPackage.version;
    appPackage.name = rootPackage.name;
    appPackage.productName = rootPackage.productName;
    appPackage.description = rootPackage.description;
    appPackage.author = rootPackage.author;
    
    // 写回文件
    fs.writeFileSync(appPackagePath, JSON.stringify(appPackage, null, 2));
    
    console.log(`✅ 版本号已同步: ${rootPackage.version}`);
  } else {
    console.log('⚠️  release/app/package.json 不存在，跳过同步');
  }
} catch (error) {
  console.error('❌ 同步版本号失败:', error.message);
}
