import { Text, View } from 'react-native'
import { statusColor, statusLabel } from '../theme'

export default function StatusPill({ status }) {
  return (
    <View style={{ backgroundColor: statusColor[status] || '#9ca3af', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{statusLabel[status] || status}</Text>
    </View>
  )
}
