const fs = require('fs')
const path = require('path')

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

module.exports = function copyCloudfunctions() {
  return {
    name: 'copy-cloudfunctions',
    closeBundle() {
      const dest = path.resolve(__dirname, '../dist/dev/mp-weixin')

      // 复制云函数
      const cloudSrc = path.resolve(__dirname, '../cloudfunctions')
      if (fs.existsSync(cloudSrc)) {
        console.log('正在复制云函数到 dist 目录...')
        copyDir(cloudSrc, path.join(dest, 'cloudfunctions'))
        console.log('云函数复制完成！')
      }

      // 复制 project.config.json（如果存在）
      const configSrc = path.resolve(__dirname, '../project.config.json')
      if (fs.existsSync(configSrc)) {
        console.log('正在复制 project.config.json...')
        fs.copyFileSync(configSrc, path.join(dest, 'project.config.json'))
        console.log('project.config.json 复制完成！')
      }

      // 复制 package.json（用于 npm 构建）
      const pkgSrc = path.resolve(__dirname, '../package.json')
      if (fs.existsSync(pkgSrc)) {
        console.log('正在复制 package.json...')
        fs.copyFileSync(pkgSrc, path.join(dest, 'package.json'))
        console.log('package.json 复制完成！')
      }
    }
  }
}
