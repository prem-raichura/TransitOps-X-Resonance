import { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { useDriverAuth } from '../context/DriverAuthContext'
import Header from '../components/Header'
import Card from '../components/Card'
import { colors, radius } from '../theme'

export default function Profile() {
  const { logout } = useDriverAuth()
  const [me, setMe] = useState(null)

  useEffect(() => {
    api.get('/driver/me').then(({ data }) => setMe(data)).catch(() => {})
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Profile" subtitle="Your driver account" />
      {me ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Card style={{ alignItems: 'center', marginBottom: 16, paddingVertical: 24 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.brandDark }}>{me.name?.[0]}</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700' }}>{me.name}</Text>
            <Text style={{ fontSize: 14, color: colors.subtle }}>{me.contact}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill }}>
              <Ionicons name="shield-checkmark" size={14} color={colors.green} />
              <Text style={{ color: colors.green, fontSize: 12, fontWeight: '600' }}>Safety {me.safetyScore}%</Text>
            </View>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <Row icon="card-outline" label="License" value={`${me.licenseNo} (${me.licenseCategory})`} />
            <Row icon="calendar-outline" label="License expiry" value={new Date(me.licenseExpiry).toLocaleDateString()} warn={me.licenseExpired} />
            <Row icon="pulse-outline" label="Status" value={me.status} last />
          </Card>

          {me.licenseExpired ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: radius.md, padding: 14, marginBottom: 16 }}>
              <Ionicons name="warning" size={18} color={colors.red} />
              <Text style={{ color: colors.red, fontSize: 13, flex: 1 }}>Your license has expired — contact the safety officer.</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={logout}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 15, ...({ elevation: 1 }) }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.red} />
            <Text style={{ color: colors.red, fontWeight: '600' }}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </View>
  )
}

function Row({ icon, label, value, warn, last }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: '#f3f4f6' }}>
      <Ionicons name={icon} size={18} color={colors.faint} style={{ marginRight: 10 }} />
      <Text style={{ color: colors.subtle, flex: 1 }}>{label}</Text>
      <Text style={{ fontWeight: '600', color: warn ? colors.red : colors.text }}>{value}</Text>
    </View>
  )
}
