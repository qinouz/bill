// 云函数：addBill
// 新增账单（支持单条或批量）

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  // 获取用户身份
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: 1, message: '未登录' }
  }

  // 查询用户 ID
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) {
    return { code: 1, message: '用户不存在' }
  }
  const userId = userRes.data[0]._id

  try {
    // 支持批量插入
    if (event.items && Array.isArray(event.items)) {
      const tasks = event.items.map(item =>
        db.collection('bills').add({
          data: {
            userId,
            categoryId: item.categoryId,
            amount: parseFloat(item.amount),
            type: item.type,
            remark: item.remark || '',
            billDate: item.billDate,
            createTime: new Date(),
            updateTime: new Date(),
            isDeleted: false,
          },
        })
      )

      const results = await Promise.all(tasks)
      const billIds = results.map(r => r._id)

      return {
        code: 0,
        data: { billIds, count: billIds.length },
        message: 'success',
      }
    }

    // 单条插入
    const { categoryId, amount, type, remark, billDate } = event
    const res = await db.collection('bills').add({
      data: {
        userId,
        categoryId,
        amount: parseFloat(amount),
        type,
        remark: remark || '',
        billDate,
        createTime: new Date(),
        updateTime: new Date(),
        isDeleted: false,
      },
    })

    return {
      code: 0,
      data: { billId: res._id },
      message: 'success',
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
    }
  }
}
