import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Container, Row, Table } from 'react-bootstrap'
import SlotRow from '../components/SlotRow.jsx'
import useSessionState from '../hooks/useSessionState.js'

const POSITIONS = [
  { key: 'QB',   label: 'QB',   min: 0, max: 4 },
  { key: 'RB',   label: 'RB',   min: 0, max: 6 },
  { key: 'WR',   label: 'WR',   min: 0, max: 6 },
  { key: 'TE',   label: 'TE',   min: 0, max: 4 },
  { key: 'FLEX', label: 'FLEX', min: 0, max: 6 },
  { key: 'K',    label: 'K',    min: 0, max: 2 },
]

const DEFAULTS = { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, K: 1 }

export default function HomePage() {
  const [roster, setRoster] = useSessionState('rosterFormat', DEFAULTS)
  const navigate = useNavigate()

  const totalSlots = Object.values(roster).reduce((a, b) => a + b, 0)

  function handleChange(key, val) {
    setRoster(prev => ({ ...prev, [key]: val }))
  }

  function handleReset() {
    setRoster(DEFAULTS)
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white text-center py-3">
              <h4 className="mb-0">Build Your Roster Format</h4>
              <small className="opacity-75">Choose how many of each position to include</small>
            </Card.Header>
            <Card.Body className="p-0">
              <Table className="mb-0" hover>
                <thead className="table-light">
                  <tr>
                    <th>Position</th>
                    <th className="text-center">Slots</th>
                  </tr>
                </thead>
                <tbody>
                  {POSITIONS.map(pos => (
                    <SlotRow
                      key={pos.key}
                      pos={pos}
                      count={roster[pos.key]}
                      onChange={handleChange}
                    />
                  ))}
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-between align-items-center">
              <span className="text-muted">Total slots: <strong>{totalSlots}</strong></span>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button variant="success" disabled={totalSlots === 0} onClick={() => navigate('/build')}>
                  Build My Team →
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
