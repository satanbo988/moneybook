import { supabase } from './supabase'
import {
  Book,
  Category,
  RecordItem,
  Budget,
  RecordType,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../types'

// ---------- 初始化：首次登录自动建默认账本 + 默认分类 ----------
export async function ensureUserSetup(userId: string): Promise<Book> {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error

  if (books && books.length > 0) return books[0] as Book

  const { data: book, error: bookErr } = await supabase
    .from('books')
    .insert({ user_id: userId, name: '日常账本', icon: '账' })
    .select()
    .single()
  if (bookErr) throw bookErr

  const cats = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, type: 'expense' as RecordType, sort_order: i })),
    ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ ...c, type: 'income' as RecordType, sort_order: i })),
  ].map((c) => ({ ...c, user_id: userId, book_id: book.id }))

  const { error: catErr } = await supabase.from('categories').insert(cats)
  if (catErr) throw catErr

  return book as Book
}

// ---------- 账本 ----------
export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase.from('books').select('*').order('created_at')
  if (error) throw error
  return (data ?? []) as Book[]
}

export async function createBook(name: string): Promise<Book> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  const { data: book, error } = await supabase
    .from('books')
    .insert({ user_id: user.id, name, icon: name.slice(0, 1) })
    .select()
    .single()
  if (error) throw error

  const cats = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, type: 'expense' as RecordType, sort_order: i })),
    ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ ...c, type: 'income' as RecordType, sort_order: i })),
  ].map((c) => ({ ...c, user_id: user.id, book_id: book.id }))
  await supabase.from('categories').insert(cats)
  return book as Book
}

// ---------- 分类 ----------
export async function fetchCategories(bookId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('book_id', bookId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function createCategory(
  bookId: string,
  name: string,
  type: RecordType
): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, book_id: bookId, name, type, icon: name.slice(0, 1), color: '#64748b', sort_order: 99 })
    .select()
    .single()
  if (error) throw error
  return data as Category
}

// ---------- 账单 ----------
export async function addRecord(input: {
  bookId: string
  categoryId: string | null
  type: RecordType
  amount: number
  note: string
  recordDate: string
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  const { error } = await supabase.from('records').insert({
    user_id: user.id,
    book_id: input.bookId,
    category_id: input.categoryId,
    type: input.type,
    amount: input.amount,
    note: input.note,
    record_date: input.recordDate,
  })
  if (error) throw error
}

export async function fetchRecordsByMonth(bookId: string, month: string): Promise<RecordItem[]> {
  const [y, m] = month.split('-').map(Number)
  const end = new Date(y, m, 0).getDate()
  const { data, error } = await supabase
    .from('records')
    .select('*, categories(name, icon, color)')
    .eq('book_id', bookId)
    .gte('record_date', `${month}-01`)
    .lte('record_date', `${month}-${String(end).padStart(2, '0')}`)
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as RecordItem[]
}

export async function fetchRecordsRange(
  bookId: string,
  startDate: string,
  endDate: string
): Promise<RecordItem[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*, categories(name, icon, color)')
    .eq('book_id', bookId)
    .gte('record_date', startDate)
    .lte('record_date', endDate)
    .order('record_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as RecordItem[]
}

export async function fetchAllRecords(bookId: string): Promise<RecordItem[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*, categories(name, icon, color)')
    .eq('book_id', bookId)
    .order('record_date', { ascending: false })
    .limit(10000)
  if (error) throw error
  return (data ?? []) as RecordItem[]
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from('records').delete().eq('id', id)
  if (error) throw error
}

// ---------- 预算 ----------
export async function fetchBudgets(bookId: string, month: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('book_id', bookId)
    .eq('month', month)
  if (error) throw error
  return (data ?? []) as Budget[]
}

export async function upsertBudget(
  bookId: string,
  categoryId: string | null,
  month: string,
  amount: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      book_id: bookId,
      category_id: categoryId,
      month,
      amount,
    },
    { onConflict: 'book_id,category_id,month' }
  )
  if (error) throw error
}
