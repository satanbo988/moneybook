import { useEffect, useMemo, useState } from 'react'
import { RecordItem } from '../types'
import { fmtMoney, monthLabel, shiftMonth } from '../lib/format'
import { fetchRecordsRange } from '../lib/api'

interface Props {
  bookId: string
  month: string
  monthRecords: RecordItem[]
}

interface CatAgg {
  name: string
  color: string
  amount: number
  pct: number
}

export default function Stats({ bookId, month, monthRecords }: Props) {
  const [trend, setTrend] = useState<{ month: string; expense: number; income: number }[]>([])

  // 近 6 个月趋势
  useEffect(() => {
    const start = shiftMonth(month, -5) + '-01'
    const [y, m] = month.split('-').map(Number)
    const end = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
    fetchRecordsRange(bookId, start, end).then((list) => {
      const map = new Map<string, { expense: number; income: number }>()
      for (let i = -5; i <= 0; i++) map.set(shiftMonth(month, i), { expense: 0, income: 0 })
      for (const r of list) {
        const key = r.record_date.slice(0, 7)
        const agg = map.get(key)
        if (!agg) continue
        if (r.type === 'expense') agg.expense += Number(r.amount)
        else agg.income += Number(r.amount)
      }
      setTrend([...map.entries()].map(([mo, v]) => ({ month: mo, ...v })))
    })
  }, [bookId, month])

  // 当月支出分类占比
  const { catAggs, totalExpense } = useMemo(() => {
    const map = new Map<string, { name: string; color: string; amount: number }>()
    let total = 0
    for (const r of monthRecords) {
      if (r.type !== 'expense') continue
      const amt = Number(r.amount)
      total += amt
      const name = r.categories?.name ?? '未分类'
      const cur = map.get(name) ?? { name, color: r.categories?.color ?? '#94a3b8', amount: 0 }
      cur.amount += amt
      map.set(name, cur)
    }
    const list = [...map.values()]
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({ ...c, pct: total > 0 ? (c.amount / total) * 100 : 0 }))
    return { catAggs: list, totalExpense: total }
  }, [monthRecords])

  const maxTrend = Math.max(1, ...trend.map((t) => Math.max(t.expense, t.income)))

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {/* 分类占比 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-slate-800 mb-4">{monthLabel(month)} 支出构成</h3>
        {catAggs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">本月暂无支出记录</p>
        ) : (
          <div className="flex items-center gap-5">
            <Donut data={catAggs} total={totalExpense} />
            <div className="flex-1 space-y-2 min-w-0">
              {catAggs.slice(0, 6).map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-700 truncate">{c.name}</span>
                  <span className="text-slate-400 text-xs ml-auto shrink-0">{c.pct.toFixed(1)}%</span>
                  <span className="text-slate-800 font-medium shrink-0 w-20 text-right">¥{fmtMoney(c.amount)}</span>
                </div>
              ))}
              {catAggs.length > 6 && (
                <p className="text-xs text-slate-400">其余 {catAggs.length - 6} 类合计见圆环</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6 个月趋势 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-slate-800 mb-1">近 6 个月收支趋势</h3>
        <div className="flex gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" />支出</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />收入</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-36">
          {trend.map((t) => (
            <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-1 h-28 w-full justify-center">
                <div
                  className="w-3.5 bg-slate-700 rounded-t"
                  style={{ height: `${(t.expense / maxTrend) * 100}%`, minHeight: t.expense > 0 ? 3 : 0 }}
                  title={`支出 ¥${fmtMoney(t.expense)}`}
                />
                <div
                  className="w-3.5 bg-red-500 rounded-t"
                  style={{ height: `${(t.income / maxTrend) * 100}%`, minHeight: t.income > 0 ? 3 : 0 }}
                  title={`收入 ¥${fmtMoney(t.income)}`}
                />
              </div>
              <span className="text-[10px] text-slate-400">{Number(t.month.slice(5))}月</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Donut({ data, total }: { data: CatAgg[]; total: number }) {
  const R = 54
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="relative shrink-0">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {data.map((c) => {
          const len = (c.pct / 100) * C
          const dash = `${Math.max(len - 1.5, 0)} ${C - Math.max(len - 1.5, 0)}`
          const el = (
            <circle
              key={c.name}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={c.color}
              strokeWidth="20"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] text-slate-400">总支出</span>
        <span className="text-sm font-bold text-slate-800">¥{fmtMoney(total)}</span>
      </div>
    </div>
  )
}
