import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { characterApi } from '@/features/characters/characterApi'
import { Avatar } from '@/shared/ui/Avatar'

// 角色清單（6.2 正式產品）：react-query 直接 API；卡片 + 頭像 fallback。
// 清單端點不回 portraitData（避免膨脹），故卡片頭像以首字母呈現；詳情頁才顯圖。
export default function CharactersListPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['characters'],
    queryFn: () => characterApi.list(),
  })
  const chars = data?.content ?? []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, letterSpacing: 3, color: 'var(--text)', margin: 0 }}>
          我的角色
        </h1>
        <button onClick={() => navigate('/characters/new')} style={{
          border: '1px solid var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent)',
          borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 13, letterSpacing: 1,
        }}>+ 建立角色</button>
      </div>

      {isLoading && <p style={{ color: 'var(--muted)' }}>載入中…</p>}
      {error && <p style={{ color: 'var(--danger)' }}>載入失敗，請稍後再試。</p>}
      {!isLoading && !error && chars.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>還沒有角色。</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {chars.map((c) => {
          const sub = [c.raceSlug, c.classSlug].filter(Boolean).join(' · ')
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/characters/${c.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
                background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 4,
                padding: 16, color: 'var(--text)',
              }}
            >
              <Avatar name={c.name} portraitData={c.portraitData} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, letterSpacing: 1 }}>{c.name}</div>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>
                  {sub ? `${sub} · ` : ''}Lv {c.totalLevel}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  HP {c.hpCurrent}/{c.hpMax} · AC {c.armorClass}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
