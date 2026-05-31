const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 从环境变量读取配置
const MIMO_API_KEY = process.env.MIMO_API_KEY

// 调用 MiMo 解析图片中的账单信息
async function parseWithMiMo(imageUrl) {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekStr = '星期' + weekDays[today.getDay()]

  const systemPrompt = `你是MiMo，是小米公司研发的AI智能助手。今天的日期：${dateStr} ${weekStr}，你的知识截止日期是2024年12月。`

  const userPrompt = `你是一个记账助手，请从这张图片中提取所有账单信息。

图片可能是：
1. 购物小票/发票
2. 订单截图
3. 账单页面截图
4. 手写的记账笔记

请提取所有可见的账单信息，返回一个 JSON 数组，每个元素代表一条账单：
[
  {
    "amount": 数字金额（如 35.5），如果没有识别到金额则为 null,
    "type": "expense" 或 "income"，默认为 "expense",
    "category": 分类名称，从以下选项中选择最合适的一个：
      支出分类：餐饮、购物、日用、交通、蔬菜、水果、零食、运动、娱乐、通讯、服饰、美容、住房、居家、孩子、长辈、社交、旅行、烟酒、数码、汽车、医疗、书籍、学习
      收入分类：工资、兼职、理财、礼金、其它
    如果无法匹配则返回 null,
    "date": 日期，格式为 YYYY-MM-DD，如果图片中有日期则使用，否则默认为今天,
    "remark": 备注信息，提取商品名称或其他有用信息
  }
]

注意：
1. 只返回 JSON 数组，不要有其他文字
2. 金额必须是数字，不能是字符串
3. 如果是购物小票，每种商品算一条记录
4. 如果无法确定分类，category 设为 null`

  try {
    console.log('开始调用 MiMo API...')
    const startTime = Date.now()
    const response = await axios.post(
      'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
      {
        model: 'mimo-v2.5',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
        max_completion_tokens: 3048,
        temperature: 0.1,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': MIMO_API_KEY,
        },
        timeout: 60000,
      }
    )

    const content = response.data.choices?.[0]?.message?.content || ''
    const duration = Date.now() - startTime
    console.log(`MiMo API 调用完成，耗时: ${duration}ms`)
    console.log('MiMo 完整响应:', JSON.stringify(response.data))
    console.log('MiMo 返回内容:', content)

    // 提取 JSON（可能是数组或对象）
    const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('无法提取 JSON, 原始内容:', content)
      throw new Error('MiMo 返回格式错误')
    }

    console.log('提取到的 JSON:', jsonMatch[0])

    const parsed = JSON.parse(jsonMatch[0])
    // 统一返回数组格式
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (err) {
    console.error('MiMo 调用失败:', err)
    throw new Error('图片解析失败: ' + (err.message || '未知错误'))
  }
}

// 获取北京时间日期字符串 (YYYY-MM-DD)
function getBeijingDateStr() {
  const now = new Date()
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return beijing.toISOString().split('T')[0]
}

// 批量查询所有分类（缓存复用）
async function getAllCategories(openid) {
  const db = cloud.database()
  try {
    const res = await db.collection('categories')
      .where({ userId: openid })
      .get()
    return res.data || []
  } catch (err) {
    console.error('查询分类失败:', err)
    return []
  }
}

// 从缓存的分类列表中查找匹配
function findCategoryId(categories, categoryName, type) {
  if (!categoryName) return null

  const filtered = categories.filter(c => c.type === type)

  // 精确匹配
  const exact = filtered.find(c => c.name === categoryName)
  if (exact) return exact._id

  // 模糊匹配
  const fuzzy = filtered.find(c => c.name.includes(categoryName) || categoryName.includes(c.name))
  return fuzzy ? fuzzy._id : null
}

// 计算置信度
function calculateConfidence(amount, categoryId) {
  if (amount && categoryId) return 'high'
  if (amount || categoryId) return 'medium'
  return 'low'
}

exports.main = async (event, context) => {
  const { fileID } = event

  if (!fileID) {
    return { code: 1, message: '参数不完整' }
  }

  // 获取真实用户身份
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: 1, message: '未登录' }
  }

  try {
    // 1. 获取图片临时URL
    const urlRes = await cloud.getTempFileURL({
      fileList: [fileID],
    })
    const imageUrl = urlRes.fileList[0].tempFileURL

    console.log('图片 URL:', imageUrl)

    // 2. 调用 MiMo 解析图片（返回数组）
    const parsedItems = await parseWithMiMo(imageUrl)
    console.log('MiMo 解析结果:', JSON.stringify(parsedItems))

    // 3. 批量查询分类（只查一次数据库）
    const allCategories = await getAllCategories(openid)

    // 4. 处理每一条记录
    const items = []
    for (const parsed of parsedItems) {
      const type = parsed.type || 'expense'
      const categoryId = findCategoryId(allCategories, parsed.category, type)
      const confidence = calculateConfidence(parsed.amount, categoryId)

      let billDate = parsed.date
      if (!billDate) {
        billDate = getBeijingDateStr()
      }

      items.push({
        amount: parsed.amount,
        categoryId,
        categoryName: parsed.category,
        type,
        remark: parsed.remark || '',
        billDate,
        confidence,
      })
    }

    return {
      code: 0,
      data: {
        items,
      },
      message: 'success',
    }
  } catch (error) {
    console.error('图片识别流程失败:', error)
    return { code: 1, message: error.message || '识别失败，请重试' }
  }
}
