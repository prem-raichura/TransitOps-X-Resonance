import { useEffect, useState } from 'react'
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { colors } from '../theme'

// Cross-platform single-input prompt (Alert.prompt is iOS-only; Android needs this).
export default function PromptModal({ visible, title, subtitle, placeholder, keyboardType = 'numeric', confirmLabel = 'Confirm', onConfirm, onClose }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (visible) setValue('')
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 32 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{title}</Text>
          {subtitle ? <Text style={{ fontSize: 13, color: colors.subtle, marginBottom: 12 }}>{subtitle}</Text> : null}
          <TextInput
            autoFocus
            keyboardType={keyboardType}
            placeholder={placeholder}
            value={value}
            onChangeText={setValue}
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 16 }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => value && onConfirm(value)}
              disabled={!value}
              style={{ flex: 1, backgroundColor: colors.brand, borderRadius: 8, paddingVertical: 12, alignItems: 'center', opacity: value ? 1 : 0.5 }}
            >
              <Text style={{ fontWeight: '600', color: colors.brandDark }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
