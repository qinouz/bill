const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { userId, year } = event

  try {
    const startStr = `${year}-01-01`
    const endStr = `${year + 1}-01-01`

    const billsRes = await db
      .collection('bills')
      .where({
        userId,
        isDeleted: false,
        billDate: _.gte(startStr).and(_.lt(endStr)),
      })
      .get()

    let income = 0
    let expense = 0
    const monthly = {}

    for (let i = 1; i <= 12; i++) {
      monthly[String(i)] = { income: 0, expense: 0 }
    }

    billsRes.data.forEach((bill) => {
      const month = bill.billDate.substring(5, 7).replace(/^0/, '')
      if (bill.type === 'income') {
        income += bill.amount
        monthly[month].income += bill.amount
      } else {
        expense += bill.amount
        monthly[month].expense += bill.amount
      }
    })

    return {
      code: 0,
      data: { year, income, expense, balance: income - expense, monthly },
      message: 'success',
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}
