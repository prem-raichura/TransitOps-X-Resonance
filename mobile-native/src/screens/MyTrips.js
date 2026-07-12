import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { useDriverAuth } from '../context/DriverAuthContext'
import { getPosition } from '../lib/geo'
import Header from '../components/Header'
import Card from '../components/Card'
import LocationToggle from '../components/LocationToggle'
import StatusPill from '../components/StatusPill'
import { colors, radius } from '../theme'

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
  const completed = history.filter((t) => t.status === 'COMPLETED').length

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={`Hi, ${driver?.name?.split(' ')[0] || 'Driver'}`}
        subtitle={active.length ? `${active.length} active trip` : 'No active trips'}
        right={<LocationToggle enabled={locationEnabled} onChange={setLocationEnabled} />}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandDark} />}
      >
        {error ? <Text style={{ color: colors.red, marginBottom: 12 }}>{error}</Text> : null}

        {/* quick stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Stat label="Active" value={active.length} accent={colors.blue} />
          <Stat label="Completed" value={completed} accent={colors.green} />
          <Stat label="Total" value={trips.length} accent={colors.brandDark} />
        </View>

        <SectionLabel text="Active" />
        {active.length === 0 && <Empty text="No active trip assigned yet." />}
        {active.map((t) => (
          <TripCard key={t.slug} trip={t} highlight navigation={navigation} />
        ))}

        <View style={{ height: 20 }} />
        <SectionLabel text="History" />
        {history.length === 0 && <Empty text="No past trips." />}
        {history.map((t) => (
          <TripCard key={t.slug} trip={t} navigation={navigation} />
        ))}
      </ScrollView>
    </View>
  )
}

function Stat({ label, value, accent }) {
  return (
    <Card style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: accent }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.subtle, marginTop: 2 }}>{label}</Text>
    </Card>
  )
}

function TripCard({ trip, highlight, navigation }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('TripDetail', { slug: trip.slug })}>
      <Card
        style={{
          marginBottom: 12,
          borderLeftWidth: highlight ? 4 : 0,
          borderLeftColor: colors.brand,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: colors.faint, fontVariant: ['tabular-nums'] }}>{trip.slug}</Text>
          <StatusPill status={trip.status} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 }} numberOfLines={1}>
            {trip.source}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.faint} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 }} numberOfLines={1}>
            {trip.destination}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Meta icon="cube-outline" text={trip.vehicle?.name} />
          <Meta icon="scale-outline" text={`${trip.cargoKg} kg`} />
          <Meta icon="navigate-outline" text={`${trip.plannedKm} km`} />
        </View>

        {trip.status === 'DISPATCHED' && trip.rejectionReason ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: colors.red }}>Rejected: {trip.rejectionReason}</Text>
          </View>
        ) : null}
      </Card>
    </TouchableOpacity>
  )
}

function Meta({ icon, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={colors.faint} />
      <Text style={{ fontSize: 12, color: colors.subtle }}>{text}</Text>
    </View>
  )
}

function SectionLabel({ text }) {
  return <Text style={{ fontSize: 12, fontWeight: '700', color: colors.subtle, marginBottom: 10, letterSpacing: 0.5 }}>{text.toUpperCase()}</Text>
}

function Empty({ text }) {
  return <Text style={{ color: colors.faint, marginBottom: 12, fontSize: 13 }}>{text}</Text>
}
