import { useState } from 'react'
import { useRequestLog, type RequestLogEntry } from '@/dev/RequestLogContext'

function statusColor(status?: number) {
  if (!status) return 'text-slate-400'
  if (status < 300) return 'text-green-400'
  if (status < 400) return 'text-yellow-400'
  return 'text-red-400'
}

function LogEntry({ entry }: { entry: RequestLogEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-slate-700 text-xs">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2"
      >
        <span className="font-mono text-violet-400 w-12 flex-shrink-0">{entry.method}</span>
        <span className={`w-10 flex-shrink-0 font-mono ${statusColor(entry.status)}`}>
          {entry.status ?? '…'}
        </span>
        <span className="text-slate-300 truncate flex-1">{entry.url.replace('http://localhost:8080', '')}</span>
        {entry.durationMs !== undefined && (
          <span className="text-slate-500 flex-shrink-0">{entry.durationMs}ms</span>
        )}
        <span className="text-slate-500 flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 bg-slate-800/50">
          <div className="text-slate-400 text-xs">{entry.timestamp}</div>

          {entry.requestBody !== undefined && (
            <div>
              <div className="text-slate-500 mb-1">Request Body</div>
              <pre className="bg-slate-900 rounded p-2 text-green-300 overflow-x-auto text-xs max-h-40">
                {JSON.stringify(entry.requestBody, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <div className="text-slate-500 mb-1">Response</div>
            <pre className={`bg-slate-900 rounded p-2 overflow-x-auto text-xs max-h-48 ${entry.error ? 'text-red-300' : 'text-blue-300'}`}>
              {entry.error
                ? entry.error + '\n' + JSON.stringify(entry.responseBody, null, 2)
                : JSON.stringify(entry.responseBody, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RequestLogPanel() {
  const { logs, clearLogs } = useRequestLog()
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-8 flex-shrink-0 bg-slate-800 border-l border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        title="展開 Request Log"
      >
        <span style={{ writingMode: 'vertical-rl' }} className="text-xs">
          Logs ({logs.length})
        </span>
      </button>
    )
  }

  return (
    <aside className="w-80 flex-shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-300">
          Request Log <span className="text-slate-500">({logs.length})</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={clearLogs}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-700"
          >
            Clear
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-700"
          >
            ◀
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-xs text-center py-8">尚無請求</div>
        ) : (
          logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </aside>
  )
}
