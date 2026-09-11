import {
  Book,
  Category,
  RecordItem,
  Budget,
  RecordType,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../types'

// ============================================================
// 演示数据层：不接 Supabase 时，用 localStorage 模拟同样的数据接口
// 目的是让用户零配置就能看到完整效果，接口签名与 lib/db.ts 保持一致
// ============================================================

const STORAGE_KEY = 'moneybook-demo-state'

export const DEMO_USER_ID = 'demo-user'

interface DemoState {
  books: Book[]
  categories: Category[]
  records: RecordItem[]
  budgets: Budget[]
}

// 固定种子的伪随机，保证每次初始化的示例数据一致
let seed = 20260910
function rnd(): number {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const AMOUNT_RANGE: Record<string, [number, number]> = {
  餐饮: [18, 180],
  交通: [4, 260],
  购物: [39, 1800],
  居住: [1200, 2600],
  娱乐: [25, 520],
  医疗: [30, 1200],
  教育: [99, 2600],
  通讯: [39, 220],
  人情: [200, 1600],
  其他: [10, 320],
}

function seedState(): DemoState {
  const book: Book = {
    id: 'demo-book',
    user_id: DEMO_USER_ID,
    name: '日常账本',
    icon: '账',
  }

  const categories: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
      id: `cat-e-${i}`,
      book_id: book.id,
      name: c.name,
      type: 'expense' as RecordType,
      icon: c.icon,
      color: c.color,
      sort_order: i,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
      id: `cat-i-${i}`,
      book_id: book.id,
      name: c.name,
      type: 'income' as RecordType,
      icon: c.icon,
      color: c.color,
      sort_order: i,
    })),
  ]

  const expenseCats = categories.filter((c) => c.type === 'expense')
  const salaryCat = categories.find((c) => c.name === '工资')!
  const investCat = categories.find((c) => c.name === '理财')!
  const rentCat = categories.find((c) => c.name === '居住')!

  const records: RecordItem[] = []
  const today = new Date()
  let rid = 0

  // 近 3 个月（含本月）
  for (let back = 2; back >= 0; back--) {
    const base = new Date(today.getFullYear(), today.getMonth() - back, 1)
    const y = base.getFullYear()
    const m = base.getMonth()
    const lastDay = new Date(y, m + 1, 0).getDate()
    const maxDay = back === 0 ? today.getDate() : lastDay
    const monthStr = `${y}-${pad(m + 1)}`

    // 固定收入：每月 8 号发薪
    if (maxDay >= 8) {
      records.push({
        id: `r-${rid++}`,
        book_id: book.id,
        category_id: salaryCat.id,
        type: 'income',
        amount: 18650,
        note: '月度工资',
        record_date: `${monthStr}-08`,
        categories: { name: salaryCat.name, icon: salaryCat.icon, color: salaryCat.color },
      })
    }
    // 偶尔有一笔理财收益
    if (maxDay >= 20 && rnd() > 0.35) {
      const amt = Math.round((200 + rnd() * 1800) * 100) / 100
      records.push({
        id: `r-${rid++}`,
        book_id: book.id,
        category_id: investCat.id,
        type: 'income',
        amount: amt,
        note: '基金赎回',
        record_date: `${monthStr}-${pad(18 + Math.floor(rnd() * 8))}`,
        categories: { name: investCat.name, icon: investCat.icon, color: investCat.color },
      })
    }
    // 房租：每月 1 号
    if (maxDay >= 1) {
      records.push({
        id: `r-${rid++}`,
        book_id: book.id,
        category_id: rentCat.id,
        type: 'expense',
        amount: 2200,
        note: '房租',
        record_date: `${monthStr}-01`,
        categories: { name: rentCat.name, icon: rentCat.icon, color: rentCat.color },
      })
    }

    // 日常消费：当月按天推进，历史月铺满
    const count = back === 0 ? Math.round(maxDay * 1.6) : 60
    for (let i = 0; i < count; i++) {
      const cat = expenseCats[Math.floor(rnd() * expenseCats.length)]
      if (cat.id === rentCat.id) continue
      const [lo, hi] = AMOUNT_RANGE[cat.name] ?? [10, 300]
      const amt = Math.round((lo + rnd() * (hi - lo)) * 100) / 100
      const day = 1 + Math.floor(rnd() * maxDay)
      records.push({
        id: `r-${rid++}`,
        book_id: book.id,
        category_id: cat.id,
        type: 'expense',
        amount: amt,
        note: '',
        record_date: `${monthStr}-${pad(day)}`,
        categories: { name: cat.name, icon: cat.icon, color: cat.color },
      })
    }
  }

  records.sort((a, b) => (a.record_date < b.record_date ? 1 : a.record_date > b.record_date ? -1 : 0))

  const thisMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`
  const budgets: Budget[] = [
    { id: 'b-0', book_id: book.id, category_id: null, month: thisMonth, amount: 8000 },
    { id: 'b-1', book_id: book.id, category_id: categories.find((c) => c.name === '餐饮')!.id, month: thisMonth, amount: 1800 },
    { id: 'b-2', book_id: book.id, category_id: categories.find((c) => c.name === '交通')!.id, month: thisMonth, amount: 400 },
    { id: 'b-3', book_id: book.id, category_id: categories.find((c) => c.name === '购物')!.id, month: thisMonth, amount: 2000 },
    { id: 'b-4', book_id: book.id, category_id: categories.find((c) => c.name === '娱乐')!.id, month: thisMonth, amount: 600 },
  ]

  return { books: [book], categories, records, budgets }
}

function load(): DemoState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as DemoState
    } catch {
      // 数据损坏，重新生成
    }
  }
  const fresh = seedState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  return fresh
}

function save(state: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export async function resetDemo() {
  localStorage.removeItem(STORAGE_KEY)
}

// ---------- 以下接口与 lib/db.ts 一一对应 ----------

export async function ensureUserSetup(): Promise<Book> {
  return load().books[0]
}

export async function fetchBooks(): Promise<Book[]> {
  return load().books
}

export async function createBook(name: string): Promise<Book> {
  const state = load()
  const book: Book = { id: `book-${Date.now()}`, user_id: DEMO_USER_ID, name, icon: name.slice(0, 1) }
  const cats: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
      id: `book-${book.id}-cat-e-${i}`,
      book_id: book.id,
      name: c.name,
      type: 'expense' as RecordType,
      icon: c.icon,
      color: c.color,
      sort_order: i,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
      id: `book-${book.id}-cat-i-${i}`,
      book_id: book.id,
      name: c.name,
      type: 'income' as RecordType,
      icon: c.icon,
      color: c.color,
      sort_order: i,
    })),
  ]
  state.books.push(book)
  state.categories.push(...cats)
  save(state)
  return book
}

export async function fetchCategories(bookId: string): Promise<Category[]> {
  return load().categories.filter((c) => c.book_id === bookId)
}

export async function createCategory(
  bookId: string,
  name: string,
  type: RecordType
): Promise<Category> {
  const state = load()
  const cat: Category = {
    id: `cat-${Date.now()}`,
    book_id: bookId,
    name,
    type,
    icon: name.slice(0, 1),
    color: '#64748b',
    sort_order: 99,
  }
  state.categories.push(cat)
  save(state)
  return cat
}

export async function addRecord(input: {
  bookId: string
  categoryId: string | null
  type: RecordType
  amount: number
  note: string
  recordDate: string
}): Promise<void> {
  const state = load()
  const cat = state.categories.find((c) => c.id === input.categoryId)
  const rec: RecordItem = {
    id: `r-${Date.now()}`,
    book_id: input.bookId,
    category_id: input.categoryId,
    type: input.type,
    amount: input.amount,
    note: input.note,
    record_date: input.recordDate,
    categories: cat ? { name: cat.name, icon: cat.icon, color: cat.color } : null,
  }
  state.records.unshift(rec)
  save(state)
}

export async function fetchRecordsByMonth(bookId: string, month: string): Promise<RecordItem[]> {
  return load().records.filter(
    (r) => r.book_id === bookId && r.record_date.slice(0, 7) === month
  )
}

export async function fetchRecordsRange(
  bookId: string,
  startDate: string,
  endDate: string
): Promise<RecordItem[]> {
  return load().records.filter(
    (r) =>
      r.book_id === bookId && r.record_date >= startDate && r.record_date <= endDate
  )
}

export async function fetchAllRecords(bookId: string): Promise<RecordItem[]> {
  return load().records.filter((r) => r.book_id === bookId)
}

export async function deleteRecord(id: string): Promise<void> {
  const state = load()
  state.records = state.records.filter((r) => r.id !== id)
  save(state)
}

export async function fetchBudgets(bookId: string, month: string): Promise<Budget[]> {
  return load().budgets.filter((b) => b.book_id === bookId && b.month === month)
}

export async function upsertBudget(
  bookId: string,
  categoryId: string | null,
  month: string,
  amount: number
): Promise<void> {
  const state = load()
  const existing = state.budgets.find(
    (b) => b.book_id === bookId && b.month === month && b.category_id === categoryId
  )
  if (existing) {
    existing.amount = amount
  } else {
    state.budgets.push({
      id: `budget-${Date.now()}`,
      book_id: bookId,
      category_id: categoryId,
      month,
      amount,
    })
  }
  save(state)
}
