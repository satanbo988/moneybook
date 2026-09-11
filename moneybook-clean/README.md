# 墨记账 MoneyBook

3 秒记一笔的轻量记账 PWA。前端 Vite + React + Tailwind，后端 Supabase（Postgres + Auth + RLS），无需自建服务器。

## 功能

- 快速记账：自定义数字键盘，分类 → 金额 → 保存，3 秒完成
- 收支日历：每天支出一目了然
- 报表：当月支出分类占比（圆环图）+ 近 6 个月收支趋势
- 预算：月度总预算 + 分类预算，80% 预警、超支变红
- 多账本：日常 / 旅行 / 装修分开记
- 数据导出：一键 CSV（Excel 可直接打开）
- PWA：手机浏览器"添加到主屏幕"即可当 App 用

## 部署

完整的一步步图文说明见 **[DEPLOY.md](./DEPLOY.md)**（含每个按钮点哪里、常见报错排查）。

这里只列主干流程和三个必踩的坑：

1. Supabase 建免费项目 → SQL Editor 执行 `supabase/schema.sql`
2. Authentication 里配邮箱登录 + 回调 URL；把 `.env.example` 复制为 `.env.local` 填 Project URL / anon key
3. 本地 `npm run dev` 联调通过后，把前端部署到 Vercel / Netlify
4. 回 Supabase 把 Site URL 改成线上域名

| 坑 | 对策 |
|---|---|
| 默认 SMTP 不给非团队成员邮箱发信（报 `Email address not authorized`），且限 2 封/小时 | 自用：把邮箱加为组织团队成员；多人用：配置自定义 SMTP（Resend 免费额够用） |
| 免费项目 7 天无活动自动暂停 | 控制台点 Resume project 即可恢复，数据不丢 |
| anon key 暴露在前端 | 这是官方设计，安全靠 RLS；务必确认 4 张表 `rowsecurity = true` |

> 没配 Supabase 也能跑：不填 `.env.local` 会自动进入**演示模式**（本地示例数据），方便先看效果再决定要不要上云。

## 数据安全

所有表都启用了 Row Level Security，策略为 `auth.uid() = user_id`——即使用户拿到 anon key，也只能读写自己的数据。anon key 放前端是 Supabase 的官方设计，安全边界在 RLS。

## 目录结构

```
moneybook/
├── supabase/schema.sql      # 数据库初始化（RLS 策略在内）
├── src/
│   ├── App.tsx              # 主壳：登录态、底部导航、月份切换
│   ├── components/
│   │   ├── Auth.tsx         # 邮箱魔法链接登录
│   │   ├── QuickAdd.tsx     # 快速记账（数字键盘）
│   │   ├── Home.tsx         # 账单列表（按日分组）
│   │   ├── CalendarView.tsx # 收支日历
│   │   ├── Stats.tsx        # 分类占比 + 6个月趋势
│   │   ├── Budget.tsx       # 预算管理
│   │   └── Settings.tsx     # 账本管理 / CSV 导出 / 退出
│   └── lib/                 # supabase 客户端、数据访问、格式化
└── .env.example
```
