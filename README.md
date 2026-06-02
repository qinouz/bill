# 家庭记账微信小程序 - UniApp版本

## 项目简介

基于 UniApp 框架的家庭记账微信小程序，支持账单记录、分类管理、数据统计、语音记账、拍照记账等功能。

## 技术栈

- **前端框架**：UniApp + Vue 3
- **UI 库**：UniApp UI
- **状态管理**：Pinia
- **构建工具**：Vite
- **后端**：微信云开发（云函数 + 云数据库）
- **编程语言**：TypeScript
- **AI 能力**：MiMo API（语音识别、图像识别）

## 项目结构

```
bill/
├── src/                          # 源代码目录
│   ├── pages/                    # 页面组件
│   │   ├── index/               # 明细页（支持月份筛选）
│   │   ├── bills/               # 记账页
│   │   ├── statistic/           # 统计页
│   │   ├── mine/                # 我的页面
│   │   ├── voice-bill/          # 语音记账页
│   │   ├── photo-bill/          # 拍照记账页
│   │   ├── bill-detail/         # 账单详情页
│   │   └── category-manage/     # 分类管理页
│   ├── components/              # 公共组件
│   │   └── custom-tabbar/       # 自定义底部导航栏
│   ├── api/                     # API 接口
│   │   ├── bill.ts              # 账单相关接口
│   │   ├── category.ts          # 分类相关接口
│   │   ├── user.ts              # 用户相关接口
│   │   ├── voice.ts             # 语音识别接口
│   │   └── photo.ts             # 拍照识别接口
│   ├── store/                   # 状态管理（Pinia）
│   │   ├── user.ts              # 用户 Store
│   │   └── bill.ts              # 账单 Store
│   ├── composables/             # 组合式函数
│   │   └── useVoiceRecord.ts    # 语音录制
│   ├── utils/                   # 工具函数
│   │   ├── cloud.ts             # 云函数调用封装
│   │   ├── date.ts              # 日期工具
│   │   └── format.ts            # 格式化工具
│   ├── static/                  # 静态资源
│   ├── App.vue                  # 应用根组件
│   ├── main.ts                  # 应用入口
│   ├── pages.json               # 页面路由配置
│   └── manifest.json            # 小程序配置
├── cloudfunctions/              # 云函数目录
│   ├── login/                   # 登录函数
│   ├── addBill/                 # 新增账单（支持批量）
│   ├── editBill/                # 编辑账单
│   ├── deleteBill/              # 删除账单
│   ├── getBillList/             # 获取账单列表（支持月份筛选）
│   ├── getBillDetail/           # 获取账单详情
│   ├── getBillStatistic/        # 获取统计数据
│   ├── categoryList/            # 获取分类列表
│   ├── categorySave/            # 保存分类
│   ├── initCategories/          # 初始化默认分类
│   ├── getUserStats/            # 获取用户统计
│   ├── photoRecognize/          # 拍照识别（MiMo API）
│   ├── audioRecognize/          # 语音识别（MiMo API）
│   └── parseVoice/              # 文本解析（本地 NLP）
├── package.json                 # 项目依赖配置
├── vite.config.ts              # Vite 配置
└── tsconfig.json               # TypeScript 配置
```

## 功能模块

### 1. 明细页 (Index)
- 展示本月收入、支出汇总
- 按日期分组展示账单
- **支持月份筛选**（上月/下月切换）
- 支持下拉刷新、分页加载
- 可查看账单详情、删除账单

### 2. 记账页 (Bills)
- 支持支出和收入两种记账类型
- 数字键盘输入金额
- 分类选择（4列网格布局）
- 日期选择
- 备注输入
- **语音记账入口**（跳转语音记账页）
- **拍照记账入口**（跳转拍照记账页）

### 3. 语音记账 (Voice Bill)
- **长按录音**，松开结束
- MiMo API 实时语音识别
- 自动提取金额、分类、日期、备注
- 识别结果列表展示
- 支持手动编辑修正
- **批量保存**到数据库

### 4. 拍照记账 (Photo Bill)
- **拍照或从相册选择**小票/账单截图
- MiMo API 图像识别
- 自动提取多条账单信息
- 识别结果列表展示
- 支持手动编辑修正
- **批量保存**到数据库

### 5. 统计页 (Statistic)
- 年度收入、支出、结余统计
- 按月份统计数据展示
- 支持年份切换查询

### 6. 我的页面 (Mine)
- 显示用户信息（头像、昵称）
- 连续打卡天数
- 总记账天数
- 总记账笔数
- 分类管理菜单
- 关于应用菜单
- 登录/退出登录

## 安装与运行

### 前置要求
- Node.js >= 14
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发服务
```bash
npm run dev
```

### 构建微信小程序
```bash
npm run mp-weixin
```

## 数据库设计

### users 表
```json
{
  "_id": "用户ID",
  "openid": "微信openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "createTime": "创建时间"
}
```

### categories 表
```json
{
  "_id": "分类ID",
  "userId": "用户ID",
  "name": "分类名称",
  "icon": "图标",
  "type": "income|expense",
  "sort": "排序",
  "isDefault": "是否默认",
  "createTime": "创建时间"
}
```

### bills 表
```json
{
  "_id": "账单ID",
  "userId": "用户ID",
  "categoryId": "分类ID",
  "amount": "金额",
  "type": "income|expense",
  "remark": "备注",
  "billDate": "账单日期",
  "createTime": "创建时间",
  "updateTime": "更新时间",
  "isDeleted": "是否删除"
}
```

## 云函数说明

### 用户相关
- **login**: 用户登录，获取 openid，自动创建用户记录

### 账单相关
- **addBill**: 新增账单（支持单条和批量）
- **editBill**: 编辑账单
- **deleteBill**: 删除账单（软删除）
- **getBillList**: 分页获取账单列表（支持月份筛选）
- **getBillDetail**: 获取账单详情
- **getBillStatistic**: 获取年度统计数据

### 分类相关
- **categoryList**: 获取用户分类列表
- **categorySave**: 新增或保存分类
- **initCategories**: 初始化默认分类（29个）

### AI 识别相关
- **photoRecognize**: 拍照识别（调用 MiMo API）
- **audioRecognize**: 语音识别（调用 MiMo API）
- **parseVoice**: 文本解析（本地 NLP，关键词匹配）

### 用户统计
- **getUserStats**: 获取用户统计数据（记账天数、连续打卡等）

## 环境配置

### 1. 微信小程序 AppID

在 `src/manifest.json` 中配置：

```json
{
  "mp-weixin": {
    "appid": "你的AppID"
  }
}
```

### 2. MiMo API 密钥

用于语音识别和拍照识别功能。获取地址：https://cloud.siliconflow.cn/account/ak

在微信云开发控制台配置环境变量：
- 云函数 → `photoRecognize` → 编辑 → 环境变量
- 添加 `MIMO_API_KEY` = 你的密钥

需要配置的云函数：
- photoRecognize
- audioRecognize

### 3. 云开发环境

在 `App.vue` 中配置云开发环境 ID：

```javascript
uni.cloud.init({
  env: '你的云开发环境ID',
  traceUser: true,
})
```

## 已完成功能

- ✅ 基础记账功能（收入/支出）
- ✅ 分类管理（默认29个分类）
- ✅ 明细展示（按月份筛选）
- ✅ 年度统计
- ✅ 语音记账（MiMo API）
- ✅ 拍照记账（MiMo API）
- ✅ 自定义底部导航栏
- ✅ 用户登录与缓存
- ✅ 服务端身份验证（安全）

## 常见问题

### 1. 如何配置云开发环境？
在微信开发者工具中：
1. 创建或关联云开发环境
2. 将 cloudfunctions 目录中的函数上传部署
3. 配置数据库集合（users、categories、bills）

### 2. 如何修改微信小程序 AppID？
编辑 `src/manifest.json`，在 `mp-weixin.appid` 字段中修改为你的 AppID

### 3. 如何添加新的分类？
使用 `categorySave` 云函数，传入分类信息即可

### 4. 语音/拍照识别不工作？
1. 检查是否配置了 `MIMO_API_KEY` 环境变量
2. 确认云函数已上传到生产环境
3. 查看云函数日志排查错误

### 5. 手机预览看不到数据？
1. 确认云函数已部署到生产环境（不是开发环境）
2. 检查明细页面的月份筛选是否正确
3. 下拉刷新页面

## 开发建议

1. 使用 TypeScript 进行类型安全开发
2. 在 API 层处理所有网络请求
3. 使用 Pinia Store 统一管理应用状态
4. 遵循 Vue 3 Composition API 风格
5. 云函数使用服务端身份验证（不要信任前端传入的 userId）

## 许可证

MIT
