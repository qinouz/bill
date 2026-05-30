# 家庭记账微信小程序 - UniApp版本

## 项目简介

基于 UniApp 框架的家庭记账微信小程序，支持账单记录、分类管理、数据统计等功能。

## 技术栈

- **前端框架**：UniApp + Vue 3
- **UI 库**：UniApp UI
- **状态管理**：Pinia
- **构建工具**：Vite
- **后端**：微信云开发（云函数 + 云数据库）
- **编程语言**：TypeScript

## 项目结构

```
bill/
├── src/                          # 源代码目录
│   ├── pages/                    # 页面组件
│   │   ├── index/               # 明细页
│   │   ├── bills/               # 记账页
│   │   ├── statistic/           # 统计页
│   │   └── mine/                # 我的页面
│   ├── components/              # 公共组件
│   ├── api/                     # API 接口
│   │   ├── request.ts           # 请求配置
│   │   ├── user.ts              # 用户相关接口
│   │   └── bill.ts              # 账单相关接口
│   ├── store/                   # 状态管理（Pinia）
│   │   ├── user.ts              # 用户 Store
│   │   └── bill.ts              # 账单 Store
│   ├── utils/                   # 工具函数
│   │   └── date.ts              # 日期工具
│   ├── static/                  # 静态资源
│   ├── App.vue                  # 应用根组件
│   ├── main.ts                  # 应用入口
│   ├── pages.json               # 页面路由配置
│   └── manifest.json            # 小程序配置
├── cloudfunctions/              # 云函数目录
│   ├── login/                   # 登录函数
│   ├── addBill/                 # 新增账单
│   ├── getBillList/             # 获取账单列表
│   ├── getBillStatistic/        # 获取统计数据
│   ├── categoryList/            # 获取分类列表
│   └── categorySave/            # 保存分类
├── package.json                 # 项目依赖配置
├── vite.config.ts              # Vite 配置
└── tsconfig.json               # TypeScript 配置
```

## 功能模块

### 1. 明细页 (Index)
- 展示本月收入、支出汇总
- 按日期分组展示账单
- 支持下拉刷新、分页加载
- 可查看账单详情

### 2. 记账页 (Bills)
- 支持支出和收入两种记账类型
- 数字键盘输入金额
- 分类选择
- 备注输入
- 保存账单

### 3. 统计页 (Statistic)
- 年度收入、支出、结余统计
- 按月份统计数据展示
- 支持年份切换查询

### 4. 我的页面 (Mine)
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

- **login**: 用户登录，获取 openid
- **addBill**: 新增账单
- **getBillList**: 分页获取账单列表
- **getBillStatistic**: 获取统计数据
- **categoryList**: 获取分类列表
- **categorySave**: 新增或保存分类

## 环境配置

在 `src/manifest.json` 中配置微信小程序 AppID：

```json
{
  "mp-weixin": {
    "appid": "你的AppID"
  }
}
```

## 二期规划

- AI 自然语言记账
- DeepSeek 分类识别
- 语音记账
- OCR 小票识别
- 家庭共享账本

## 常见问题

### 1. 如何配置云开发环境？
在微信开发者工具中：
1. 创建或关联云开发环境
2. 将 cloudfunctions 目录中的函数上传部署
3. 配置数据库集合和权限

### 2. 如何修改微信小程序 AppID？
编辑 `src/manifest.json`，在 `mp-weixin.appid` 字段中修改为你的 AppID

### 3. 如何添加新的分类？
使用 `categorySave` 云函数，传入分类信息即可

## 开发建议

1. 使用 TypeScript 进行类型安全开发
2. 在 API 层处理所有网络请求
3. 使用 Pinia Store 统一管理应用状态
4. 遵循 Vue 3 Composition API 风格

## 许可证

MIT
