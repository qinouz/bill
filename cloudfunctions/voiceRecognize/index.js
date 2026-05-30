const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 腾讯云 ASR 客户端
const AsrClient = tencentcloud.asr.v20190614.Client

// 从环境变量读取配置
const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY
const MIMO_API_KEY = process.env.MIMO_API_KEY

// 创建 ASR 客户端
function createAsrClient() {
  const clientConfig = {
    credential: {
      secretId: TENCENT_SECRET_ID,
      secretKey: TENCENT_SECRET_KEY,
    },
    region: 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'asr.tencentcloudapi.com',
      },
    },
  }
  return new AsrClient(clientConfig)
}

// 调用腾讯云 ASR 语音识别
async function recognizeSpeech(audioBase64) {
  const client = createAsrClient()

  const params = {
    ProjectId: 0,
    SubServiceType: 2,
    EngSerViceType: '16k_zh',
    SourceType: 1,
    VoiceFormat: 'mp3',
    Data: audioBase64,
    DataLen: Math.ceil(audioBase64.length * 3 / 4), // base64 解码后的大致长度
  }

  try {
    const result = await client.SentenceRecognition(params)
    return result.Result || ''
  } catch (err) {
    console.error('ASR 调用失败:', err)
    throw new Error('语音识别失败: ' + (err.message || '未知错误'))
  }
}

// 调用 MiMo 解析账单信息
async function parseWithMiMo(text) {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekStr = '星期' + weekDays[today.getDay()]

  const prompt = `你是一个记账助手，请从用户的话语中提取记账信息。

用户说："${text}"

用户可能说了多条账单，请逐条提取。返回一个 JSON 数组，每个元素代表一条账单：
[
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

注意：
1. 只返回 JSON 数组，不要有其他文字
2. 金额必须是数字，不能是字符串
3. 如果用户说的是收入（如"收到工资5000"），type 设为 "income"
4. 如果无法确定分类，category 设为 null
5. 如果只有一条账单，也返回数组（只有一个元素）`

  try {
    const response = await axios.post(
      'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
      {
        model: 'mimo-v2.5-pro',
        messages: [
          {
            role: 'system',
            content: `你是MiMo，是小米公司研发的AI智能助手。今天的日期：${dateStr} ${weekStr}，你的知识截止日期是2024年12月。`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_completion_tokens: 1024,
        temperature: 0.1,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': MIMO_API_KEY,
        },
      }
    )

    const content = response.data.choices?.[0]?.message?.content || ''

    // 提取 JSON（可能是数组或对象）
    const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('MiMo 返回格式错误')
    }

    const parsed = JSON.parse(jsonMatch[0])
    // 统一返回数组格式
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (err) {
    console.error('MiMo 调用失败:', err)
    throw new Error('语义解析失败: ' + (err.message || '未知错误'))
  }
}

// 批量查询用户全部分类，在内存中匹配（消除 N+1 查询）
async function loadUserCategories(userId) {
  const db = cloud.database()
  try {
    const { data } = await db.collection('categories').where({ userId }).get()
    return data || []
  } catch (err) {
    console.error('加载分类失败:', err)
    return []
  }
}

function findCategoryId(categories, categoryName, type) {
  if (!categoryName) return null

  const exact = categories.find(c => c.type === type && c.name === categoryName)
  if (exact) return exact._id

  const fuzzy = categories.find(
    c => c.type === type && (c.name.includes(categoryName) || categoryName.includes(c.name))
  )
  return fuzzy ? fuzzy._id : null
}

// 计算置信度
function calculateConfidence(amount, categoryId, parsed) {
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
    // 1. 并行：下载语音 + ASR 识别 与 预加载用户分类（消除串行等待）
    const [recognizedText, userCategories] = await Promise.all([
      (async () => {
        const fileRes = await cloud.downloadFile({ fileID })
        const audioBase64 = fileRes.fileContent.toString('base64')
        return recognizeSpeech(audioBase64)
      })(),
      loadUserCategories(userId),
    ])

    if (!recognizedText || recognizedText.trim() === '') {
      return {
        code: 0,
        data: {
          recognizedText: '',
          items: [],
        },
        message: '未识别到语音内容',
      }
    }

    // 2. 调用 MiMo 解析语义（返回数组）
    const parsedItems = await parseWithMiMo(recognizedText)

    // 6. 处理每一条记录（内存中匹配分类，无数据库查询）
    const items = []
    for (const parsed of parsedItems) {
      const type = parsed.type || 'expense'
      const categoryId = findCategoryId(userCategories, parsed.category, type)
      const confidence = calculateConfidence(parsed.amount, categoryId, parsed)

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
    console.error('语音识别流程失败:', error)
    return { code: 1, message: error.message || '识别失败，请重试' }
  }
}
