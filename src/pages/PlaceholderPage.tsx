interface Props {
  title: string
  wbs: string
}

export default function PlaceholderPage({ title, wbs }: Props) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-2">
        <div className="text-4xl">🚧</div>
        <div className="text-xl font-semibold text-slate-200">{title}</div>
        <div className="text-sm text-slate-400">WBS {wbs} — 待實作</div>
      </div>
    </div>
  )
}
