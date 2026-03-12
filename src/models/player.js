/**
 * Builds a merged Player object from one actual-stats record and one
 * projected-stats record (matched by PlayerID).
 *
 * Actual stats are prefixed with `actual`, projected stats with `projected`.
 * Identity fields (shared/non-numeric) are stored at the top level.
 */
export function buildPlayer(actual, projected) {
  return {
    // --- Identity ---
    playerID: actual.PlayerID,
    name: projected ? projected.Name : actual.Name,
    team: actual.Team,
    number: actual.Number,
    position: actual.Position,
    played: actual.Played,

    // --- Actual Stats ---
    actual: {
      passingYards:          actual.PassingYards,
      passingTouchdowns:     actual.PassingTouchdowns,
      passingInterceptions:  actual.PassingInterceptions,
      rushingYards:          actual.RushingYards,
      rushingTouchdowns:     actual.RushingTouchdowns,
      receivingYards:        actual.ReceivingYards,
      receivingTouchdowns:   actual.ReceivingTouchdowns,
      fantasyPoints:         actual.FantasyPoints,
      fantasyPointsPPR:      actual.FantasyPointsPPR,
    },

    // --- Projected Stats (null if no projection found) ---
    projected: projected ? {
      passingYards:          projected.PassingYards,
      passingTouchdowns:     projected.PassingTouchdowns,
      passingInterceptions:  projected.PassingInterceptions,
      rushingYards:          projected.RushingYards,
      rushingTouchdowns:     projected.RushingTouchdowns,
      receivingYards:        projected.ReceivingYards,
      receivingTouchdowns:   projected.ReceivingTouchdowns,
      fantasyPoints:         projected.FantasyPoints,
      fantasyPointsPPR:      projected.FantasyPointsPPR,
    } : null,
  }
}

const RELEVANT_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K'])

/**
 * Given the two raw API arrays, returns a Map<PlayerID, Player>
 * for fast lookup. Only includes QB, RB, WR, TE, and K.
 */
export function buildPlayerIndex(statsArray, projectionsArray) {
  const projMap = new Map(projectionsArray.map(p => [p.PlayerID, p]))
  const players = new Map()
  for (const actual of statsArray) {
    if (!RELEVANT_POSITIONS.has(actual.Position)) continue
    const projected = projMap.get(actual.PlayerID) ?? null
    players.set(actual.PlayerID, buildPlayer(actual, projected))
  }
  return players
}
