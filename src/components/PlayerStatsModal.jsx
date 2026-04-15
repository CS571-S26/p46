import { Modal, Badge, ListGroup } from 'react-bootstrap'

const POSITION_COLORS = {
  QB: 'danger', RB: 'success', WR: 'primary', TE: 'warning', K: 'secondary', FLEX: 'info',
}

const STAT_ROWS = [
  { key: 'fantasyPoints',        label: 'Fantasy Pts (Std)',  positions: null },
  { key: 'fantasyPointsPPR',     label: 'Fantasy Pts (PPR)',  positions: null },
  { key: 'passingYards',         label: 'Passing Yards',      positions: ['QB'] },
  { key: 'passingTouchdowns',    label: 'Passing TDs',        positions: ['QB'] },
  { key: 'passingInterceptions', label: 'Interceptions',      positions: ['QB'] },
  { key: 'rushingYards',         label: 'Rushing Yards',      positions: ['QB', 'RB', 'WR', 'TE'] },
  { key: 'rushingTouchdowns',    label: 'Rushing TDs',        positions: ['QB', 'RB', 'WR', 'TE'] },
  { key: 'receivingYards',       label: 'Receiving Yards',    positions: ['RB', 'WR', 'TE'] },
  { key: 'receivingTouchdowns',  label: 'Receiving TDs',      positions: ['RB', 'WR', 'TE'] },
]

function StatRow({ label, actual, projected }) {
  const a = actual ?? 0
  const p = projected ?? 0
  if (a === 0 && p === 0) return null
  const diff = a - p
  const diffColor = diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : 'text-muted'
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
  return (
    <ListGroup.Item className="px-3 py-2" style={{ fontSize: '0.85rem' }}>
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-muted">{label}</span>
        <div className="d-flex gap-3 align-items-center">
          <span>
            <strong>{a.toFixed(1)}</strong>
            <small className="text-muted ms-1">actual</small>
          </span>
          <span>
            {p.toFixed(1)}
            <small className="text-muted ms-1">proj</small>
          </span>
          <span className={`fw-semibold ${diffColor}`} style={{ minWidth: '3.5rem', textAlign: 'right' }}>
            {diffStr}
          </span>
        </div>
      </div>
    </ListGroup.Item>
  )
}

export default function PlayerStatsModal({ player, show, onHide }) {
  if (!player) return null
  const { name, team, number, position, played, actual, projected } = player
  const pos = position

  const visibleRows = STAT_ROWS.filter(row => {
    if (row.positions && !row.positions.includes(pos)) return false
    const a = actual?.[row.key] ?? 0
    const p = projected?.[row.key] ?? 0
    return a !== 0 || p !== 0
  })

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="py-2 px-3">
        <Modal.Title style={{ fontSize: '1rem' }}>
          <Badge bg={POSITION_COLORS[pos] ?? 'secondary'} className="me-2">{pos}</Badge>
          <span className="fw-bold">{name}</span>
          <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>{team} · #{number}</span>
          <span className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>{played} GP</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {visibleRows.length === 0 ? (
          <p className="text-muted text-center py-4">No stat data available.</p>
        ) : (
          <ListGroup variant="flush">
            {visibleRows.map(row => (
              <StatRow
                key={row.key}
                label={row.label}
                actual={actual?.[row.key]}
                projected={projected?.[row.key]}
              />
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  )
}
