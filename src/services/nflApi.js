import { buildPlayerIndex } from '../models/player.js'

const BASE = 'https://api.sportsdata.io/api/nfl/fantasy/json'
const API_KEY = 'fa3584d847d44ffe807ce5c842fae8f0'
const SEASON = '2025'

// In-memory cache — persists for the lifetime of the page session
const cache = {
  playerSeasonStats: null,
  playerProjections: null,
  playerIndex: null,
}

async function fetchAndCache(url, cacheKey) {
  if (cache[cacheKey]) {
    console.log(`[nflApi] Cache hit for "${cacheKey}"`)
    return cache[cacheKey]
  }

  console.log(`[nflApi] Fetching "${cacheKey}" from:`, url)
  try {
    const res = await fetch(url)
    console.log(`[nflApi] Response for "${cacheKey}": ${res.status} ${res.statusText}`)
    if (!res.ok) {
      const body = await res.text()
      console.error(`[nflApi] Error body for "${cacheKey}":`, body)
      throw new Error(`Failed to fetch ${cacheKey}: ${res.status}`)
    }
    const data = await res.json()
    console.log(`[nflApi] Received ${data.length} records for "${cacheKey}"`)
    cache[cacheKey] = data
    return data
  } catch (err) {
    console.error(`[nflApi] Fetch threw for "${cacheKey}":`, err)
    throw err
  }
}

export function fetchPlayerStats() {
  return fetchAndCache(
    `${BASE}/PlayerSeasonStats/${SEASON}?key=${API_KEY}`,
    'playerSeasonStats'
  )
}

export function fetchPlayerProjections() {
  return fetchAndCache(
    `${BASE}/PlayerSeasonProjectionStats/${SEASON}?key=${API_KEY}`,
    'playerProjections'
  )
}

export function loadAllData() {
  return Promise.all([fetchPlayerStats(), fetchPlayerProjections()]).then(([stats, projections]) => {
    cache.playerIndex = buildPlayerIndex(stats, projections)
    console.log(`[nflApi] Player index built: ${cache.playerIndex.size} players`)
    console.log('[nflApi] Example player object:', cache.playerIndex.values().next().value)
    return [stats, projections]
  })
}

export function getCachedStats() {
  return cache.playerSeasonStats
}

export function getCachedProjections() {
  return cache.playerProjections
}

export function getPlayerIndex() {
  return cache.playerIndex
}
