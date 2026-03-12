import { useState, useEffect, useMemo } from 'react'
import { Container, Row, Col, Card, Badge, ButtonGroup, Button, Spinner, ListGroup } from 'react-bootstrap'
import { loadAllData, getPlayerIndex } from '../services/nflApi.js'
import useSessionState from '../hooks/useSessionState.js'

const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K']
const DEFAULT_ROSTER = { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, K: 1 }
const EMPTY_TEAM = { QB: [], RB: [], WR: [], TE: [], FLEX: [], K: [] }

function StatRow({ label, actual, projected }) {
  if (actual == null && projected == null) return null
  const diff = (actual ?? 0) - (projected ?? 0)
  const diffColor = diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : 'text-muted'
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
  return (
    <ListGroup.Item className="px-3 py-1" style={{ fontSize: '0.85rem' }}>
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-muted">{label}</span>
        <div className="d-flex gap-3 align-items-center">
          <span><strong>{actual != null ? actual.toFixed(1) : '—'}</strong> <small className="text-muted">actual</small></span>
          <span>{projected != null ? projected.toFixed(1) : '—'} <small className="text-muted">proj</small></span>
          <span className={`fw-semibold ${diffColor}`} style={{ minWidth: '3.5rem', textAlign: 'right' }}>{diffStr}</span>
        </div>
      </div>
    </ListGroup.Item>
  )
}

function PlayerAnalysisCard({ player, slot, scoringKey }) {
  const { actual, projected, name, team, number, position } = player
  const pos = slot === 'FLEX' ? `${position} (FLEX)` : position

  const fpActual = actual?.[scoringKey] ?? null
  const fpProjected = projected?.[scoringKey] ?? null
  const fpDiff = fpActual != null && fpProjected != null ? fpActual - fpProjected : null

  const isQB = position === 'QB'
  const isSkill = ['RB', 'WR', 'TE'].includes(position) || position === 'QB'

  const POSITION_COLORS = { QB: 'danger', RB: 'success', WR: 'primary', TE: 'warning', K: 'secondary', FLEX: 'info' }

  return (
    <Card className="shadow-sm mb-3">
      <Card.Header className="py-2 px-3 d-flex justify-content-between align-items-center bg-light">
        <div>
          <Badge bg={POSITION_COLORS[slot] ?? 'secondary'} className="me-2">{pos}</Badge>
          <span className="fw-semibold">{name}</span>
          <span className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>{team} · #{number}</span>
        </div>
        {fpDiff != null && (
          <span className={`fw-bold ${fpDiff >= 0 ? 'text-success' : 'text-danger'}`}>
            {fpDiff >= 0 ? '+' : ''}{fpDiff.toFixed(1)} pts
          </span>
        )}
      </Card.Header>
      <ListGroup variant="flush">
        <StatRow
          label={scoringKey === 'fantasyPointsPPR' ? 'Fantasy Pts (PPR)' : 'Fantasy Pts (½ PPR)'}
          actual={fpActual}
          projected={fpProjected}
        />
        {isQB && (
          <>
            <StatRow label="Passing Yards"    actual={actual?.passingYards}        projected={projected?.passingYards} />
            <StatRow label="Passing TDs"      actual={actual?.passingTouchdowns}   projected={projected?.passingTouchdowns} />
          </>
        )}
        {isSkill && (
          <>
            <StatRow label="Rushing Yards"    actual={actual?.rushingYards}        projected={projected?.rushingYards} />
            <StatRow label="Rushing TDs"      actual={actual?.rushingTouchdowns}   projected={projected?.rushingTouchdowns} />
            <StatRow label="Receiving Yards"  actual={actual?.receivingYards}      projected={projected?.receivingYards} />
            <StatRow label="Receiving TDs"    actual={actual?.receivingTouchdowns} projected={projected?.receivingTouchdowns} />
          </>
        )}
      </ListGroup>
    </Card>
  )
}

function StatSummaryRow({ label, diff }) {
  const color = diff >= 0 ? 'text-success' : 'text-danger'
  return (
    <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.85rem', borderBottom: '1px solid #eee' }}>
      <span className="text-muted">{label}</span>
      <span className={`fw-semibold ${color}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)}</span>
    </div>
  )
}

function TeamScore({ totals, scoringKey }) {
  const fpDiff = totals[scoringKey] ?? 0
  const color = fpDiff >= 0 ? 'success' : 'danger'
  return (
    <Card className={`border-${color} shadow mt-3`}>
      <Card.Body className="py-3 px-4">
        <div className="text-center mb-3">
          <div className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>Total Fantasy Points vs Projected</div>
          <div className={`fw-bold text-${color}`} style={{ fontSize: '2.5rem' }}>
            {fpDiff >= 0 ? '+' : ''}{fpDiff.toFixed(1)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            {fpDiff >= 0 ? 'Above' : 'Below'} expectations
          </div>
        </div>
        <hr className="my-2" />
        <StatSummaryRow label="Passing Yards"   diff={totals.passingYards} />
        <StatSummaryRow label="Passing TDs"     diff={totals.passingTouchdowns} />
        <StatSummaryRow label="Rushing Yards"   diff={totals.rushingYards} />
        <StatSummaryRow label="Rushing TDs"     diff={totals.rushingTouchdowns} />
        <StatSummaryRow label="Receiving Yards" diff={totals.receivingYards} />
        <StatSummaryRow label="Receiving TDs"   diff={totals.receivingTouchdowns} />
      </Card.Body>
    </Card>
  )
}

export default function AnalyzePage() {
  const [scoringMode, setScoringMode] = useState('ppr') // 'ppr' | 'half'
  const [dataReady, setDataReady] = useState(() => getPlayerIndex() !== null)
  const [roster] = useSessionState('rosterFormat', DEFAULT_ROSTER)
  const [draftedTeam] = useSessionState('draftedTeam', EMPTY_TEAM)

  useEffect(() => {
    if (dataReady) return
    loadAllData().then(() => setDataReady(true)).catch(() => {})
  }, [dataReady])

  const scoringKey = scoringMode === 'ppr' ? 'fantasyPointsPPR' : 'fantasyPoints'

  const rosterEntries = useMemo(() => {
    if (!dataReady) return []
    const index = getPlayerIndex()
    const entries = []
    for (const pos of POSITION_ORDER) {
      const ids = draftedTeam[pos] ?? []
      const max = roster[pos] ?? 0
      for (let i = 0; i < max; i++) {
        const pid = ids[i]
        entries.push({ slot: pos, player: pid ? index.get(pid) ?? null : null })
      }
    }
    return entries
  }, [dataReady, draftedTeam, roster])

  const STAT_KEYS = ['fantasyPoints', 'fantasyPointsPPR', 'passingYards', 'passingTouchdowns', 'rushingYards', 'rushingTouchdowns', 'receivingYards', 'receivingTouchdowns']

  const teamTotals = useMemo(() => {
    const totals = Object.fromEntries(STAT_KEYS.map(k => [k, 0]))
    for (const { player } of rosterEntries) {
      if (!player) continue
      for (const k of STAT_KEYS) {
        totals[k] += (player.actual?.[k] ?? 0) - (player.projected?.[k] ?? 0)
      }
    }
    return totals
  }, [rosterEntries])

  if (!dataReady) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading player data…</p>
      </Container>
    )
  }

  const filledEntries = rosterEntries.filter(e => e.player)

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Team Analysis</h5>
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

      {filledEntries.length === 0 ? (
        <p className="text-muted text-center mt-5">No players on your team yet. Head to <strong>Build Team</strong> to get started.</p>
      ) : (
        <Row>
          <Col xs={12} lg={8}>
            {rosterEntries.map(({ slot, player }, i) =>
              player ? (
                <PlayerAnalysisCard
                  key={player.playerID}
                  player={player}
                  slot={slot}
                  scoringKey={scoringKey}
                />
              ) : (
                <Card key={`empty-${slot}-${i}`} className="mb-3 border-dashed shadow-sm">
                  <Card.Body className="py-2 px-3 text-muted fst-italic" style={{ fontSize: '0.85rem' }}>
                    {slot} — Empty slot
                  </Card.Body>
                </Card>
              )
            )}
          </Col>
          <Col xs={12} lg={4}>
            <div className="sticky-top" style={{ top: '1rem' }}>
              <TeamScore totals={teamTotals} scoringKey={scoringKey} />
            </div>
          </Col>
        </Row>
      )}
    </Container>
  )
}
