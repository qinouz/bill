const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { userId } = event

  try {
    // 获取所有未删除账单的日期
    const billsRes = await db
      .collection('bills')
      .where({ userId, isDeleted: false })
      .field({ billDate: true })
      .orderBy('billDate', 'desc')
      .get()

    const dates = [...new Set(billsRes.data.map((b) => b.billDate))].sort().reverse()
    const billCount = billsRes.data.length
    const recordDays = dates.length

    // 计算连续打卡天数
    let consecutiveDays = 0
    if (dates.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      // 从今天或最近一天开始往回数
      let checkDate = new Date(dates[0])
      checkDate.setHours(0, 0, 0, 0)

      // 如果最近记录不是今天也不是昨天，连续为0
      const diffToday = Math.floor((today - checkDate) / (1000 * 60 * 60 * 24))
      if (diffToday <= 1) {
        const dateSet = new Set(dates)
        for (let i = 0; i < 365; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const dStr = d.toISOString().split('T')[0]
          if (dateSet.has(dStr)) {
            consecutiveDays++
          } else if (i > 0) {
            break
          }
        }
      }
    }

    return {
      code: 0,
      data: { consecutiveDays, recordDays, billCount },
      message: 'success',
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
