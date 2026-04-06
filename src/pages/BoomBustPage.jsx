import { useState, useEffect, useMemo } from 'react'
import { Container, Tabs, Tab, Card, Badge, Spinner, Row, Col, Form } from 'react-bootstrap'
import { loadAllData, getPlayerIndex } from '../services/nflApi.js'
import AppPagination from '../components/AppPagination.jsx'

const POSITION_COLORS = {
  QB: 'danger', RB: 'success', WR: 'primary', TE: 'warning', K: 'secondary',
}

const PAGE_SIZE = 10

function interpolateColor(index, total, type) {
  const t = total <= 1 ? 0 : index / (total - 1)
  let r, g, b
  if (type === 'boom') {
    // Bootstrap success #198754 → success-subtle #d1e7dd
    r = Math.round(25  + t * (209 - 25))
    g = Math.round(135 + t * (231 - 135))
    b = Math.round(84  + t * (221 - 84))
  } else {
    // Bootstrap danger #dc3545 → danger-subtle #f8d7da
    r = Math.round(220 + t * (248 - 220))
    g = Math.round(53  + t * (215 - 53))
    b = Math.round(69  + t * (218 - 69))
  }
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: t < 0.45 ? '#fff' : '#212529',
  }
}

function BoomBustCard({ player, indexInFull, total, type, rank }) {
  const headerStyle = interpolateColor(indexInFull, total, type)
  const diff = player.actual.fantasyPoints - player.projected.fantasyPoints
  const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)

  return (
    <Card className="shadow-sm mb-3">
      <Card.Header style={headerStyle} className="py-2 px-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold me-1" style={{ fontSize: '1rem', opacity: 0.8 }}>#{rank}</span>
          <Badge bg={POSITION_COLORS[player.position] ?? 'secondary'}>{player.position}</Badge>
          <span className="fw-semibold">{player.name}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>{player.team}</span>
        </div>
        <span className="fw-bold">{diffStr} pts</span>
      </Card.Header>
      <Card.Body className="py-2 px-3" style={{ fontSize: '0.85rem' }}>
        <div className="d-flex gap-4">
          <div>
            <div className="text-muted">Actual</div>
            <div className="fw-semibold">{player.actual.fantasyPoints.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-muted">Projected</div>
            <div className="fw-semibold">{player.projected.fantasyPoints.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-muted">Difference</div>
            <div className={`fw-bold ${diff >= 0 ? 'text-success' : 'text-danger'}`}>{diffStr}</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

function FilterBar({ position, team, allTeams, onPositionChange, onTeamChange }) {
  return (
    <Row className="g-2 mb-3">
      <Col xs={6} sm={4} md={3}>
        <Form.Select size="sm" value={position} onChange={e => onPositionChange(e.target.value)}>
          <option value="">All Positions</option>
          {['QB', 'RB', 'WR', 'TE', 'K'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Form.Select>
      </Col>
      <Col xs={6} sm={4} md={3}>
        <Form.Select size="sm" value={team} onChange={e => onTeamChange(e.target.value)}>
          <option value="">All Teams</option>
          {allTeams.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Form.Select>
      </Col>
    </Row>
  )
}


function BoomBustList({ list, type, position, team, allTeams, onPositionChange, onTeamChange }) {
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return list.filter(p =>
      (!position || p.position === position) &&
      (!team || p.team === team)
    )
  }, [list, position, team])

  // Reset to page 1 when filters change
  useMemo(() => { setPage(1) }, [position, team])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <FilterBar
        position={position}
        team={team}
        allTeams={allTeams}
        onPositionChange={onPositionChange}
        onTeamChange={onTeamChange}
      />
      <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
        {type === 'boom'
          ? <>Players who scored the most points <strong>above</strong> their preseason projection.</>
          : <>Players who scored the most points <strong>below</strong> their preseason projection.</>}
        {filtered.length !== list.length && (
          <span className="ms-2 text-secondary">({filtered.length} of {list.length} players)</span>
        )}
      </p>
      <Row>
        <Col xs={12} lg={8}>
          {pageSlice.length === 0 ? (
            <p className="text-muted fst-italic">No players match the selected filters.</p>
          ) : (
            pageSlice.map((player, i) => {
              const indexInFull = (page - 1) * PAGE_SIZE + i
              return (
                <BoomBustCard
                  key={player.playerID}
                  player={player}
                  indexInFull={indexInFull}
                  total={filtered.length}
                  type={type}
                  rank={indexInFull + 1}
                />
              )
            })
          )}
          <AppPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Col>
      </Row>
    </>
  )
}

export default function BoomBustPage() {
  const [dataReady, setDataReady] = useState(() => getPlayerIndex() !== null)
  const [position, setPosition] = useState('')
  const [team, setTeam] = useState('')

  useEffect(() => {
    if (dataReady) return
    loadAllData().then(() => setDataReady(true)).catch(() => {})
  }, [dataReady])

  const { boomList, bustList, allTeams } = useMemo(() => {
    if (!dataReady) return { boomList: [], bustList: [], allTeams: [] }
    const index = getPlayerIndex()
    const players = []
    const teamSet = new Set()
    for (const player of index.values()) {
      if (!player.projected) continue
      players.push(player)
      teamSet.add(player.team)
    }
    const sorted = [...players].sort(
      (a, b) =>
        (b.actual.fantasyPoints - b.projected.fantasyPoints) -
        (a.actual.fantasyPoints - a.projected.fantasyPoints)
    )
    return {
      boomList: sorted.filter(p => p.actual.fantasyPoints - p.projected.fantasyPoints >= 0),
      bustList: [...sorted].reverse().filter(p => p.actual.fantasyPoints - p.projected.fantasyPoints < 0),
      allTeams: [...teamSet].sort(),
    }
  }, [dataReady])

  if (!dataReady) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading player data…</p>
      </Container>
    )
  }

  const sharedFilterProps = { position, team, allTeams, onPositionChange: setPosition, onTeamChange: setTeam }

  return (
    <Container className="py-4">
      <h5 className="fw-bold mb-4">Boom / Bust — 2025 NFL Season</h5>
      <Tabs defaultActiveKey="boom" className="mb-3" onSelect={() => { setPosition(''); setTeam('') }}>
        <Tab eventKey="boom" title="💥 Boom">
          <BoomBustList list={boomList} type="boom" {...sharedFilterProps} />
        </Tab>
        <Tab eventKey="bust" title="💀 Bust">
          <BoomBustList list={bustList} type="bust" {...sharedFilterProps} />
        </Tab>
      </Tabs>
    </Container>
  )
}
