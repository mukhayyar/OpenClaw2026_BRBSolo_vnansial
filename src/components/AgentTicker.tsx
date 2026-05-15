const ITEMS = [
  'Powered by AI Agents',
  'SumoPod · Tool Calling Active',
  'OJK Demo Lookup',
  'Waspada Investasi Lookup',
  'Autonomous Loop Ready',
  'Financial Guardian Protocol',
]

export default function AgentTicker() {
  const doubled = [...ITEMS, ...ITEMS]
  return (
    <div className="border-b border-white/5 bg-black/30 overflow-hidden py-1.5">
      <div className="agent-ticker-track gap-8 px-4">
        {doubled.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="flex items-center gap-2 text-[11px] font-medium text-slate-500 whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-pulse" />
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
