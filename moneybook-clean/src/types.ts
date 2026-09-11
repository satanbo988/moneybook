export type RecordType = 'expense' | 'income'

export interface Book {
  id: string
  user_id: string
  name: string
  icon: string
}

export interface Category {
  id: string
  book_id: string
  name: string
  type: RecordType
  icon: string
  color: string
  sort_order: number
}

export interface RecordItem {
  id: string
  book_id: string
  category_id: string | null
  type: RecordType
  amount: number
  note: string
  record_date: string // YYYY-MM-DD
  categories?: Pick<Category, 'name' | 'icon' | 'color'> | null
}

export interface Budget {
  id: string
  book_id: string
  category_id: string | null
  month: string // YYYY-MM
  amount: number
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: '餐饮', icon: '餐', color: '#f97316' },
  { name: '交通', icon: '交', color: '#3b82f6' },
  { name: '购物', icon: '购', color: '#ec4899' },
  { name: '居住', icon: '住', color: '#8b5cf6' },
  { name: '娱乐', icon: '娱', color: '#14b8a6' },
  { name: '医疗', icon: '医', color: '#ef4444' },
  { name: '教育', icon: '教', color: '#6366f1' },
  { name: '通讯', icon: '讯', color: '#0ea5e9' },
  { name: '人情', icon: '礼', color: '#f59e0b' },
  { name: '其他', icon: '他', color: '#64748b' },
]

export const DEFAULT_INCOME_CATEGORIES = [
  { name: '工资', icon: '薪', color: '#16a34a' },
  { name: '奖金', icon: '奖', color: '#d97706' },
  { name: '理财', icon: '财', color: '#0d9488' },
  { name: '兼职', icon: '兼', color: '#7c3aed' },
  { name: '其他', icon: '他', color: '#64748b' },
]
