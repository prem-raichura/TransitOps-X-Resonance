import { useRef, useState } from 'react'
import { Animated, PanResponder, Text, View } from 'react-native'
import { colors } from '../theme'

const KNOB = 52

// Swipe-to-confirm. Fires onComplete() when dragged past ~85% of the track, else snaps back.
export default function CompletionSlider({ disabled, onComplete, label = 'slide to complete trip' }) {
  const [trackW, setTrackW] = useState(0)
  const x = useRef(new Animated.Value(0)).current
  const maxX = Math.max(0, trackW - KNOB - 8)

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderMove: (_, g) => {
        const nx = Math.max(0, Math.min(g.dx, maxX))
        x.setValue(nx)
      },
      onPanResponderRelease: (_, g) => {
        const nx = Math.max(0, Math.min(g.dx, maxX))
        if (maxX > 0 && nx >= maxX * 0.85) {
          onComplete?.()
        }
        Animated.timing(x, { toValue: 0, duration: 180, useNativeDriver: false }).start()
      },
    }),
  ).current

  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={{
        height: 56,
        borderRadius: 999,
        backgroundColor: disabled ? colors.border : colors.brandDark,
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Text style={{ textAlign: 'center', color: disabled ? colors.faint : '#fff', fontSize: 14, fontWeight: '500' }}>
        {disabled ? 'unavailable' : label}
      </Text>
      <Animated.View
        {...responder.panHandlers}
        style={{
          position: 'absolute',
          left: 4,
          top: 2,
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX: x }],
        }}
      >
        <Text style={{ color: colors.brandDark, fontSize: 20, fontWeight: '700' }}>➜</Text>
      </Animated.View>
    </View>
  )
}
