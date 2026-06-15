import { useState } from 'react'
import { apiClient } from '@/api/client'
import { characterApi } from '@/api/characterApi'
import { srdApi } from '@/api/srdApi'
import { useAuth } from '@/context/AuthContext'
import type { ApiError } from '@/types/api'

// ── 小工具 ────────────────────────────────────────────────────────────────────

interface TestResult {
  label: string
  status: number | 'NETWORK' | 'OK'
  body: unknown
  ts: string
}

function ResultBadge({ status }: { status: TestResult['status'] }) {
  if (status === 'OK' || (typeof status === 'number' && status < 300)) {
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-900/50 text-green-400">{status}</span>
  }
  if (status === 'NETWORK') {
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-400">NETWORK</span>
  }
  const color = status === 429 ? 'bg-orange-900/50 text-orange-300'
              : status === 401 ? 'bg-yellow-900/50 text-yellow-300'
              : status === 403 ? 'bg-red-900/50 text-red-300'
              : status === 400 ? 'bg-pink-900/50 text-pink-300'
              : 'bg-red-900/50 text-red-300'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{status}</span>
}

function ScenarioCard({
  title, desc, expectedCode, expectedNote, children, results, onClear,
}: {
  title: string; desc: string; expectedCode: string; expectedNote?: string
  children: React.ReactNode
  results: TestResult[]; onClear: () => void
}) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 text-sm">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-violet-300 font-mono">{expectedCode}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">{desc}</div>
        {expectedNote && <div className="text-xs text-amber-400/70 mt-0.5">⚠️ {expectedNote}</div>}
      </div>

      <div className="flex gap-2 flex-wrap">{children}</div>

      {results.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">結果</div>
            <button onClick={onClear} className="text-xs text-slate-600 hover:text-slate-400">清除</button>
          </div>
          {results.map((r, i) => (
            <div key={i} className="bg-slate-900 rounded p-2 space-y-1">
              <div className="flex items-center gap-2">
                <ResultBadge status={r.status} />
                <span className="text-xs text-slate-400">{r.label}</span>
                <span className="text-xs text-slate-600 ml-auto">{r.ts}</span>
              </div>
              <pre className="text-xs text-blue-300 overflow-auto max-h-32">
                {JSON.stringify(r.body, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Btn({
  onClick, disabled, variant = 'primary', children,
}: {
  onClick?: () => void; disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; children: React.ReactNode
}) {
  const base = 'px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40'
  const styles = {
    primary:   'bg-violet-600 hover:bg-violet-500 text-white',
    secondary: 'bg-blue-700 hover:bg-blue-600 text-white',
    ghost:     'bg-slate-700 hover:bg-slate-600 text-slate-300',
    danger:    'bg-red-800 hover:bg-red-700 text-white',
  }
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>{children}</button>
}

function ts() { return new Date().toLocaleTimeString() }

async function capture(label: string, fn: () => Promise<unknown>): Promise<TestResult> {
  try {
    const data = await fn()
    return { label, status: 'OK', body: data, ts: ts() }
  } catch (e) {
    const err = e as ApiError
    return {
      label, ts: ts(),
      status: err.status ?? 'NETWORK',
      body: { code: err.code, message: err.message, status: err.status },
    }
  }
}

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function ErrorScenariosPage() {
  const { isAuthenticated } = useAuth()

  // Per-scenario results
  const [r429, setR429]   = useState<TestResult[]>([])
  const [r401, setR401]   = useState<TestResult[]>([])
  const [r400, setR400]   = useState<TestResult[]>([])
  const [r403, setR403]   = useState<TestResult[]>([])
  const [r404, setR404]   = useState<TestResult[]>([])

  // 429 — flood SRD endpoint (public, low limit in prod / higher in dev)
  const [flooding, setFlooding] = useState(false)
  async function flood429() {
    setFlooding(true); setR429([])
    const results: TestResult[] = []
    for (let i = 0; i < 15; i++) {
      const r = await capture(`Request #${i + 1}`, () => srdApi.listRaces('5.2', 'en'))
      results.push(r)
      setR429([...results])
      if (r.status === 429) break
    }
    setFlooding(false)
  }

  // 401 — call protected endpoint with no token / bad token
  async function triggerNoToken() {
    // Remove auth header for this one call by using raw axios
    const r = await capture('No Bearer token', () =>
      apiClient.get('/api/v1/characters', {
        headers: { Authorization: undefined },
        // @ts-ignore override interceptor
        _skipAuth: true,
      }).then(r => r.data)
    )
    setR401(prev => [r, ...prev])
  }

  async function triggerBadToken() {
    const r = await capture('Invalid Bearer token', () =>
      apiClient.get('/api/v1/characters', {
        headers: { Authorization: 'Bearer invalid.jwt.token' },
      }).then(r => r.data)
    )
    setR401(prev => [r, ...prev])
  }

  // 400 — send invalid body to register
  async function trigger400EmptyName() {
    const r = await capture('Register empty email', () =>
      apiClient.post('/api/v1/auth/register', { email: '', password: 'pass123', nickname: '' }).then(r => r.data)
    )
    setR400(prev => [r, ...prev])
  }

  async function trigger400ShortPw() {
    const r = await capture('Register password too short (2 chars)', () =>
      apiClient.post('/api/v1/auth/register', { email: 'test@test.com', password: 'ab', nickname: 'Test' }).then(r => r.data)
    )
    setR400(prev => [r, ...prev])
  }

  async function trigger400NegativeHp() {
    const r = await capture('LevelUp negative hpIncrease', () =>
      apiClient.post('/api/v1/characters/00000000-0000-0000-0000-000000000000/level-up', {
        hpIncrease: -1, asiChoice: null,
      }).then(r => r.data)
    )
    setR400(prev => [r, ...prev])
  }

  // 403 — access another user's character (need a known char ID from a different account)
  async function trigger403WrongOwner() {
    const r = await capture('Access non-owned character UUID', () =>
      // Use a random UUID that won't belong to this user
      characterApi.get('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    )
    setR403(prev => [r, ...prev])
  }

  // 404 — get non-existent resource
  async function trigger404() {
    const r = await capture('GET non-existent character', () =>
      characterApi.get('00000000-0000-0000-0000-000000000001')
    )
    setR404(prev => [r, ...prev])
  }

  async function trigger404Log() {
    const r = await capture('GET non-existent log entry', () =>
      apiClient.get('/api/v1/characters/00000000-0000-0000-0000-000000000001/logs/00000000-0000-0000-0000-000000000002').then(r => r.data)
    )
    setR404(prev => [r, ...prev])
  }

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-100">
          🧪 錯誤情境 & Rate Limiting
          <span className="text-sm font-normal text-slate-400 ml-2">WBS 2.10</span>
        </h1>
      </div>

      {!isAuthenticated && (
        <div className="bg-amber-900/30 border border-amber-700 rounded p-3 text-sm text-amber-300">
          ⚠️ 未登入 — 401 相關測試需要先登入，Rate Limiting 和 400 測試可直接執行
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 pb-4">

        {/* 429 Rate Limiting */}
        <ScenarioCard
          title="429 Rate Limiting"
          desc="快速連打 GET /srd/races，超出限速後應回傳 429 + Retry-After header"
          expectedCode="429"
          expectedNote="Dev 環境 capacity 設為 300，需連打超過 300 次才觸發。Prod 環境為 60/min。"
          results={r429}
          onClear={() => setR429([])}
        >
          <Btn onClick={flood429} disabled={flooding}>
            {flooding ? '連打中…' : '🔥 連打 15 次 GET /srd/races'}
          </Btn>
        </ScenarioCard>

        {/* 401 Unauthorized */}
        <ScenarioCard
          title="401 Unauthorized"
          desc="使用無效或缺少的 Bearer Token 呼叫受保護端點，應回傳 401 + code=AUTH_TOKEN_INVALID"
          expectedCode="401"
          results={r401}
          onClear={() => setR401([])}
        >
          <Btn variant="secondary" onClick={triggerNoToken}>無 Token（移除 Authorization header）</Btn>
          <Btn variant="secondary" onClick={triggerBadToken}>無效 JWT Token</Btn>
        </ScenarioCard>

        {/* 400 Validation */}
        <ScenarioCard
          title="400 Validation Error"
          desc="送出不符合 Bean Validation 規則的請求，應回傳 400 + code=VALIDATION_FAILED + errors 陣列"
          expectedCode="400"
          results={r400}
          onClear={() => setR400([])}
        >
          <Btn variant="ghost" onClick={trigger400EmptyName}>空 email 註冊</Btn>
          <Btn variant="ghost" onClick={trigger400ShortPw}>密碼過短（2 字元）</Btn>
          <Btn variant="ghost" onClick={trigger400NegativeHp}>hpIncrease = -1</Btn>
        </ScenarioCard>

        {/* 403 Forbidden */}
        <ScenarioCard
          title="403 Forbidden / 404 Not Found"
          desc="存取不屬於自己的角色或不存在的資源。後端可能回傳 403（有該資源但無權限）或 404（找不到）"
          expectedCode="403 / 404"
          results={r403}
          onClear={() => setR403([])}
        >
          <Btn variant="danger" onClick={trigger403WrongOwner} disabled={!isAuthenticated}>
            存取隨機 UUID 角色（403 或 404）
          </Btn>
        </ScenarioCard>

        {/* 404 */}
        <ScenarioCard
          title="404 Not Found"
          desc="查詢不存在的資源 UUID，應回傳 404"
          expectedCode="404"
          results={r404}
          onClear={() => setR404([])}
        >
          <Btn variant="ghost" onClick={trigger404} disabled={!isAuthenticated}>
            GET /characters/00000000…0001
          </Btn>
          <Btn variant="ghost" onClick={trigger404Log} disabled={!isAuthenticated}>
            GET /characters/{'{…}'}/logs/00000000…0002
          </Btn>
        </ScenarioCard>

      </div>
    </div>
  )
}
