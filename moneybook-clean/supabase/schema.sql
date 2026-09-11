-- ============================================================
-- 墨记账 MoneyBook - Supabase 数据库初始化脚本
-- 在 Supabase 控制台 -> SQL Editor 里整段执行一次即可
-- ============================================================

-- 1. 账本表
create table if not exists public.books (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default '日常账本',
  icon       text not null default '账',
  created_at timestamptz not null default now()
);

-- 2. 分类表
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_id    uuid not null references public.books(id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('expense', 'income')),
  icon       text not null default '钱',
  color      text not null default '#64748b',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- 3. 账单表
create table if not exists public.records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     uuid not null references public.books(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type        text not null check (type in ('expense', 'income')),
  amount      numeric(12, 2) not null check (amount > 0),
  note        text not null default '',
  record_date date not null default current_date,
  created_at  timestamptz not null default now()
);

-- 4. 预算表（category_id 为 null 表示整月总预算）
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     uuid not null references public.books(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  month       char(7) not null,  -- 格式 'YYYY-MM'
  amount      numeric(12, 2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (book_id, category_id, month)
);

-- 索引
create index if not exists idx_records_book_date on public.records (book_id, record_date desc);
create index if not exists idx_records_user      on public.records (user_id);
create index if not exists idx_categories_book   on public.categories (book_id);
create index if not exists idx_budgets_book      on public.budgets (book_id, month);

-- ============================================================
-- Row Level Security：每个用户只能读写自己的数据
-- ============================================================
alter table public.books      enable row level security;
alter table public.categories enable row level security;
alter table public.records    enable row level security;
alter table public.budgets    enable row level security;

create policy "books_own"      on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "records_own"    on public.records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets_own"    on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
