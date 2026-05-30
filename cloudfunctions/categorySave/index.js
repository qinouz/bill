// 云函数：categorySave
// 新增或保存分类

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, categoryId, name, icon, type, sort } = event

  try {
    let res

    if (categoryId) {
      // 更新分类
      res = await db.collection('categories').doc(categoryId).update({
        data: {
          name,
          icon,
          type,
          sort,
          updateTime: new Date(),
        },
      })
    } else {
      // 新增分类
      res = await db.collection('categories').add({
        data: {
          userId,
          name,
          icon,
          type,
          sort,
          isDefault: false,
          createTime: new Date(),
        },
      })
    }

    return {
      code: 0,
      data: {
        categoryId: categoryId || res._id,
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
