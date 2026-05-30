// 云函数：categoryList
// 获取分类列表

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId } = event

  try {
    const res = await db
      .collection('categories')
      .where({
        userId,
      })
      .orderBy('sort', 'asc')
      .get()

    return {
      code: 0,
      data: {
        categories: res.data,
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
