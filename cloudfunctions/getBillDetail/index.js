const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { billId } = event

  try {
    const res = await db.collection('bills').doc(billId).get()

    if (res.data.isDeleted) {
      return { code: 1, message: '账单已删除' }
    }

    return { code: 0, data: res.data, message: 'success' }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
