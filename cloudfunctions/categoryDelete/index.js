const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { categoryId } = event

  if (!categoryId) {
    return { code: 1, message: '参数不完整' }
  }

  try {
    // 检查是否是默认分类
    const catRes = await db.collection('categories').doc(categoryId).get()
    if (catRes.data && catRes.data.isDefault) {
      return { code: 1, message: '默认分类不能删除' }
    }

    // 检查是否有账单使用此分类
    const billRes = await db.collection('bills')
      .where({ categoryId })
      .limit(1)
      .get()

    if (billRes.data.length > 0) {
      return { code: 1, message: '该分类下有账单，不能删除' }
    }

    // 删除分类
    await db.collection('categories').doc(categoryId).remove()

    return {
      code: 0,
      message: 'success',
    }
  } catch (error) {
    console.error('删除分类失败:', error)
    return { code: 1, message: error.message || '删除失败' }
  }
}
