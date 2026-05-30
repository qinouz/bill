const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const userRes = await db.collection('users').where({ openid }).get()

    let user
    if (userRes.data.length > 0) {
      user = userRes.data[0]
    } else {
      const createRes = await db.collection('users').add({
        data: {
          openid,
          nickName: '新用户',
          avatarUrl: '',
          createTime: new Date(),
        },
      })
      user = {
        _id: createRes._id,
        openid,
        nickName: '新用户',
        avatarUrl: '',
        createTime: new Date().toISOString(),
      }
    }

    return {
      code: 0,
      data: {
        openid,
        userId: user._id,
        nickName: user.nickName || '新用户',
        avatarUrl: user.avatarUrl || '',
      },
      message: 'success',
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
