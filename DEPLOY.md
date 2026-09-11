# 墨记账 · 部署到 Supabase 一步一步来

全程大约 20 分钟。按顺序做，遇到报错直接翻最后一章的排查表。

---

## 先看这三条（能省你两小时）

| 坑              | 说明                                         | 对策                               |
| -------------- | ------------------------------------------ | -------------------------------- |
| 默认 SMTP 不发外部邮箱 | 不配置自定义 SMTP 时，Auth 只给「项目团队成员」邮箱发信，且每小时 2 封 | 个人自用：把你的邮箱加进团队；多人用：配自定义 SMTP     |
| 免费项目会自动暂停      | 7 天没有数据库活动就暂停，数据不丢，控制台点 Resume 即可恢复        | 日常记账不会触发；长期不用注意邮件通知              |
| anon key 敢放在前端 | 这是 Supabase 官方设计，安全边界在 RLS 策略              | 必须确保 4 张表都开着 RLS（schema.sql 已包含） |

---

## 第 1 步：注册 Supabase（2 分钟）

1. 打开 <https://supabase.com> ，点右上角 **Start your project**
2. 用 GitHub 或邮箱注册均可
3. 首次会让建一个 **Organization**（组织），名字随意，比如 `阿白`

> 免费档够用：500MB 数据库、5 万月活用户、2 个活跃项目。记账数据一年也就几 MB。

---

## 第 2 步：创建项目（3 分钟）

1. 进组织后点 **New project**
2. 填写：
   - **Name**：`moneybook`
   - **Database Password**：点 **Generate a password** 生成一串，**务必复制保存下来**（后面基本用不到，但丢了要重置项目）
   - **Region**：国内访问建议选 **Southeast Asia (Singapore)** 或 **Northeast Asia (Tokyo)**，延迟明显低于美区
   - **Plan**：Free
3. 点 **Create new project**，等待约 2 分钟初始化（期间会显示 Setting up project）

---

## 第 3 步：初始化数据库（2 分钟）

1. 左侧菜单点 **SQL Editor**
2. 点 **+ New query**
3. 打开本项目里的 `supabase/schema.sql`，全选复制，粘贴进 SQL 编辑器
4. 右下角点 **Run**（或按 Ctrl+Enter）
5. 看到 `Success. No rows returned` 就成功了

### 验证表建好了

左侧点 **Table Editor**，应该能看到 4 张表：`books`、`categories`、`records`、`budgets`。

### 验证 RLS 已开启（很重要）

在 SQL Editor 里新建查询，粘贴执行：

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

四张表的 `rowsecurity` 列必须全是 `true`。如果有 `false`，说明 RLS 没开，任何人拿到你的 anon key 就能读全部数据——务必查一下。

---

## 第 4 步：配置邮箱登录（5 分钟，最关键）

### 4.1 确认 Email 登录已启用

左侧 **Authentication** → **Sign In / Providers** → 找到 **Email**，确认是 **Enabled**。（默认就是开启的）

### 4.2 把你的邮箱加进白名单（个人自用，推荐先走这条路）

因为默认 SMTP 不给陌生邮箱发信，最简单的方法是把你的账号变成"团队成员"：

1. 点组织头像 → **Organization Settings** → **Team**
2. 点 **Invite member**，输入你要登录用的邮箱（比如自己的 Gmail）
3. 角色选 **Developer** 即可
4. 去邮箱里**接受邀请**（这步别忘）
5. 回来重试登录，就能收到魔法链接了

> 限制：每小时 2 封。自己用的话完全够。

### 4.3 配置自定义 SMTP（多人使用 / 想要更好体验时）

推荐 **Resend**，免费额度每月 3000 封：

1. 注册 <https://resend.com> ，验证域名（或先用它的 onboarding 域名测试）
2. 创建 API Key，复制下来（形如 `re_xxxxx`）
3. 回 Supabase：**Authentication** → **Emails** → **SMTP Settings**
4. 打开 **Enable Custom SMTP**，填：

| 项            | 值                  |
| ------------ | ------------------ |
| Host         | `smtp.resend.com`  |
| Host         | `smtp.resend.com`  |
| Port         | `465`              |
| Username     | `resend`           |
| Password     | `re_你的APIKey`      |
| Sender email | `你在Resend验证过的发信地址` |
| Sender name  | `墨记账`              |

1. 点 **Save**，然后到 **Authentication → Rate Limits** 把 `Emails sent` 调高（比如 30/小时）

> 国内 SMTP 也行：腾讯云 SES、阿里云邮件推送都可以，注意端口用 465 或 587。

---

## 第 5 步：本地联调（3 分钟）

在项目目录下：

```bash
cp .env.example .env.local
```

然后去 Supabase：**Project Settings** → **Data API**，复制两个值填进 `.env.local`：

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 两个别搞混：URL 是网址，anon key 是那串很长的 JWT。**不要**用 `service_role` key，那个能绕过 RLS，绝对不能放前端。

保存后重启开发服务器：

```bash
npm run dev
```

打开 <http://localhost:5173> ，此时页面顶部不再显示"演示模式"黄条，而是邮箱登录框。输入你在第 4 步加入白名单的邮箱 → 收到邮件 → 点链接 → 自动进首页。

**首次登录时会自动创建「日常账本」和 15 个默认分类**，去 Supabase **Table Editor** 里能看到 `books` 和 `categories` 各多出数据，就说明链路完全通了。

可以顺手记一两笔，再看 Table Editor 的 `records` 表有没有出现——数据库层验证比看 UI 更可靠。

---

## 第 6 步：部署前端上线（5 分钟）

前端是纯静态站点，放哪都行。推荐 Vercel（免费、自动 HTTPS、自动 CI）。

### 方式 A：用 Vercel 命令行（不用 GitHub，最快）

```bash
npx vercel@latest login
npx vercel@latest --prod
```

首次会问几个问题，一路回车用默认值即可（Vite 会被自动识别）。

部署完成后，**必须补环境变量**：

1. 打开返回的项目 URL 对应的 Vercel 项目页 → **Settings** → **Environment Variables**
2. 加两条：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（值同上）
3. 保存后到 **Deployments** 页面，点最新一条右侧 **⋯ → Redeploy**（环境变量改动需要重新构建才生效）

### 方式 B：GitHub + Vercel 网页

1. 把 `moneybook` 目录推到 GitHub 仓库（注意 `.env.local` 已被 .gitignore 忽略，不会泄露）
2. Vercel → **Add New** → **Project** → 导入该仓库
3. Framework 自动识别为 Vite，Build Command `npm run build`，Output Directory `dist`
4. Environment Variables 里加上面两个变量
5. Deploy

### 其他可选平台

| 平台               | 构建命令            | 输出目录   | 备注               |
| ---------------- | --------------- | ------ | ---------------- |
| Netlify          | `npm run build` | `dist` | 国内访问比 Vercel 稳一些 |
| Cloudflare Pages | `npm run build` | `dist` | 速度最好，需科学配置       |
| GitHub Pages     | `npm run build` | `dist` | 免费但国内较慢          |

---

## 第 7 步：回填线上域名（1 分钟，容易忘）

上线后必须回 Supabase 改认证回调地址，否则线上登录会失败：

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL** 改成你的正式域名，例如 `https://moneybook.vercel.app`
3. **Redirect URLs** 点 **Add URL**，加上 `https://moneybook.vercel.app/**`（两个星号不能少）

> 本地开发想同时保留：Redirect URLs 里加 `http://localhost:5173/**`，Site URL 只能有一个，用哪个环境就填哪个。

---

## 第 8 步：上线验收清单

在手机上打开正式域名，逐个确认：

- [ ] 页面能打开，输入邮箱能收到魔法链接
- [ ] 点链接后能进入首页（不是闪回登录页）
- [ ] 记一笔 → 刷新后数据还在
- [ ] 去 Supabase Table Editor 的 `records` 表能看到刚记的那条
- [ ] 手机浏览器"添加到主屏幕"后，图标正常、全屏打开无浏览器地址栏
- [ ] 换一个邮箱登录，看不到另一个账号的数据（RLS 生效）

---

## 故障排查表

| 现象                               | 原因                        | 解决                                          |
| -------------------------------- | ------------------------- | ------------------------------------------- |
| 报 `Email address not authorized` | 邮箱不在团队白名单                 | 回到第 4.2 步；或配 SMTP                           |
| 报 `Email rate limit exceeded`    | 默认 SMTP 2 封/小时            | 等一小时，或配自定义 SMTP                             |
| 点魔法链接后闪回登录页                      | Site URL 与实际域名不一致         | 第 7 步，注意有没有 `www` 前缀差异                      |
| 页面显示"这些方法均失败：Failed to fetch"    | env 变量没生效                 | Vercel 改完环境变量必须 Redeploy                    |
| 记了账刷新后消失                         | `.env.local` 没配好，其实还在演示模式 | 看页面顶部有没有黄条；检查变量名前缀是不是 `VITE_`               |
| 打开很慢 / 打不开                       | Vercel 域名在国内部分运营商不稳       | 换 Netlify，或绑定自己的域名                          |
| 隔了一周突然报连不上                       | 免费项目被自动暂停                 | Supabase 控制台进项目，点 **Resume project**，等 30 秒 |
| Table Editor 里能看到别人的数据           | RLS 没开                    | 跑第 3 步的验证 SQL，重跑 schema.sql                 |

---

## 日常维护

- **免费项目别休眠**：每天记一两笔就有数据库活动；长期不用留意 Supabase 的暂停提醒邮件
- **数据备份**：Table Editor 里每张表都可以导出 CSV；我们 App 里"我的 → 导出 CSV"也能随时导出账单
- **换 Supabase 之外的托管**：前端是纯静态的，`dist` 目录扔到任何静态托管都能跑，只需回填第 7 步的域名
