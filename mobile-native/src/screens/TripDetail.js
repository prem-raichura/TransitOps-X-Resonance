import { useCallback, useState } from 'react'
import { Alert, Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { getPosition } from '../lib/geo'
import Header from '../components/Header'
import Card from '../components/Card'
import StatusPill from '../components/StatusPill'
import CompletionSlider from '../components/CompletionSlider'
import FuelModal from '../components/FuelModal'
import PromptModal from '../components/PromptModal'
import { colors, radius } from '../theme'

export default function TripDetail({ route, navigation }) {
  const { slug } = route.params
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')
  const [fuelOpen, setFuelOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [odoOpen, setOdoOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/driver/trips/${slug}`)
      setTrip(data)
    } catch {
      setError('Trip not found')
    }
  }, [slug])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const addExpense = async (amount) => {
    setExpenseOpen(false)
    try {
      await api.post(`/driver/trips/${slug}/expense`, { miscCost: Number(amount), note: 'Driver expense' })
      Alert.alert('Expense added')
    } catch (err) {
      Alert.alert(err.response?.data?.error || 'Failed')
    }
  }

  const submitCompletion = async (endOdometer) => {
    setOdoOpen(false)
    setBusy(true)
    setError('')
    try {
      const { lat, lng } = await getPosition() // mandatory GPS
      await api.post(`/driver/trips/${slug}/submit-completion`, { endOdometer: Number(endOdometer), lat, lng })
      await load()
    } catch (err) {
      setError(
        err.message?.includes('permission') || err.message?.includes('Location')
          ? 'Location is required to complete a trip. Enable GPS and try again.'
          : err.response?.data?.error || 'Could not submit',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!trip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Trip" onBack={() => navigation.goBack()} />
        <Text style={{ padding: 24, color: colors.subtle }}>{error || 'Loading…'}</Text>
      </View>
    )
  }

  const active = trip.status === 'DISPATCHED'
  const pending = trip.status === 'PENDING_COMPLETION'

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={trip.slug.toUpperCase()}
        subtitle={`${trip.source} → ${trip.destination}`}
        onBack={() => navigation.goBack()}
        right={<StatusPill status={trip.status} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: active ? 140 : 24 }}>
        {error ? <Banner icon="alert-circle" color="#fef2f2" text={error} textColor={colors.red} /> : null}
        {pending ? <Banner icon="time-outline" color="#fffbeb" text="Awaiting dispatcher verification" textColor={colors.amber} /> : null}
        {active && trip.rejectionReason ? (
          <Banner icon="close-circle" color="#fef2f2" text={`Rejected: ${trip.rejectionReason}. Fix and re-submit below.`} textColor={colors.red} />
        ) : null}

        {/* route card */}
        <Card style={{ marginBottom: 16 }}>
          <RoutePoint icon="location" label="From" value={trip.source} color={colors.blue} />
          <View style={{ height: 14, borderLeftWidth: 2, borderLeftColor: colors.border, marginLeft: 9, marginVertical: 2 }} />
          <RoutePoint icon="flag" label="To" value={trip.destination} color={colors.green} />
        </Card>

        {/* details grid */}
        <Card>
          <Text style={cardTitle}>Trip Details</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            <Info icon="cube-outline" label="Vehicle" value={`${trip.vehicle?.name}`} />
            <Info icon="card-outline" label="Reg No" value={trip.vehicle?.regNo} />
            <Info icon="scale-outline" label="Cargo" value={`${trip.cargoKg} kg`} />
            <Info icon="navigate-outline" label="Planned" value={`${trip.plannedKm} km`} />
            <Info icon="speedometer-outline" label="Start odo" value={String(trip.startOdometer ?? '—')} />
            {trip.endOdometer != null ? <Info icon="flag-outline" label="End odo" value={String(trip.endOdometer)} /> : null}
          </View>
        </Card>

        {active ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <ActionBtn icon="water" label="Log Fuel" onPress={() => setFuelOpen(true)} />
            <ActionBtn icon="receipt-outline" label="Add Expense" onPress={() => setExpenseOpen(true)} />
          </View>
        ) : null}

        {/* completion GPS (proof of delivery location) */}
        {trip.completedLat != null && trip.completedLng != null ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={cardTitle}>Completion Location</Text>
            <MapRow lat={trip.completedLat} lng={trip.completedLng} label="Delivery point captured at completion" />
          </Card>
        ) : null}

        {/* fuel logs with proof photo + GPS */}
        {trip.fuelLogs?.length ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={cardTitle}>Fuel Logs ({trip.fuelLogs.length})</Text>
            {trip.fuelLogs.map((f) => (
              <View key={f.id} style={{ flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' }}>
                {f.proofImageUrl ? (
                  <TouchableOpacity onPress={() => Linking.openURL(f.proofImageUrl)}>
                    <Image source={{ uri: f.proofImageUrl }} style={{ width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.border }} />
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={20} color={colors.faint} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: colors.text }}>
                    {f.liters} L · ₹{f.cost}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.subtle }}>
                    {new Date(f.date).toLocaleDateString()} · {f.loggedBy}
                  </Text>
                  {f.lat != null ? (
                    <TouchableOpacity onPress={() => openMap(f.lat, f.lng)}>
                      <Text style={{ fontSize: 12, color: colors.blue, marginTop: 2 }}>
                        📍 {f.lat.toFixed(4)}, {f.lng.toFixed(4)}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {/* expenses */}
        {trip.expenses?.length ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={cardTitle}>Expenses ({trip.expenses.length})</Text>
            {trip.expenses.map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ color: colors.subtle, fontSize: 13 }}>
                  {new Date(e.date).toLocaleDateString()}
                  {e.tollCost ? '  · toll' : ''}
                </Text>
                <Text style={{ fontWeight: '600', color: colors.text }}>₹{(e.tollCost || 0) + (e.miscCost || 0)}</Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>

      {active ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}>
          <CompletionSlider disabled={busy} onComplete={() => setOdoOpen(true)} />
          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: 8 }}>
            GPS captured at completion — required
          </Text>
        </View>
      ) : null}

      <FuelModal tripSlug={slug} visible={fuelOpen} onClose={() => setFuelOpen(false)} onLogged={load} />
      <PromptModal
        visible={expenseOpen}
        title="Add Expense"
        subtitle="Amount (₹) — e.g. oil change, top-up"
        placeholder="500"
        confirmLabel="Add"
        onConfirm={addExpense}
        onClose={() => setExpenseOpen(false)}
      />
      <PromptModal
        visible={odoOpen}
        title="Complete Trip"
        subtitle="Enter final odometer — GPS captured on confirm"
        placeholder="74100"
        confirmLabel="Submit"
        onConfirm={submitCompletion}
        onClose={() => setOdoOpen(false)}
      />
    </View>
  )
}

function Banner({ icon, color, text, textColor }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color, borderRadius: radius.md, padding: 12, marginBottom: 12 }}>
      <Ionicons name={icon} size={18} color={textColor} />
      <Text style={{ color: textColor, fontSize: 13, flex: 1 }}>{text}</Text>
    </View>
  )
}

function RoutePoint({ icon, label, value, color }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon} size={18} color={color} />
      <View>
        <Text style={{ fontSize: 11, color: colors.faint, textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{value}</Text>
      </View>
    </View>
  )
}

function Info({ icon, label, value }) {
  return (
    <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Ionicons name={icon} size={16} color={colors.faint} />
      <View>
        <Text style={{ fontSize: 11, color: colors.faint }}>{label}</Text>
        <Text style={{ fontWeight: '600', color: colors.text }}>{value}</Text>
      </View>
    </View>
  )
}

function ActionBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', gap: 6 }}
    >
      <Ionicons name={icon} size={22} color={colors.brandDark} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{label}</Text>
    </TouchableOpacity>
  )
}

function MapRow({ lat, lng, label }) {
  return (
    <TouchableOpacity onPress={() => openMap(lat, lng)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
      <Ionicons name="location" size={18} color={colors.blue} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.blue, fontWeight: '600' }}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </Text>
        <Text style={{ fontSize: 12, color: colors.faint }}>{label} — tap to open map</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.faint} />
    </TouchableOpacity>
  )
}

// open native maps app at the coordinates
function openMap(lat, lng) {
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)
}

const cardTitle = { fontSize: 13, fontWeight: '700', color: colors.subtle, letterSpacing: 0.3 }
