import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import api from '../api/client'
import { colors } from '../theme'

// Driver controls GPS pings (doc 12). Green dot = ON. Server refuses pings when off.
export default function LocationToggle({ enabled, onChange }) {
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    setBusy(true)
    try {
      const { data } = await api.put('/driver/location-sharing', { enabled: !enabled })
      onChange?.(data.locationEnabled)
    } catch {
    } finally {
      setBusy(false)
    }
  }

  return (
    <TouchableOpacity
      onPress={toggle}
      disabled={busy}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: enabled ? colors.greenDot : colors.faint }} />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{enabled ? 'Location ON' : 'Location OFF'}</Text>
    </TouchableOpacity>
  )
}
