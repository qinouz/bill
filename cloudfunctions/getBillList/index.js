// 云函数：getBillList
// 获取账单列表

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, pageSize = 20, pageNo = 1 } = event

  try {
    const skip = (pageNo - 1) * pageSize

    const billsRes = await db
      .collection('bills')
      .where({
        userId,
        isDeleted: false,
      })
      .orderBy('billDate', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    const countRes = await db
      .collection('bills')
      .where({
        userId,
        isDeleted: false,
      })
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
