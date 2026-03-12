import { Card, Badge, Button } from 'react-bootstrap'

const POSITION_COLORS = {
  QB: 'danger',
  RB: 'success',
  WR: 'primary',
  TE: 'warning',
  K: 'secondary',
  FLEX: 'info',
}

export default function PlayerCard({ player, actionLabel, actionDisabled, onAction }) {
  const { name, team, number, position } = player
  return (
    <Card className="shadow-sm">
      <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
        <div>
          <Badge bg={POSITION_COLORS[position] ?? 'secondary'} className="me-2">{position}</Badge>
          <span className="fw-semibold">{name}</span>
          <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>{team} · #{number}</span>
        </div>
        <Button
          variant={actionDisabled ? 'outline-secondary' : 'outline-success'}
          size="sm"
          disabled={actionDisabled}
          onClick={onAction}
        >{actionLabel}</Button>
      </Card.Body>
    </Card>
  )
}
