import { useState } from 'react'

export default function useSessionState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  function setValue(val) {
    setState(prev => {
      const next = typeof val === 'function' ? val(prev) : val
      sessionStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  return [state, setValue]
}
