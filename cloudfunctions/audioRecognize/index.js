const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 从环境变量读取配置
const MIMO_API_KEY = process.env.MIMO_API_KEY

// 调用 MiMo 理解音频并提取账单信息
async function parseAudioWithMiMo(audioUrl) {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekStr = '星期' + weekDays[today.getDay()]

  const systemPrompt = `你是MiMo，是小米公司研发的AI智能助手。今天的日期：${dateStr} ${weekStr}，你的知识截止日期是2024年12月。`

  const userPrompt = `你是一个记账助手，请听这段语音，先转写文字，再从中提取所有账单信息。

请返回一个 JSON 对象，格式如下：
{
  "text": "语音转写的文字内容",
  "items": [
    {
      "amount": 数字金额（如 35.5），如果没有识别到金额则为 null,
      "type": "expense" 或 "income"，默认为 "expense",
      "category": 分类名称，从以下选项中选择最合适的一个：
        支出分类：餐饮、购物、日用、交通、蔬菜、水果、零食、运动、娱乐、通讯、服饰、美容、住房、居家、孩子、长辈、社交、旅行、烟酒、数码、汽车、医疗、书籍、学习
        收入分类：工资、兼职、理财、礼金、其它
      如果无法匹配则返回 null,
      "date": 日期，格式为 YYYY-MM-DD，支持"今天"、"昨天"、"前天"、"X号"、"X月X号"等表述，默认为今天,
      "remark": 备注信息，提取除金额、分类、日期外的其他有用信息
    }
  ]
}

注意：
1. 只返回 JSON，不要有其他文字
2. 金额必须是数字，不能是字符串
3. 如果用户说的是收入（如"收到工资5000"），type 设为 "income"
4. 如果无法确定分类，category 设为 null
5. text 字段是语音的原始文字转写
6. 如果语音中没有识别到账单内容，或者语音不清晰，请返回空数组：{"text": "", "items": []}
7. 不要编造内容，只提取语音中实际提到的信息`

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
                type: 'input_audio',
                input_audio: {
                  data: audioUrl,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
        max_completion_tokens: 8192,
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
    console.log('MiMo 返回内容:', content)

    // 提取 JSON 对象
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('无法提取 JSON, 原始内容:', content)
      throw new Error('MiMo 返回格式错误')
    }

    console.log('提取到的 JSON:', jsonMatch[0])

    const parsed = JSON.parse(jsonMatch[0])
    // 返回 { text, items } 格式
    return {
      text: parsed.text || '',
      items: Array.isArray(parsed.items) ? parsed.items : (parsed.items ? [parsed.items] : [])
    }
  } catch (err) {
    console.error('MiMo 调用失败:', err)
    throw new Error('语音解析失败: ' + (err.message || '未知错误'))
  }
}

// 查询分类 ID
async function getCategoryId(userId, categoryName, type) {
  if (!categoryName) return null

  const db = cloud.database()
  try {
    const catRes = await db.collection('categories')
      .where({
        userId,
        name: categoryName,
        type,
      })
      .get()

    if (catRes.data.length > 0) {
      return catRes.data[0]._id
    }

    // 如果找不到精确匹配，尝试模糊匹配
    const fuzzyRes = await db.collection('categories')
      .where({
        userId,
        type,
      })
      .get()

    const matched = fuzzyRes.data.find(c => c.name.includes(categoryName) || categoryName.includes(c.name))
    return matched ? matched._id : null
  } catch (err) {
    console.error('查询分类失败:', err)
    return null
  }
}

// 计算置信度
function calculateConfidence(amount, categoryId) {
  if (amount && categoryId) return 'high'
  if (amount || categoryId) return 'medium'
  return 'low'
}

exports.main = async (event, context) => {
  const { fileID, userId } = event

  if (!fileID || !userId) {
    return { code: 1, message: '参数不完整' }
  }

  try {
    // 1. 获取音频临时 URL
    const urlRes = await cloud.getTempFileURL({
      fileList: [fileID],
    })
    const audioUrl = urlRes.fileList[0].tempFileURL

    console.log('音频 URL:', audioUrl)

    // 2. 调用 MiMo 理解音频（直接传 URL）
    const result = await parseAudioWithMiMo(audioUrl)
    const recognizedText = result.text
    const parsedItems = result.items

    console.log('MiMo 解析结果:', JSON.stringify(result))

    // 3. 处理每一条记录
    const items = []
    for (const parsed of parsedItems) {
      const type = parsed.type || 'expense'
      const categoryId = await getCategoryId(userId, parsed.category, type)
      const confidence = calculateConfidence(parsed.amount, categoryId)

      let billDate = parsed.date
      if (!billDate) {
        billDate = new Date().toISOString().split('T')[0]
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
        recognizedText,
        items,
      },
      message: 'success',
    }
  } catch (error) {
    console.error('音频识别流程失败:', error)
    return { code: 1, message: error.message || '识别失败，请重试' }
  }
}
