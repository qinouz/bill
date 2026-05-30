const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { billId } = event

  try {
    await db.collection('bills').doc(billId).update({
      data: { isDeleted: true, updateTime: new Date() },
    })

    return { code: 0, data: null, message: 'success' }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
