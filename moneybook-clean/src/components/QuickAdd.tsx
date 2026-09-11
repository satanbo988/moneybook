import { useMemo, useState } from 'react'
import { Category, RecordType } from '../types'
import { addRecord, createCategory } from '../lib/api'
import { todayStr } from '../lib/format'

interface Props {
  bookId: string
  categories: Category[]
  onClose: () => void
  onSaved: () => void
  onCategoryCreated: (c: Category) => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']

export default function QuickAdd({ bookId, categories, onClose, onSaved, onCategoryCreated }: Props) {
  const [type, setType] = useState<RecordType>('expense')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())
  const [saving, setSaving] = useState(false)
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const filtered = useMemo(() => categories.filter((c) => c.type === type), [categories, type])

  function pressKey(k: string) {
    setAmountStr((prev) => {
      if (k === 'del') return prev.slice(0, -1)
      if (k === '.') {
        if (prev.includes('.')) return prev
        return prev === '' ? '0.' : prev + '.'
      }
      const next = prev + k
      const [int, dec] = next.split('.')
      if (int.length > 9) return prev
      if (dec && dec.length > 2) return prev
      return next
    })
  }

  async function handleSave() {
    const amount = parseFloat(amountStr)
    if (!amount || amount <= 0) return
    setSaving(true)
    try {
      await addRecord({ bookId, categoryId, type, amount, note: note.trim(), recordDate: date })
      onSaved()
      onClose()
    } catch (e) {
      alert('保存失败：' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCategory() {
    const name = newCatName.trim()
    if (!name) return
    try {
      const c = await createCategory(bookId, name, type)
      onCategoryCreated(c)
      setCategoryId(c.id)
      setNewCatName('')
      setAddingCat(false)
    } catch (e) {
      alert('新增分类失败：' + (e as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部：类型切换 */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex bg-slate-100 rounded-full p-1">
            {(['expense', 'income'] as RecordType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setCategoryId(null) }}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition ${
                  type === t ? 'bg-teal-700 text-white' : 'text-slate-600'
                }`}
              >
                {t === 'expense' ? '支出' : '收入'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none px-2">×</button>
        </div>

        {/* 金额显示 */}
        <div className="px-5 pt-4 pb-2 text-right">
          <span className="text-slate-400 text-lg mr-1">¥</span>
          <span className={`text-4xl font-bold ${amountStr ? 'text-slate-800' : 'text-slate-300'}`}>
            {amountStr || '0.00'}
          </span>
        </div>

        {/* 分类选择 */}
        <div className="px-5 py-3">
          <div className="grid grid-cols-5 gap-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="flex flex-col items-center gap-1 py-1"
              >
                <span
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-medium transition ${
                    categoryId === c.id ? 'text-white scale-110' : 'text-white/90 opacity-70'
                  }`}
                  style={{ backgroundColor: c.color }}
                >
                  {c.icon}
                </span>
                <span className={`text-xs ${categoryId === c.id ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                  {c.name}
                </span>
              </button>
            ))}
            <button onClick={() => setAddingCat(true)} className="flex flex-col items-center gap-1 py-1">
              <span className="w-11 h-11 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xl">+</span>
              <span className="text-xs text-slate-400">新增</span>
            </button>
          </div>
          {addingCat && (
            <div className="flex gap-2 mt-3">
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="分类名称"
                maxLength={6}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-teal-600"
              />
              <button onClick={handleAddCategory} className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm">确定</button>
            </div>
          )}
        </div>

        {/* 备注 + 日期 */}
        <div className="px-5 flex gap-2 pb-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选）"
            maxLength={50}
            className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-slate-100 rounded-lg text-sm outline-none"
          />
        </div>

        {/* 数字键盘 */}
        <div className="grid grid-cols-4 gap-px bg-slate-200 mt-2">
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => pressKey(k)}
              className="bg-white py-4 text-xl font-medium text-slate-700 active:bg-slate-100"
            >
              {k === 'del' ? '←' : k}
            </button>
          ))}
          <button
            onClick={handleSave}
            disabled={saving || !parseFloat(amountStr)}
            className="bg-teal-700 text-white py-4 text-lg font-medium active:bg-teal-800 disabled:opacity-50"
          >
            {saving ? '…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
