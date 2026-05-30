const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const defaultCategories = [
  { name: '餐饮', icon: '🍜', type: 'expense', sort: 1 },
  { name: '购物', icon: '🛒', type: 'expense', sort: 2 },
  { name: '日用', icon: '🏠', type: 'expense', sort: 3 },
  { name: '交通', icon: '🚗', type: 'expense', sort: 4 },
  { name: '蔬菜', icon: '🥬', type: 'expense', sort: 5 },
  { name: '水果', icon: '🍎', type: 'expense', sort: 6 },
  { name: '零食', icon: '🍪', type: 'expense', sort: 7 },
  { name: '运动', icon: '⚽', type: 'expense', sort: 8 },
  { name: '娱乐', icon: '🎮', type: 'expense', sort: 9 },
  { name: '通讯', icon: '📱', type: 'expense', sort: 10 },
  { name: '服饰', icon: '👔', type: 'expense', sort: 11 },
  { name: '美容', icon: '💄', type: 'expense', sort: 12 },
  { name: '住房', icon: '🏡', type: 'expense', sort: 13 },
  { name: '居家', icon: '🛋️', type: 'expense', sort: 14 },
  { name: '孩子', icon: '👶', type: 'expense', sort: 15 },
  { name: '长辈', icon: '👴', type: 'expense', sort: 16 },
  { name: '社交', icon: '🤝', type: 'expense', sort: 17 },
  { name: '旅行', icon: '✈️', type: 'expense', sort: 18 },
  { name: '烟酒', icon: '🚬', type: 'expense', sort: 19 },
  { name: '数码', icon: '💻', type: 'expense', sort: 20 },
  { name: '汽车', icon: '🚙', type: 'expense', sort: 21 },
  { name: '医疗', icon: '💊', type: 'expense', sort: 22 },
  { name: '书籍', icon: '📚', type: 'expense', sort: 23 },
  { name: '学习', icon: '📖', type: 'expense', sort: 24 },
  { name: '工资', icon: '💰', type: 'income', sort: 1 },
  { name: '兼职', icon: '💼', type: 'income', sort: 2 },
  { name: '理财', icon: '📈', type: 'income', sort: 3 },
  { name: '礼金', icon: '🧧', type: 'income', sort: 4 },
  { name: '其它', icon: '💵', type: 'income', sort: 5 },
]

exports.main = async (event, context) => {
  const { userId } = event

  try {
    // 检查是否已有分类
    const existing = await db.collection('categories').where({ userId }).count()
    if (existing.total > 0) {
      return { code: 0, data: null, message: '分类已存在' }
    }

    // 批量添加默认分类
    const tasks = defaultCategories.map((cat) =>
      db.collection('categories').add({
        data: {
          userId,
          name: cat.name,
          icon: cat.icon,
          type: cat.type,
          sort: cat.sort,
          isDefault: true,
          createTime: new Date(),
        },
      })
    )

    await Promise.all(tasks)

    return { code: 0, data: null, message: 'success' }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
