const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const sourceDir = path.join(rootDir, 'dist', 'build', 'mp-weixin')
const targetDir = path.join(rootDir, 'dist', 'dev', 'mp-weixin')

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Build output not found: ${sourceDir}`)
}

try {
  fs.rmSync(targetDir, { recursive: true, force: true })
} catch (error) {
  console.warn(`Could not remove ${targetDir}; copying over existing files instead.`)
  console.warn(error.message)
}

fs.mkdirSync(path.dirname(targetDir), { recursive: true })
fs.mkdirSync(targetDir, { recursive: true })
fs.cpSync(sourceDir, targetDir, { recursive: true })

console.log(`Synced ${sourceDir} -> ${targetDir}`)
