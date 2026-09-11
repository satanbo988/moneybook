import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  demo?: boolean
  onEnterDemo?: () => void
}

export default function Auth({ demo = false, onEnterDemo }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-700 text-white text-3xl font-bold mb-4">
            墨
          </div>
          <h1 className="text-2xl font-bold text-slate-800">墨记账</h1>
          <p className="text-sm text-slate-500 mt-1">3 秒记一笔，钱都花哪儿了一清二楚</p>
        </div>

        {demo ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-slate-800 font-medium mb-2">本地演示版</div>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              当前没有连接 Supabase，已自动生成近 3 个月的示例账单，
              数据保存在这台电脑的浏览器里，所有功能都可以正常体验。
            </p>
            <button
              onClick={onEnterDemo}
              className="w-full py-3 rounded-xl bg-teal-700 text-white font-medium hover:bg-teal-800 active:scale-[0.98] transition"
            >
              立即体验
            </button>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              想用真实云同步？把 .env.local 里的 Supabase URL 和 anon key 填好，
              再执行 supabase/schema.sql 即可切换到云端账号登录。
            </p>
          </div>
        ) : sent ? (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
            <div className="text-teal-700 font-medium mb-2">登录链接已发送</div>
            <p className="text-sm text-slate-600">
              请查收 <span className="font-medium">{email}</span> 的收件箱，
              点击邮件中的链接即可完成登录。
            </p>
            <button onClick={() => setSent(false)} className="mt-4 text-sm text-teal-700 underline">
              换个邮箱重新发送
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入你的邮箱"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-base"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-700 text-white font-medium text-base hover:bg-teal-800 active:scale-[0.98] transition disabled:opacity-60"
            >
              {loading ? '发送中…' : '发送登录链接'}
            </button>
            <p className="text-xs text-slate-400 text-center">免密码登录，首次使用自动注册</p>
          </form>
        )}
      </div>
    </div>
  )
}
