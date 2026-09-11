import { useEffect, useMemo, useState } from 'react'
import { Budget as BudgetType, Category, RecordItem } from '../types'
import { fmtMoney, monthLabel } from '../lib/format'
import { fetchBudgets, upsertBudget } from '../lib/api'

interface Props {
  bookId: string
  month: string
  categories: Category[]
  monthRecords: RecordItem[]
}

export default function Budget({ bookId, month, categories, monthRecords }: Props) {
  const [budgets, setBudgets] = useState<BudgetType[]>([])
  const [editing, setEditing] = useState<{ categoryId: string | null; value: string } | null>(null)

  useEffect(() => {
    fetchBudgets(bookId, month).then(setBudgets)
  }, [bookId, month])

  // 当月各分类支出
  const spentByCat = useMemo(() => {
    const map = new Map<string | null, number>()
    for (const r of monthRecords) {
      if (r.type !== 'expense') continue
      const key = r.category_id
      map.set(key, (map.get(key) ?? 0) + Number(r.amount))
    }
    return map
  }, [monthRecords])

  const totalSpent = useMemo(
    () => [...spentByCat.values()].reduce((s, v) => s + v, 0),
    [spentByCat]
  )

  const totalBudget = budgets.find((b) => b.category_id === null)?.amount ?? 0
  const expenseCats = categories.filter((c) => c.type === 'expense')

  async function saveBudget(categoryId: string | null, value: string) {
    const amount = parseFloat(value)
    if (isNaN(amount) || amount < 0) {
      setEditing(null)
      return
    }
    await upsertBudget(bookId, categoryId, month, amount)
    setBudgets(await fetchBudgets(bookId, month))
    setEditing(null)
  }

  function renderBar(spent: number, budget: number) {
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
    const over = budget > 0 && spent > budget
    const near = !over && budget > 0 && spent / budget > 0.8
    return (
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-teal-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-slate-800 px-1">{monthLabel(month)} 预算</h2>

      {/* 总预算 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-slate-800">月度总预算</span>
          {editing && editing.categoryId === null ? (
            <input
              autoFocus
              type="number"
              value={editing.value}
              onChange={(e) => setEditing({ categoryId: null, value: e.target.value })}
              onBlur={() => saveBudget(null, editing.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveBudget(null, editing.value)}
              className="w-28 px-2 py-1 border border-teal-600 rounded text-right text-sm outline-none"
            />
          ) : (
            <button
              onClick={() => setEditing({ categoryId: null, value: totalBudget ? String(totalBudget) : '' })}
              className="text-sm text-teal-700 font-medium"
            >
              {totalBudget > 0 ? `¥${fmtMoney(Number(totalBudget))}` : '点击设置'}
            </button>
          )}
        </div>
        {renderBar(totalSpent, Number(totalBudget))}
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>已用 ¥{fmtMoney(totalSpent)}</span>
          {Number(totalBudget) > 0 && (
            <span className={totalSpent > Number(totalBudget) ? 'text-red-600 font-medium' : ''}>
              {totalSpent > Number(totalBudget)
                ? `已超支 ¥${fmtMoney(totalSpent - Number(totalBudget))}`
                : `剩余 ¥${fmtMoney(Number(totalBudget) - totalSpent)}`}
            </span>
          )}
        </div>
      </div>

      {/* 分类预算 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-medium text-slate-800 mb-3">分类预算</h3>
        <div className="space-y-4">
          {expenseCats.map((c) => {
            const b = budgets.find((x) => x.category_id === c.id)
            const budget = Number(b?.amount ?? 0)
            const spent = spentByCat.get(c.id) ?? 0
            const isEditing = editing?.categoryId === c.id
            return (
              <div key={c.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.icon}
                  </span>
                  <span className="text-sm text-slate-700">{c.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    已用 ¥{fmtMoney(spent)}
                  </span>
                  {isEditing ? (
                    <input
                      autoFocus
                      type="number"
                      value={editing.value}
                      onChange={(e) => setEditing({ categoryId: c.id, value: e.target.value })}
                      onBlur={() => saveBudget(c.id, editing.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveBudget(c.id, editing.value)}
                      className="w-24 px-2 py-0.5 border border-teal-600 rounded text-right text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setEditing({ categoryId: c.id, value: budget ? String(budget) : '' })}
                      className="text-xs text-teal-700 font-medium shrink-0"
                    >
                      {budget > 0 ? `¥${fmtMoney(budget)}` : '设置'}
                    </button>
                  )}
                </div>
                {budget > 0 && renderBar(spent, budget)}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          绿色正常，橙色超过 80% 提醒，红色表示已超支。
        </p>
      </div>
    </div>
  )
}
