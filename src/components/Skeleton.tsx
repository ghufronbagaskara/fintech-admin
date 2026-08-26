export function SkelLine({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return <div className="skel" style={{ width, height }} />
}

export function SkelStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="card-row">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card" key={i}>
          <SkelLine width={70} height={11} />
          <div style={{ height: 8 }} />
          <SkelLine width={110} height={22} />
        </div>
      ))}
    </div>
  )
}

export function SkelRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <SkelLine width={c === 0 ? '70%' : '50%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function SkelPanel({ height = 200 }: { height?: number }) {
  return (
    <div className="panel">
      <SkelLine width={160} height={16} />
      <div style={{ height: 16 }} />
      <div className="skel" style={{ width: '100%', height }} />
    </div>
  )
}
