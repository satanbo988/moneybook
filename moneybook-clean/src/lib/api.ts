import * as db from './db'
import * as demo from './demo'
import { isSupabaseConfigured } from './supabase'
import { Book, Category, RecordItem, Budget, RecordType } from '../types'

// 统一数据访问入口：配好了 Supabase 走云端，否则走本地演示数据
export const IS_DEMO = !isSupabaseConfigured

export async function ensureUserSetup(userId: string): Promise<Book> {
  return IS_DEMO ? demo.ensureUserSetup() : db.ensureUserSetup(userId)
}

export async function fetchBooks(): Promise<Book[]> {
  return IS_DEMO ? demo.fetchBooks() : db.fetchBooks()
}

export async function createBook(name: string): Promise<Book> {
  return IS_DEMO ? demo.createBook(name) : db.createBook(name)
}

export async function fetchCategories(bookId: string): Promise<Category[]> {
  return IS_DEMO ? demo.fetchCategories(bookId) : db.fetchCategories(bookId)
}

export async function createCategory(
  bookId: string,
  name: string,
  type: RecordType
): Promise<Category> {
  return IS_DEMO ? demo.createCategory(bookId, name, type) : db.createCategory(bookId, name, type)
}

export async function addRecord(input: {
  bookId: string
  categoryId: string | null
  type: RecordType
  amount: number
  note: string
  recordDate: string
}): Promise<void> {
  return IS_DEMO ? demo.addRecord(input) : db.addRecord(input)
}

export async function fetchRecordsByMonth(bookId: string, month: string): Promise<RecordItem[]> {
  return IS_DEMO ? demo.fetchRecordsByMonth(bookId, month) : db.fetchRecordsByMonth(bookId, month)
}

export async function fetchRecordsRange(
  bookId: string,
  startDate: string,
  endDate: string
): Promise<RecordItem[]> {
  return IS_DEMO
    ? demo.fetchRecordsRange(bookId, startDate, endDate)
    : db.fetchRecordsRange(bookId, startDate, endDate)
}

export async function fetchAllRecords(bookId: string): Promise<RecordItem[]> {
  return IS_DEMO ? demo.fetchAllRecords(bookId) : db.fetchAllRecords(bookId)
}

export async function deleteRecord(id: string): Promise<void> {
  return IS_DEMO ? demo.deleteRecord(id) : db.deleteRecord(id)
}

export async function fetchBudgets(bookId: string, month: string): Promise<Budget[]> {
  return IS_DEMO ? demo.fetchBudgets(bookId, month) : db.fetchBudgets(bookId, month)
}

export async function upsertBudget(
  bookId: string,
  categoryId: string | null,
  month: string,
  amount: number
): Promise<void> {
  return IS_DEMO
    ? demo.upsertBudget(bookId, categoryId, month, amount)
    : db.upsertBudget(bookId, categoryId, month, amount)
}

export async function resetDemoData(): Promise<void> {
  await demo.resetDemo()
}
