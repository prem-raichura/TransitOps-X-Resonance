import { View } from 'react-native'
import { colors, radius, shadow } from '../theme'

export default function Card({ children, style }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: 16, ...shadow }, style]}>
      {children}
    </View>
  )
}
