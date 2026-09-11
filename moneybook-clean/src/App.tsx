import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { IS_DEMO } from './lib/api'
import {
  ensureUserSetup,
  fetchBooks,
  fetchCategories,
  fetchRecordsByMonth,
  resetDemoData,
} from './lib/api'
import { Book, Category, RecordItem } from './types'
import { currentMonth, shiftMonth } from './lib/format'
import Auth from './components/Auth'
import Home from './components/Home'
import CalendarView from './components/CalendarView'
import Stats from './components/Stats'
import Budget from './components/Budget'
import Settings from './components/Settings'
import QuickAdd from './components/QuickAdd'

type Tab = 'home' | 'calendar' | 'stats' | 'budget' | 'my'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: '账单', icon: '账' },
  { key: 'calendar', label: '日历', icon: '历' },
  { key: 'stats', label: '报表', icon: '报' },
  { key: 'budget', label: '预算', icon: '预' },
  { key: 'my', label: '我的', icon: '我' },
]

function makeDemoSession(): Session {
  return {
    access_token: 'demo-token',
    refresh_token: 'demo-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'demo-user',
      aud: 'authenticated',
      role: 'authenticated',
      email: '演示账号（本地）',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  } as unknown as Session
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [booting, setBooting] = useState(!IS_DEMO)

  const [books, setBooks] = useState<Book[]>([])
  const [book, setBook] = useState<Book | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [month, setMonth] = useState(currentMonth())
  const [records, setRecords] = useState<RecordItem[]>([])
  const [tab, setTab] = useState<Tab>('home')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (IS_DEMO) {
      setBooting(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setBooting(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  function enterDemo() {
    setSession(makeDemoSession())
  }

  // 进入会话后初始化账本
  useEffect(() => {
    if (!session) return
    let alive = true
    ensureUserSetup(session.user.id).then(async (b) => {
      const all = await fetchBooks()
      if (!alive) return
      setBooks(all)
      setBook(b)
    })
    return () => {
      alive = false
    }
  }, [session])

  const refreshRecords = useCallback(() => {
    if (!book) return
    fetchRecordsByMonth(book.id, month).then(setRecords)
  }, [book, month])

  useEffect(() => {
    if (!book) return
    fetchCategories(book.id).then(setCategories)
    refreshRecords()
  }, [book, refreshRecords])

  if (booting) {
    return <div className="min-h-full flex items-center justify-center text-slate-400">加载中…</div>
  }

  if (!session) return <Auth demo={IS_DEMO} onEnterDemo={enterDemo} />

  if (!book) {
    return <div className="min-h-full flex items-center justify-center text-slate-400">正在准备你的账本…</div>
  }

  async function handleExit() {
    if (IS_DEMO) {
      setSession(null)
    } else {
      await supabase.auth.signOut()
    }
  }

  async function handleResetDemo() {
    if (!confirm('清空本地演示数据并恢复到初始示例账单？')) return
    await resetDemoData()
    setSession(null)
    setBook(null)
    setBooks([])
    setRecords([])
    setTab('home')
  }

  return (
    <div className="min-h-full max-w-lg mx-auto bg-slate-50 relative">
      {IS_DEMO && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-1.5 px-4">
          演示模式 · 数据存在本机浏览器，配置 Supabase 后自动切换为云端同步
        </div>
      )}

      {/* 月份切换 */}
      {tab !== 'my' && (
        <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur px-4 pt-3 pb-2 flex items-center justify-center gap-6">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="text-slate-400 text-lg px-2">
            ‹
          </button>
          <span className="text-sm font-medium text-slate-700">{month}</span>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= currentMonth()}
            className="text-slate-400 text-lg px-2 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      {tab === 'home' && <Home book={book} month={month} records={records} onRefresh={refreshRecords} />}
      {tab === 'calendar' && <CalendarView month={month} records={records} />}
      {tab === 'stats' && <Stats bookId={book.id} month={month} monthRecords={records} />}
      {tab === 'budget' && (
        <Budget bookId={book.id} month={month} categories={categories} monthRecords={records} />
      )}
      {tab === 'my' && (
        <Settings
          books={books}
          currentBook={book}
          userEmail={session.user.email ?? ''}
          isDemo={IS_DEMO}
          onSwitchBook={(b) => {
            setBook(b)
            setTab('home')
          }}
          onBookCreated={(b) => {
            setBooks([...books, b])
            setBook(b)
          }}
          onExit={handleExit}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* 记一笔 FAB */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-20 pointer-events-none">
        <button
          onClick={() => setShowAdd(true)}
          className="pointer-events-auto absolute bottom-20 right-4 w-14 h-14 rounded-full bg-teal-700 text-white text-3xl shadow-lg shadow-teal-700/30 active:scale-95 transition"
          aria-label="记一笔"
        >
          +
        </button>
      </div>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-slate-200 flex z-20">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 ${
              tab === t.key ? 'text-teal-700' : 'text-slate-400'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span className="text-[10px]">{t.label}</span>
          </button>
        ))}
      </nav>

      {showAdd && (
        <QuickAdd
          bookId={book.id}
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={refreshRecords}
          onCategoryCreated={(c) => setCategories([...categories, c])}
        />
      )}
    </div>
  )
}
