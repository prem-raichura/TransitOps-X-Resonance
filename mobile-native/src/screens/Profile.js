import { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import api from '../api/client'
import { useDriverAuth } from '../context/DriverAuthContext'
import { colors } from '../theme'

export default function Profile({ navigation }) {
  const { logout } = useDriverAuth()
  const [me, setMe] = useState(null)

  useEffect(() => {
    api.get('/driver/me').then(({ data }) => setMe(data)).catch(() => {})
  }, [])

  if (!me) return null

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brandDark, paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.brandDark }}>{me.name?.[0]}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{me.name}</Text>
          <Text style={{ fontSize: 14, color: colors.subtle }}>{me.contact}</Text>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <Row label="License" value={`${me.licenseNo} (${me.licenseCategory})`} />
          <Row label="License expiry" value={new Date(me.licenseExpiry).toLocaleDateString()} warn={me.licenseExpired} />
          <Row label="Safety score" value={`${me.safetyScore}%`} />
          <Row label="Status" value={me.status} last />
        </View>

        {me.licenseExpired ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: colors.red, fontSize: 13 }}>⚠️ Your license has expired — contact the safety officer.</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={logout} style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: colors.red, fontWeight: '500' }}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function Row({ label, value, warn, last }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: '#f3f4f6' }}>
      <Text style={{ color: colors.subtle }}>{label}</Text>
      <Text style={{ fontWeight: '500', color: warn ? colors.red : colors.text }}>{value}</Text>
    </View>
  )
}
