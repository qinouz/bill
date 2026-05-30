// 云函数：getBillList
// 获取账单列表

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, pageSize = 20, pageNo = 1, month } = event

  try {
    const skip = (pageNo - 1) * pageSize
    const _ = db.command

    let whereCondition = { userId, isDeleted: false }

    if (month) {
      // month 格式: "2024-01"
      const startDate = month + '-01'
      const [year, mon] = month.split('-').map(Number)
      const lastDay = new Date(year, mon, 0).getDate()
      const endDate = month + '-' + String(lastDay).padStart(2, '0')

      whereCondition = {
        userId,
        isDeleted: false,
        billDate: _.gte(startDate).and(_.lte(endDate)),
      }
    }

    const billsRes = await db
      .collection('bills')
      .where(whereCondition)
      .orderBy('billDate', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    const countRes = await db
      .collection('bills')
      .where(whereCondition)
      .count()

    return {
      code: 0,
      data: {
        bills: billsRes.data,
        total: countRes.total,
        pageNo,
        pageSize,
      },
      message: 'success',
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
    }
  }
}
