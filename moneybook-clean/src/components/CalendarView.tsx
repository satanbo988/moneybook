import { useMemo } from 'react'
import { RecordItem } from '../types'
import { fmtMoney, monthLabel, todayStr } from '../lib/format'

interface Props {
  month: string
  records: RecordItem[]
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

interface DayCell {
  day: number
  dateStr: string
  expense: number
  income: number
}

export default function CalendarView({ month, records }: Props) {
  const { cells, monthExpense, monthIncome } = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    // 周一开头：JS getDay() 周日=0，转成 周一=0
    const firstDay = (new Date(y, m - 1, 1).getDay() + 6) % 7

    const byDay = new Map<number, { expense: number; income: number }>()
    let monthExpense = 0
    let monthIncome = 0
    for (const r of records) {
      const d = Number(r.record_date.slice(8, 10))
      const agg = byDay.get(d) ?? { expense: 0, income: 0 }
      const amt = Number(r.amount)
      if (r.type === 'expense') {
        agg.expense += amt
        monthExpense += amt
      } else {
        agg.income += amt
        monthIncome += amt
      }
      byDay.set(d, agg)
    }

    const cells: (DayCell | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const agg = byDay.get(d)
      cells.push({
        day: d,
        dateStr: `${month}-${String(d).padStart(2, '0')}`,
        expense: agg?.expense ?? 0,
        income: agg?.income ?? 0,
      })
    }
    return { cells, monthExpense, monthIncome }
  }, [month, records])

  const today = todayStr()

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-slate-800">{monthLabel(month)}</h2>
        <div className="text-xs text-slate-500">
          支 ¥{fmtMoney(monthExpense)} · 收 ¥{fmtMoney(monthIncome)}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-3">
        <div className="grid grid-cols-7 text-center text-xs text-slate-400 pb-2">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) =>
            cell === null ? (
              <div key={'blank-' + i} className="min-h-[52px]" />
            ) : (
              <div
                key={cell.dateStr}
                className={`min-h-[52px] rounded-lg flex flex-col items-center justify-start pt-1 ${
                  cell.dateStr === today ? 'bg-teal-50 ring-1 ring-teal-600' : ''
                }`}
              >
                <span
                  className={`text-xs ${
                    cell.dateStr === today ? 'font-bold text-teal-700' : 'text-slate-600'
                  }`}
                >
                  {cell.day}
                </span>
                {cell.expense > 0 && (
                  <span className="text-[9px] leading-tight text-slate-500">
                    -{cell.expense >= 10000 ? (cell.expense / 10000).toFixed(1) + 'w' : Math.round(cell.expense)}
                  </span>
                )}
                {cell.income > 0 && (
                  <span className="text-[9px] leading-tight text-red-500">
                    +{cell.income >= 10000 ? (cell.income / 10000).toFixed(1) + 'w' : Math.round(cell.income)}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3 px-1">
        每天一格：灰色为支出，红色为收入，金额过万元显示为 w。
      </p>
    </div>
  )
}
