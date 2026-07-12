import * as Location from 'expo-location'

// Requests permission + returns a single high-accuracy fix. Throws if denied/unavailable.
export async function getPosition() {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') throw new Error('Location permission denied')
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
  return { lat: pos.coords.latitude, lng: pos.coords.longitude }
}
