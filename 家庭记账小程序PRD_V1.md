# 家庭记账微信小程序 PRD（V1.0）

## 项目简介

开发一个类似鲨鱼记账的微信小程序。

技术栈：

- 微信原生小程序
- 微信云开发
- 云数据库
- 云函数

## 功能模块

### 1. 明细页

展示本月收入、支出汇总。

按日期分组展示账单。

支持：

- 下拉刷新
- 分页加载
- 查看账单详情

---

### 2. 账单统计页

展示：

- 年度收入
- 年度支出
- 年度结余

按月份统计收支数据。

---

### 3. 记账页

支出分类：

- 餐饮
- 购物
- 日用
- 交通
- 蔬菜
- 水果
- 零食
- 运动
- 娱乐
- 通讯
- 服饰
- 美容
- 住房
- 居家
- 孩子
- 长辈
- 社交
- 旅行
- 烟酒
- 数码
- 汽车
- 医疗
- 书籍
- 学习

收入分类：

- 工资
- 兼职
- 理财
- 礼金
- 其它

功能：

- 分类选择
- 金额输入
- 备注输入
- 保存账单

---

### 4. 我的

显示：

- 用户头像
- 用户昵称
- 连续打卡天数
- 总记账天数
- 总记账笔数

菜单：

- 类别设置
- 关于

---

## 数据库设计

### users

```json
{
  "_id": "",
  "openid": "",
  "nickName": "",
  "avatarUrl": "",
  "createTime": ""
}
```

### categories

```json
{
  "_id": "",
  "userId": "",
  "name": "",
  "icon": "",
  "type": "income|expense",
  "sort": 0,
  "isDefault": true,
  "createTime": ""
}
```

### bills

```json
{
  "_id": "",
  "userId": "",
  "categoryId": "",
  "amount": 0,
  "type": "income|expense",
  "remark": "",
  "billDate": "",
  "createTime": "",
  "updateTime": "",
  "isDeleted": false
}
```

## 云函数

### login

获取 openid

### addBill

新增账单

### getBillList

获取账单列表

### getBillStatistic

获取统计信息

### categoryList

获取分类列表

### categorySave

新增分类

## 二期规划

- AI自然语言记账
- DeepSeek分类识别
- 语音记账
- OCR小票识别
- 家庭共享账本
