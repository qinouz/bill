const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, enabled, time } = event

  if (!userId) {
    return { code: 1, message: '参数不完整' }
  }

  try {
    // 查询是否已有记录
    const existing = await db.collection('user_reminders')
      .where({ userId })
      .get()

    if (existing.data.length > 0) {
      // 更新
      await db.collection('user_reminders')
        .doc(existing.data[0]._id)
        .update({
          data: {
            enabled,
            time,
            updateTime: db.serverDate(),
          },
        })
    } else {
      // 新增 - 需要获取 openid
      const wxContext = cloud.getWXContext()
      await db.collection('user_reminders')
        .add({
          data: {
            userId,
            openid: wxContext.OPENID,
            enabled,
            time,
            createTime: db.serverDate(),
            updateTime: db.serverDate(),
          },
        })
    }

    return {
      code: 0,
      message: 'success',
    }
  } catch (error) {
    console.error('更新提醒设置失败:', error)
    return { code: 1, message: error.message }
  }
}
