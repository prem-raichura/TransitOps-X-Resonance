// Promise wrapper around the browser Geolocation API. Rejects if denied / no fix.
export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported on this device'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location permission denied or unavailable')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  })
}
