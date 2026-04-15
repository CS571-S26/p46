import { useState, useEffect, useMemo } from 'react'
import { Container, Tabs, Tab, Card, Badge, Spinner, Row, Col, Form, ButtonGroup, Button } from 'react-bootstrap'
import { loadAllData, getPlayerIndex } from '../services/nflApi.js'
import AppPagination from '../components/AppPagination.jsx'
import PlayerStatsModal from '../components/PlayerStatsModal.jsx'

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

function BoomBustCard({ player, indexInFull, total, type, rank, scoringKey }) {
  const [showModal, setShowModal] = useState(false)
  const headerStyle = interpolateColor(indexInFull, total, type)
  const actual = player.actual[scoringKey] ?? 0
  const projected = player.projected[scoringKey] ?? 0
  const diff = actual - projected
  const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
  const scoringLabel = scoringKey === 'fantasyPointsPPR' ? 'PPR' : '½ PPR'

  return (
    <>
      <Card className="shadow-sm mb-3 clickable-card" onClick={() => setShowModal(true)}>
        <Card.Header style={headerStyle} className="py-2 px-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold me-1" style={{ fontSize: '1rem', opacity: 0.8 }}>#{rank}</span>
            <Badge bg={POSITION_COLORS[player.position] ?? 'secondary'}>{player.position}</Badge>
            <span className="fw-semibold">{player.name}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>{player.team}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>{player.played} GP</span>
          </div>
          <span className="fw-bold">{diffStr} pts</span>
        </Card.Header>
        <Card.Body className="py-2 px-3" style={{ fontSize: '0.85rem' }}>
          <div className="d-flex gap-4">
            <div>
              <div className="text-muted">Actual ({scoringLabel})</div>
              <div className="fw-semibold">{actual.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-muted">Projected ({scoringLabel})</div>
              <div className="fw-semibold">{projected.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-muted">Difference</div>
              <div className={`fw-bold ${diff >= 0 ? 'text-success' : 'text-danger'}`}>{diffStr}</div>
            </div>
          </div>
        </Card.Body>
      </Card>
      <PlayerStatsModal player={player} show={showModal} onHide={() => setShowModal(false)} />
    </>
  )
}

function FilterBar({ position, team, allTeams, minGames, maxGames, onPositionChange, onTeamChange, onMinGamesChange }) {
  return (
    <Row className="g-2 mb-3 align-items-center">
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
      <Col xs={12} sm={4} md={4}>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted text-nowrap" style={{ fontSize: '0.82rem' }}>Min GP: <strong>{minGames}</strong></span>
          <Form.Range
            min={1}
            max={maxGames}
            value={minGames}
            onChange={e => onMinGamesChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>{maxGames}</span>
        </div>
      </Col>
    </Row>
  )
}


function BoomBustList({ list, type, position, team, allTeams, minGames, maxGames, scoringKey, onPositionChange, onTeamChange, onMinGamesChange }) {
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return list.filter(p =>
      (!position || p.position === position) &&
      (!team || p.team === team) &&
      p.played >= minGames
    )
  }, [list, position, team, minGames])

  // Reset to page 1 when filters change
  useMemo(() => { setPage(1) }, [position, team, minGames])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <FilterBar
        position={position}
        team={team}
        allTeams={allTeams}
        minGames={minGames}
        maxGames={maxGames}
        onPositionChange={onPositionChange}
        onTeamChange={onTeamChange}
        onMinGamesChange={onMinGamesChange}
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
                  scoringKey={scoringKey}
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
  const [scoringMode, setScoringMode] = useState('ppr')
  const [position, setPosition] = useState('')
  const [team, setTeam] = useState('')
  const [minGames, setMinGames] = useState(1)

  useEffect(() => {
    if (dataReady) return
    loadAllData().then(() => setDataReady(true)).catch(() => {})
  }, [dataReady])

  const scoringKey = scoringMode === 'ppr' ? 'fantasyPointsPPR' : 'fantasyPoints'

  const { boomList, bustList, allTeams, maxGames } = useMemo(() => {
    if (!dataReady) return { boomList: [], bustList: [], allTeams: [], maxGames: 17 }
    const index = getPlayerIndex()
    const players = []
    const teamSet = new Set()
    const maxG = 17
    for (const player of index.values()) {
      if (!player.projected) continue
      players.push(player)
      teamSet.add(player.team)
    }
    const sorted = [...players].sort(
      (a, b) =>
        (b.actual[scoringKey] - b.projected[scoringKey]) -
        (a.actual[scoringKey] - a.projected[scoringKey])
    )
    return {
      boomList: sorted.filter(p => p.actual[scoringKey] - p.projected[scoringKey] >= 0),
      bustList: [...sorted].reverse().filter(p => p.actual[scoringKey] - p.projected[scoringKey] < 0),
      allTeams: [...teamSet].sort(),
      maxGames: maxG,
    }
  }, [dataReady, scoringKey])

  if (!dataReady) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading player data…</p>
      </Container>
    )
  }

  const sharedFilterProps = {
    position, team, allTeams, minGames, maxGames, scoringKey,
    onPositionChange: setPosition,
    onTeamChange: setTeam,
    onMinGamesChange: setMinGames,
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Boom / Bust — 2025 NFL Season</h5>
        <ButtonGroup size="sm">
          <Button
            variant={scoringMode === 'ppr' ? 'success' : 'outline-success'}
            onClick={() => setScoringMode('ppr')}
          >PPR</Button>
          <Button
            variant={scoringMode === 'half' ? 'success' : 'outline-success'}
            onClick={() => setScoringMode('half')}
          >½ PPR</Button>
        </ButtonGroup>
      </div>
      <Tabs defaultActiveKey="boom" className="mb-3" onSelect={() => { setPosition(''); setTeam(''); setMinGames(1) }}>
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
