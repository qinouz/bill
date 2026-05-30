const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { billId, categoryId, amount, remark, billDate } = event

  try {
    const updateData = { updateTime: new Date() }
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (remark !== undefined) updateData.remark = remark
    if (billDate !== undefined) updateData.billDate = billDate

    await db.collection('bills').doc(billId).update({ data: updateData })

    return { code: 0, data: null, message: 'success' }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
