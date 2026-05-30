const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { manual, openid } = event
  const wxContext = cloud.getWXContext()

  try {
    let users = []

    // 获取当前时间（北京时间）
    const now = new Date()
    const beijingHour = (now.getUTCHours() + 8) % 24
    const beijingMinute = now.getUTCMinutes()
    const currentTime = `${String(beijingHour).padStart(2, '0')}:${String(beijingMinute).padStart(2, '0')}`

    if (manual && openid) {
      // 手动测试模式：直接发送给指定用户
      console.log('手动测试模式，发送给:', openid)
      users = [{ openid, userId: 'test' }]
    } else {
      // 定时模式：查询匹配时间的用户
      console.log('当前北京时间:', currentTime)

      const usersRes = await db.collection('user_reminders')
        .where({
          enabled: true,
          time: currentTime,
        })
        .get()

      users = usersRes.data
    }

    console.log('找到用户数:', users.length)

    const results = []

    for (const user of users) {
      try {
        // 发送订阅消息
        const sendRes = await cloud.openapi.subscribeMessage.send({
          touser: user.openid,
          templateId: 'p7Ef4vKVCJVVimX6W3Cp4OgT8e4Jvmo1hL84SdJBgWI',
          page: '/pages/index/index',
          data: {
            time2: { value: currentTime },
            thing8: { value: '该记账啦！记录今天的收支吧' },
          },
        })

        results.push({
          userId: user.userId,
          success: true,
        })
      } catch (err) {
        console.error('发送失败:', user.userId, err)
        results.push({
          userId: user.userId,
          success: false,
          error: err.message,
        })
      }
    }

    return {
      code: 0,
      data: {
        total: users.length,
        results,
      },
      message: 'success',
    }
  } catch (error) {
    console.error('定时提醒失败:', error)
    return { code: 1, message: error.message }
  }
}
