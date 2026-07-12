import { Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '../theme'

// Brand header with safe-area top padding, rounded bottom, optional back button + right slot.
export default function Header({ title, subtitle, onBack, right }) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{
        backgroundColor: colors.brandDark,
        paddingTop: insets.top + 10,
        paddingBottom: 18,
        paddingHorizontal: 18,
        borderBottomLeftRadius: radius.lg,
        borderBottomRightRadius: radius.lg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={10} style={{ marginRight: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{title}</Text>
          {subtitle ? <Text style={{ color: colors.faint, fontSize: 13, marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  )
}
