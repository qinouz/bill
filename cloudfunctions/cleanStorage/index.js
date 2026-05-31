const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 获取昨天的日期字符串 (YYYYMMDD)
function getYesterdayDateStr() {
  const now = new Date()
  // 转北京时间
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  beijingTime.setDate(beijingTime.getDate() - 1)
  const year = beijingTime.getUTCFullYear()
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(beijingTime.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 判断文件是否是昨天的
function isYesterdayFile(cloudPath, yesterdayStr) {
  // 文件路径格式: voice/userId/timestamp.mp3 或 photo/userId/timestamp.jpg
  const parts = cloudPath.split('/')
  if (parts.length < 3) return false

  const filename = parts[parts.length - 1]
  const timestamp = parseInt(filename.split('.')[0])

  if (isNaN(timestamp)) return false

  // 将时间戳转为日期字符串
  const fileDate = new Date(timestamp)
  const beijingDate = new Date(fileDate.getTime() + 8 * 60 * 60 * 1000)
  const year = beijingDate.getUTCFullYear()
  const month = String(beijingDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(beijingDate.getUTCDate()).padStart(2, '0')
  const fileDateStr = `${year}${month}${day}`

  return fileDateStr === yesterdayStr
}

exports.main = async (event, context) => {
  try {
    const yesterdayStr = getYesterdayDateStr()
    console.log('清理日期:', yesterdayStr)

    const db = cloud.database()
    const _ = db.command

    // 要清理的目录
    const prefixes = ['voice/', 'photo/']
    let totalDeleted = 0

    for (const prefix of prefixes) {
      let hasMore = true
      let marker = ''

      while (hasMore) {
        // 列出文件
        const listResult = await cloud.getCloudFileList({
          prefix,
          marker,
          max: 100,
        })

        const fileList = listResult.fileList || []
        hasMore = listResult.isTruncated
        marker = listResult.marker || ''

        // 筛选昨天的文件
        const yesterdayFiles = fileList.filter(file =>
          isYesterdayFile(file.cloudPath, yesterdayStr)
        )

        if (yesterdayFiles.length > 0) {
          // 批量删除
          const fileIDs = yesterdayFiles.map(f => f.fileID)
          console.log(`删除 ${prefix} 目录下 ${fileIDs.length} 个文件`)

          // 分批删除（每次最多50个）
          for (let i = 0; i < fileIDs.length; i += 50) {
            const batch = fileIDs.slice(i, i + 50)
            await cloud.deleteFile({
              fileList: batch,
            })
            totalDeleted += batch.length
          }
        }

        // 如果没有更多文件，退出循环
        if (!hasMore) break
      }
    }

    console.log(`清理完成，共删除 ${totalDeleted} 个文件`)

    return {
      code: 0,
      data: {
        date: yesterdayStr,
        deletedCount: totalDeleted,
      },
      message: 'success',
    }
  } catch (error) {
    console.error('清理存储失败:', error)
    return { code: 1, message: error.message }
  }
}
