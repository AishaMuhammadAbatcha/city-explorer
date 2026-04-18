import { useCallback, useState } from 'react'

export type GeolocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error'

export interface Coords {
  lat: number
  lng: number
}

// Module-level cache: the first successful fix in a session is reused
// for any subsequent Directions click, so we don't re-prompt or hit
// the geolocation API twice.
let cachedCoords: Coords | null = null

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 300_000,
}

function getCurrentPosition(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        cachedCoords = coords
        resolve(coords)
      },
      () => resolve(null),
      POSITION_OPTIONS,
    )
  })
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>(cachedCoords ? 'granted' : 'idle')
  const [coords, setCoords] = useState<Coords | null>(cachedCoords)

  const request = useCallback(async (): Promise<Coords | null> => {
    if (cachedCoords) {
      setStatus('granted')
      setCoords(cachedCoords)
      return cachedCoords
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('error')
      return null
    }

    setStatus('loading')

    // Permissions API is optional; when present it lets us skip a
    // second browser prompt if the user already denied or already
    // granted in this origin.
    let permissionState: PermissionState | null = null
    try {
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        permissionState = result.state
      }
    } catch {
      permissionState = null
    }

    if (permissionState === 'denied') {
      setStatus('denied')
      return null
    }

    const result = await getCurrentPosition()
    if (!result) {
      setStatus(permissionState === 'granted' ? 'error' : 'denied')
      return null
    }

    setStatus('granted')
    setCoords(result)
    return result
  }, [])

  return { status, coords, request }
}
