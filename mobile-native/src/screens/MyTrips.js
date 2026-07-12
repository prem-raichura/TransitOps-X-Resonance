import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api from '../api/client'
import { useDriverAuth } from '../context/DriverAuthContext'
import { getPosition } from '../lib/geo'
import LocationToggle from '../components/LocationToggle'
import StatusPill from '../components/StatusPill'
import { colors } from '../theme'

const isActive = (s) => s === 'DISPATCHED' || s === 'PENDING_COMPLETION'

export default function MyTrips({ navigation }) {
  const { driver } = useDriverAuth()
  const [trips, setTrips] = useState([])
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const pingRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const [{ data: t }, { data: me }] = await Promise.all([api.get('/driver/trips'), api.get('/driver/me')])
      setTrips(t)
      setLocationEnabled(me.locationEnabled)
      setError('')
    } catch {
      setError('Could not load trips')
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  // GPS ping loop every 30s while sharing ON (doc 12)
  useEffect(() => {
    clearInterval(pingRef.current)
    if (!locationEnabled) return
    const ping = async () => {
      try {
        const { lat, lng } = await getPosition()
        await api.post('/driver/location', { lat, lng })
      } catch {}
    }
    ping()
    pingRef.current = setInterval(ping, 30000)
    return () => clearInterval(pingRef.current)
  }, [locationEnabled])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const active = trips.filter((t) => isActive(t.status))
  const history = trips.filter((t) => !isActive(t.status))

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.brandDark, paddingHorizontal: 16, paddingVertical: 14 }}>
        <View>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{driver?.name}</Text>
          <Text style={{ color: colors.gray, fontSize: 12 }}>My Trips</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LocationToggle enabled={locationEnabled} onChange={setLocationEnabled} />
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={{ color: '#fff', fontSize: 20 }}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? <Text style={{ color: colors.red, marginBottom: 12 }}>{error}</Text> : null}

        <Text style={sectionTitle}>ACTIVE</Text>
        {active.length === 0 && <Text style={{ color: colors.gray, marginBottom: 16 }}>No active trip assigned.</Text>}
        {active.map((t) => (
          <TripCard key={t.slug} trip={t} highlight navigation={navigation} />
        ))}

        <Text style={[sectionTitle, { marginTop: 24 }]}>HISTORY</Text>
        {history.length === 0 && <Text style={{ color: colors.gray }}>No past trips.</Text>}
        {history.map((t) => (
          <TripCard key={t.slug} trip={t} navigation={navigation} />
        ))}
      </ScrollView>
    </View>
  )
}

function TripCard({ trip, highlight, navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('TripDetail', { slug: trip.slug })}
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: highlight ? 4 : 0,
        borderLeftColor: colors.brand,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: colors.gray, fontVariant: ['tabular-nums'] }}>{trip.slug}</Text>
        <StatusPill status={trip.status} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
        {trip.source} → {trip.destination}
      </Text>
      <Text style={{ fontSize: 12, color: colors.subtle, marginTop: 4 }}>
        {trip.vehicle?.name} · {trip.cargoKg} kg · {trip.plannedKm} km
      </Text>
      {trip.status === 'DISPATCHED' && trip.rejectionReason ? (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: colors.red }}>Rejected: {trip.rejectionReason}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const sectionTitle = { fontSize: 12, fontWeight: '700', color: colors.subtle, marginBottom: 8 }
