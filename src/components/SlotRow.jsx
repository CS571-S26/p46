import { Button } from 'react-bootstrap'

export default function SlotRow({ pos, count, onChange }) {
  return (
    <tr>
      <td className="fw-semibold align-middle">{pos.label}</td>
      <td className="text-center align-middle" style={{ width: '120px' }}>
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            aria-label={`Decrease ${pos.label} slots`}
            onClick={() => onChange(pos.key, count - 1)}
            disabled={count <= pos.min}
          >−</Button>
          <span className="fs-5 fw-bold" style={{ minWidth: '1.5rem', textAlign: 'center' }} aria-live="polite">{count}</span>
          <Button
            variant="outline-secondary"
            size="sm"
            aria-label={`Increase ${pos.label} slots`}
            onClick={() => onChange(pos.key, count + 1)}
            disabled={count >= pos.max}
          >+</Button>
        </div>
      </td>
    </tr>
  )
}
