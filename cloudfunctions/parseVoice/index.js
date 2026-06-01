const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 根据 openid 查询用户 _id
async function getUserIdByOpenid(openid) {
  try {
    const userRes = await db.collection('users').where({ openid }).get()
    return userRes.data.length > 0 ? userRes.data[0]._id : null
  } catch (err) {
    console.error('查询用户失败:', err)
    return null
  }
}

// 分类关键词映射
const categoryKeywords = {
  '餐饮': ['吃饭', '午饭', '晚饭', '早饭', '餐', '饭', '外卖', '快餐', '火锅', '烧烤', '小吃', '食堂', '美团', '饿了么', '下馆子', '聚餐', '请客', '点餐', '叫外卖', '早餐', '午餐', '晚餐', '夜宵'],
  '购物': ['买', '购买', '网购', '淘宝', '京东', '拼多多', '超市', '商场', '逛街', '扫货'],
  '日用': ['日用', '日用品', '洗衣液', '纸巾', '牙膏', '洗发水', '肥皂', '垃圾袋'],
  '交通': ['打车', '出租', '地铁', '公交', '滴滴', '高铁', '火车', '飞机', '机票', '车票', '油费', '加油', '停车', '过路费', '骑车', '共享单车', '顺风车'],
  '蔬菜': ['蔬菜', '买菜', '青菜', '白菜', '土豆', '西红柿', '黄瓜', '萝卜', '芹菜', '菠菜'],
  '水果': ['水果', '苹果', '香蕉', '橘子', '橙子', '葡萄', '西瓜', '草莓', '芒果', '樱桃', '桃子', '梨'],
  '零食': ['零食', '薯片', '饼干', '巧克力', '糖果', '瓜子', '花生', '坚果', '奶茶', '咖啡', '饮料', '可乐', '果汁', '汽水'],
  '运动': ['健身', '运动', '游泳', '跑步', '球', '瑜伽', '羽毛球', '篮球', '足球', '乒乓球', '网球', '高尔夫'],
  '娱乐': ['电影', '游戏', 'KTV', '唱歌', '旅游', '景点', '门票', '演出', '话剧', '音乐会', '演唱会'],
  '通讯': ['话费', '流量', '网费', '宽带', '充值', '手机费', '电话费'],
  '服饰': ['衣服', '裤子', '鞋', '帽子', '围巾', '外套', 'T恤', '裙子', '内衣', '袜子', '西装', '牛仔'],
  '美容': ['美容', '化妆', '护肤', '面膜', '口红', '理发', '染发', '美甲', '洗面奶'],
  '住房': ['房租', '租金', '房贷', '物业', '水费', '电费', '燃气', '暖气', '取暖'],
  '居家': ['家具', '家电', '装修', '窗帘', '床单', '被子', '枕头', '灯', '沙发', '桌子'],
  '孩子': ['孩子', '宝宝', '奶粉', '尿不湿', '玩具', '学费', '辅导班', '幼儿园', '小学', '中学'],
  '长辈': ['长辈', '父母', '孝敬', '养老', '红包'],
  '社交': ['份子钱', '随礼', '送礼', '请客', '聚会', '人情'],
  '旅行': ['旅行', '酒店', '住宿', '民宿', '景区', '导游', '签证', '机票'],
  '烟酒': ['烟', '酒', '香烟', '啤酒', '白酒', '红酒', '洋酒', '烟草'],
  '数码': ['手机', '电脑', '平板', '耳机', '充电器', '数据线', '数码', '相机'],
  '汽车': ['汽车', '保养', '维修', '保险', '洗车', '违章', '年检', '车险'],
  '医疗': ['看病', '医院', '药', '挂号', '体检', '牙科', '眼科', '手术', '住院', '药店'],
  '书籍': ['书', '书籍', '杂志', '教材', '参考书', '小说'],
  '学习': ['课程', '培训', '网课', '考试', '报名费', '学费', '辅导'],
  '工资': ['工资', '薪水', '月薪', '底薪', '绩效', '奖金', '年终奖', '提成', '发工资'],
  '兼职': ['兼职', '副业', '外快', '接单', '跑腿'],
  '理财': ['理财', '利息', '分红', '收益', '基金', '股票', '定期', '余额宝'],
  '礼金': ['礼金', '红包', '压岁钱', '份子钱'],
  '其它': ['其它', '其他', '杂项', ' miscellaneous']
}

// 收入关键词
const incomeKeywords = ['收到', '赚了', '收入', '进账', '到账', '回款', '报销', '发工资', '奖金', '分红', '利息']

// 中文数字映射
const chineseNumbers = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '百': 100, '千': 1000, '万': 10000
}

// 中文数字转阿拉伯数字
function chineseToNumber(text) {
  if (!text) return null

  // 直接是阿拉伯数字
  const directNum = parseFloat(text)
  if (!isNaN(directNum)) return directNum

  let result = 0
  let current = 0
  let temp = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const num = chineseNumbers[char]

    if (num === undefined) continue

    if (num === 10000) {
      temp = (temp || 1) * num
      result += temp
      temp = 0
      current = 0
    } else if (num === 1000 || num === 100) {
      current = (current || 1) * num
      temp += current
      current = 0
    } else if (num === 10) {
      if (current === 0) current = 1
      current *= num
    } else {
      current = num
    }
  }

  result += temp + current
  return result || null
}

// 提取金额
function extractAmount(text) {
  // 优先匹配带单位的数字
  const patterns = [
    /(\d+\.?\d*)\s*[块元圆]/,
    /(\d+\.?\d*)\s*毛/,
    /[花了费了用了付了扣了收了赚了]*\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let amount = parseFloat(match[1])
      // 如果匹配到"毛"，除以10
      if (pattern.toString().includes('毛')) {
        amount = amount / 10
      }
      if (amount > 0) return amount
    }
  }

  // 尝试匹配中文数字
  const chinesePattern = /[花了费了用了付了扣了收了赚了]*\s*([零一二两三四五六七八九十百千万]+)[块元圆]?/
  const chineseMatch = text.match(chinesePattern)
  if (chineseMatch) {
    const amount = chineseToNumber(chineseMatch[1])
    if (amount && amount > 0) return amount
  }

  return null
}

// 匹配分类
function matchCategory(text) {
  let bestMatch = null
  let bestLength = 0

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword) && keyword.length > bestLength) {
        bestMatch = category
        bestLength = keyword.length
      }
    }
  }

  return bestMatch
}

// 判断收支类型
function inferType(text, categoryName) {
  // 如果匹配到收入分类，直接返回收入
  const incomeCategories = ['工资', '兼职', '理财', '礼金', '其它']
  if (incomeCategories.includes(categoryName)) {
    return 'income'
  }

  // 检查收入关键词
  for (const keyword of incomeKeywords) {
    if (text.includes(keyword)) return 'income'
  }

  return 'expense'
}

// 解析日期
function parseDate(text) {
  const today = new Date()
  const formatDate = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (/今天|今日/.test(text)) return formatDate(today)

  if (/昨天|昨日/.test(text)) {
    const d = new Date(today)
    d.setDate(d.getDate() - 1)
    return formatDate(d)
  }

  if (/前天/.test(text)) {
    const d = new Date(today)
    d.setDate(d.getDate() - 2)
    return formatDate(d)
  }

  if (/大前天/.test(text)) {
    const d = new Date(today)
    d.setDate(d.getDate() - 3)
    return formatDate(d)
  }

  // 匹配"X号"或"X日"
  const dayMatch = text.match(/(\d{1,2})[号日]/)
  if (dayMatch) {
    const day = parseInt(dayMatch[1])
    if (day >= 1 && day <= 31) {
      const d = new Date(today)
      d.setDate(day)
      if (d > today) d.setMonth(d.getMonth() - 1)
      return formatDate(d)
    }
  }

  // 匹配"X月X号"或"X月X日"
  const monthDayMatch = text.match(/(\d{1,2})[月](\d{1,2})[号日]?/)
  if (monthDayMatch) {
    const month = parseInt(monthDayMatch[1]) - 1
    const day = parseInt(monthDayMatch[2])
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const d = new Date(today.getFullYear(), month, day)
      return formatDate(d)
    }
  }

  // 默认今天
  return formatDate(today)
}

// 提取备注
function extractRemark(text, amount, categoryName, dateStr) {
  let remark = text

  // 移除金额相关文本
  if (amount) {
    remark = remark.replace(/\d+\.?\d*\s*[块元圆角毛]/g, '')
    remark = remark.replace(/[花了费了用了付了扣了收了赚了]\s*\d+\.?\d*/g, '')
  }

  // 移除分类关键词
  if (categoryName) {
    const keywords = categoryKeywords[categoryName] || []
    for (const keyword of keywords) {
      remark = remark.replace(new RegExp(keyword, 'g'), '')
    }
  }

  // 移除日期关键词
  remark = remark.replace(/今天|今日|昨天|昨日|前天|大前天/g, '')
  remark = remark.replace(/\d{1,2}[月]\d{1,2}[号日]?/g, '')
  remark = remark.replace(/\d{1,2}[号日]/g, '')

  // 移除收入/支出关键词
  remark = remark.replace(/收到|赚了|收入|进账|到账|回款|报销|花了|消费|支出|买了|付了|充值|缴费|还了/g, '')

  // 清理多余空格和标点
  remark = remark.replace(/[,，。.、\s]+/g, ' ').trim()

  return remark || ''
}

exports.main = async (event, context) => {
  const { text } = event

  if (!text) {
    return { code: 1, message: '参数不完整' }
  }

  // 从服务端获取用户身份（不可伪造）
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: 1, message: '未登录' }
  }

  // 查询用户 ID
  const userId = await getUserIdByOpenid(openid)
  if (!userId) {
    return { code: 1, message: '用户不存在' }
  }

  try {
    // 1. 提取金额
    const amount = extractAmount(text)

    // 2. 匹配分类
    const categoryName = matchCategory(text)

    // 3. 查询分类ID
    let categoryId = null
    if (categoryName) {
      const catRes = await db.collection('categories')
        .where({ userId, name: categoryName })
        .get()
      if (catRes.data.length > 0) {
        categoryId = catRes.data[0]._id
      }
    }

    // 4. 推断收支类型
    const type = inferType(text, categoryName)

    // 5. 解析日期
    const billDate = parseDate(text)

    // 6. 提取备注
    const remark = extractRemark(text, amount, categoryName, billDate)

    // 7. 计算置信度
    let confidence = 'low'
    if (amount && categoryId) {
      confidence = 'high'
    } else if (amount || categoryId) {
      confidence = 'medium'
    }

    return {
      code: 0,
      data: {
        amount,
        categoryId,
        categoryName,
        type,
        remark,
        billDate,
        confidence
      },
      message: 'success'
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
