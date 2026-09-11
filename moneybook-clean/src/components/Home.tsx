import { useMemo } from 'react'
import { RecordItem, Book } from '../types'
import { fmtMoney, monthLabel, weekdayCN, todayStr } from '../lib/format'
import { deleteRecord } from '../lib/api'

interface Props {
  book: Book
  month: string
  records: RecordItem[]
  onRefresh: () => void
}

export default function Home({ book, month, records, onRefresh }: Props) {
  const { expense, income } = useMemo(() => {
    let e = 0, i = 0
    for (const r of records) {
      if (r.type === 'expense') e += Number(r.amount)
      else i += Number(r.amount)
    }
    return { expense: e, income: i }
  }, [records])

  const grouped = useMemo(() => {
    const map = new Map<string, RecordItem[]>()
    for (const r of records) {
      const list = map.get(r.record_date) ?? []
      list.push(r)
      map.set(r.record_date, list)
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [records])

  async function handleDelete(id: string) {
    if (!confirm('删除这条账单？')) return
    await deleteRecord(id)
    onRefresh()
  }

  return (
    <div className="pb-24">
      {/* 月度汇总 */}
      <div className="bg-teal-700 text-white px-5 pt-6 pb-8 rounded-b-3xl">
        <div className="text-sm text-teal-200">
          {book.name} · {monthLabel(month)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-teal-200">支出</div>
            <div className="text-xl font-bold mt-0.5">¥{fmtMoney(expense)}</div>
          </div>
          <div>
            <div className="text-xs text-teal-200">收入</div>
            <div className="text-xl font-bold mt-0.5">¥{fmtMoney(income)}</div>
          </div>
          <div>
            <div className="text-xs text-teal-200">结余</div>
            <div className="text-xl font-bold mt-0.5">¥{fmtMoney(income - expense)}</div>
          </div>
        </div>
      </div>

      {/* 账单列表 */}
      <div className="px-4 mt-4 space-y-4">
        {grouped.length === 0 && (
          <div className="text-center text-slate-400 py-16">
            <div className="text-4xl mb-3 text-slate-300">空</div>
            这个月还没有账单，点右下角 + 记一笔
          </div>
        )}
        {grouped.map(([date, list]) => {
          const dayExpense = list.filter((r) => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
          const dayIncome = list.filter((r) => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
          return (
            <div key={date}>
              <div className="flex items-baseline justify-between px-1 mb-1.5">
                <span className="text-xs font-medium text-slate-500">
                  {date === todayStr() ? '今天' : date} {weekdayCN(date)}
                </span>
                <span className="text-xs text-slate-400">
                  {dayExpense > 0 && `支 ¥${fmtMoney(dayExpense)}`}
                  {dayExpense > 0 && dayIncome > 0 && ' · '}
                  {dayIncome > 0 && `收 ¥${fmtMoney(dayIncome)}`}
                </span>
              </div>
              <div className="bg-white rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                {list.map((r) => (
                  <div key={r.id} className="flex items-center px-4 py-3 gap-3">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                      style={{ backgroundColor: r.categories?.color ?? '#94a3b8' }}
                    >
                      {r.categories?.icon ?? '他'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">
                        {r.categories?.name ?? '未分类'}
                      </div>
                      {r.note && <div className="text-xs text-slate-400 truncate">{r.note}</div>}
                    </div>
                    <div className={`text-sm font-semibold ${r.type === 'income' ? 'text-red-600' : 'text-slate-800'}`}>
                      {r.type === 'income' ? '+' : '-'}¥{fmtMoney(Number(r.amount))}
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-slate-300 hover:text-red-500 text-lg leading-none ml-1"
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
