// 云函数：addBill
// 新增账单

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, categoryId, amount, type, remark, billDate } = event

  try {
    const res = await db.collection('bills').add({
      data: {
        userId,
        categoryId,
        amount: parseFloat(amount),
        type,
        remark,
        billDate,
        createTime: new Date(),
        updateTime: new Date(),
        isDeleted: false,
      },
    })

    return {
      code: 0,
      data: {
        billId: res._id,
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
