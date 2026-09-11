import { useState } from 'react'
import { Book } from '../types'
import { createBook, fetchAllRecords } from '../lib/api'
import { fmtMoney } from '../lib/format'

interface Props {
  books: Book[]
  currentBook: Book
  userEmail: string
  isDemo: boolean
  onSwitchBook: (b: Book) => void
  onBookCreated: (b: Book) => void
  onExit: () => void
  onResetDemo: () => void
}

export default function Settings({
  books,
  currentBook,
  userEmail,
  isDemo,
  onSwitchBook,
  onBookCreated,
  onExit,
  onResetDemo,
}: Props) {
  const [newBookName, setNewBookName] = useState('')
  const [creating, setCreating] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleCreateBook() {
    const name = newBookName.trim()
    if (!name) return
    setCreating(true)
    try {
      const book = await createBook(name)
      onBookCreated(book)
      setNewBookName('')
    } catch (e) {
      alert('创建账本失败：' + (e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const records = await fetchAllRecords(currentBook.id)
      const header = '日期,类型,分类,金额,备注'
      const rows = records.map((r) =>
        [
          r.record_date,
          r.type === 'expense' ? '支出' : '收入',
          r.categories?.name ?? '未分类',
          fmtMoney(Number(r.amount)),
          `"${(r.note ?? '').replace(/"/g, '""')}"`,
        ].join(',')
      )
      // BOM 保证 Excel 打开不乱码
      const csv = '﻿' + [header, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `墨记账_${currentBook.name}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      alert('导出失败：' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-slate-800 px-1">我的</h2>

      {/* 账户 */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold">
          {isDemo ? '演' : userEmail.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-800 truncate">
            {isDemo ? '演示账号（本地）' : userEmail}
          </div>
          <div className="text-xs text-slate-400">
            {isDemo ? '数据存在本机浏览器，随时可重置' : '数据已加密同步到云端'}
          </div>
        </div>
      </div>

      {/* 账本管理 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-medium text-slate-800 mb-3">账本</h3>
        <div className="space-y-2">
          {books.map((b) => (
            <button
              key={b.id}
              onClick={() => onSwitchBook(b)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition ${
                b.id === currentBook.id
                  ? 'bg-teal-50 text-teal-800 font-medium ring-1 ring-teal-600'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{b.name}</span>
              {b.id === currentBook.id && <span className="text-xs">当前</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={newBookName}
            onChange={(e) => setNewBookName(e.target.value)}
            placeholder="新账本名称，如：旅行、装修"
            maxLength={12}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-teal-600"
          />
          <button
            onClick={handleCreateBook}
            disabled={creating}
            className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm disabled:opacity-60"
          >
            {creating ? '…' : '新建'}
          </button>
        </div>
      </div>

      {/* 数据导出 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-medium text-slate-800 mb-2">数据导出</h3>
        <p className="text-xs text-slate-400 mb-3">
          导出当前账本全部账单为 CSV，Excel 可直接打开做复盘分析。
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 border border-teal-700 text-teal-700 rounded-lg text-sm disabled:opacity-60"
        >
          {exporting ? '导出中…' : '导出 CSV'}
        </button>
      </div>

      {isDemo && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-medium text-slate-800 mb-2">演示数据</h3>
          <p className="text-xs text-slate-400 mb-3">
            重置会清空你对演示数据做的改动，恢复到初始的 3 个月示例账单。
          </p>
          <button
            onClick={onResetDemo}
            className="px-4 py-2 border border-amber-600 text-amber-700 rounded-lg text-sm"
          >
            重置演示数据
          </button>
        </div>
      )}

      <button
        onClick={onExit}
        className="w-full py-3 text-sm text-red-600 bg-white rounded-2xl shadow-sm"
      >
        退出登录
      </button>
    </div>
  )
}
