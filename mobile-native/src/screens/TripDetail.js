import { useCallback, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api from '../api/client'
import { getPosition } from '../lib/geo'
import StatusPill from '../components/StatusPill'
import CompletionSlider from '../components/CompletionSlider'
import FuelModal from '../components/FuelModal'
import PromptModal from '../components/PromptModal'
import { colors } from '../theme'

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

  // odometer entered -> grab mandatory GPS -> submit for dispatcher verification
  const submitCompletion = async (endOdometer) => {
    setOdoOpen(false)
    setBusy(true)
    setError('')
    try {
      const { lat, lng } = await getPosition()
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

  if (!trip) return <View style={{ padding: 24 }}><Text style={{ color: colors.subtle }}>{error || 'Loading…'}</Text></View>

  const active = trip.status === 'DISPATCHED'
  const pending = trip.status === 'PENDING_COMPLETION'

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brandDark, paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontVariant: ['tabular-nums'] }}>{trip.slug}</Text>
        <View style={{ marginLeft: 'auto' }}>
          <StatusPill status={trip.status} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {error ? <Banner color="#fef2f2" text={error} textColor={colors.red} /> : null}
        {pending ? <Banner color="#fffbeb" text="⏳ Awaiting dispatcher verification" textColor={colors.amber} /> : null}
        {active && trip.rejectionReason ? (
          <Banner color="#fef2f2" text={`Rejected: ${trip.rejectionReason}. Fix and re-submit below.`} textColor={colors.red} />
        ) : null}

        <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
            {trip.source} → {trip.destination}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
            <Info label="Vehicle" value={`${trip.vehicle?.name} (${trip.vehicle?.regNo})`} />
            <Info label="Cargo" value={`${trip.cargoKg} kg`} />
            <Info label="Planned" value={`${trip.plannedKm} km`} />
            <Info label="Start odometer" value={String(trip.startOdometer ?? '—')} />
          </View>
        </View>

        {active ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <ActionBtn label="⛽ + Fuel" onPress={() => setFuelOpen(true)} />
            <ActionBtn label="🧾 + Expense" onPress={() => setExpenseOpen(true)} />
          </View>
        ) : null}
      </ScrollView>

      {active ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, padding: 16 }}>
          <CompletionSlider disabled={busy} onComplete={() => setOdoOpen(true)} />
          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.gray, marginTop: 8 }}>
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
        subtitle="Enter final odometer reading — GPS captured on confirm"
        placeholder="74100"
        confirmLabel="Submit"
        onConfirm={submitCompletion}
        onClose={() => setOdoOpen(false)}
      />
    </View>
  )
}

function Banner({ color, text, textColor }) {
  return (
    <View style={{ backgroundColor: color, borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <Text style={{ color: textColor, fontSize: 13 }}>{text}</Text>
    </View>
  )
}

function Info({ label, value }) {
  return (
    <View style={{ width: '50%', marginBottom: 12 }}>
      <Text style={{ fontSize: 11, color: colors.gray, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontWeight: '500', color: colors.text }}>{value}</Text>
    </View>
  )
}

function ActionBtn({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
      <Text style={{ fontSize: 14, fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  )
}
