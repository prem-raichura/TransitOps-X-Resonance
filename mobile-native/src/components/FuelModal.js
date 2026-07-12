import { useState } from 'react'
import { ActivityIndicator, Image, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import api from '../api/client'
import { getPosition } from '../lib/geo'
import { colors } from '../theme'

// Camera-first fuel logging. Photo of the fuel meter + GPS fix BOTH mandatory (doc 11).
export default function FuelModal({ tripSlug, visible, onClose, onLogged }) {
  const [photo, setPhoto] = useState(null) // { uri }
  const [coords, setCoords] = useState(null)
  const [liters, setLiters] = useState('')
  const [cost, setCost] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setPhoto(null)
    setCoords(null)
    setLiters('')
    setCost('')
    setError('')
  }

  const capture = async () => {
    setError('')
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      setError('Camera permission required.')
      return
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6 })
    if (res.canceled) return
    setPhoto(res.assets[0])
    // grab GPS at capture time (proof pair)
    try {
      setCoords(await getPosition())
    } catch {
      setCoords(null)
      setError('Enable GPS to log fuel — location is required with the photo.')
    }
  }

  const submit = async () => {
    setError('')
    if (!photo || !coords) return setError('Fuel meter photo with GPS is required.')
    if (!liters || !cost) return setError('Enter liters and cost.')
    setBusy(true)
    try {
      const form = new FormData()
      form.append('proofImage', { uri: photo.uri, name: 'fuel.jpg', type: 'image/jpeg' })
      form.append('liters', liters)
      form.append('cost', cost)
      form.append('lat', String(coords.lat))
      form.append('lng', String(coords.lng))
      await api.post(`/driver/trips/${tripSlug}/fuel`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onLogged?.()
      reset()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Log Fuel</Text>

          {error ? (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, marginBottom: 12 }}>
              <Text style={{ color: colors.red, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          {photo ? (
            <View style={{ marginBottom: 12 }}>
              <Image source={{ uri: photo.uri }} style={{ height: 160, borderRadius: 8 }} resizeMode="cover" />
              <Text style={{ fontSize: 12, color: colors.subtle, marginTop: 4 }}>
                {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '⚠️ no GPS fix'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={capture}
              style={{
                height: 160,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: colors.border,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 30 }}>📷</Text>
              <Text style={{ fontSize: 13, color: colors.subtle, marginTop: 4 }}>Photograph the fuel meter</Text>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <TextInput
              placeholder="Liters"
              keyboardType="numeric"
              value={liters}
              onChangeText={setLiters}
              style={inputStyle}
            />
            <TextInput
              placeholder="Cost ₹"
              keyboardType="numeric"
              value={cost}
              onChangeText={setCost}
              style={inputStyle}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                reset()
                onClose()
              }}
              style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              disabled={busy || !photo || !coords}
              style={{
                flex: 1,
                backgroundColor: colors.brand,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
                opacity: busy || !photo || !coords ? 0.5 : 1,
              }}
            >
              {busy ? <ActivityIndicator color={colors.brandDark} /> : <Text style={{ fontSize: 14, fontWeight: '600', color: colors.brandDark }}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const inputStyle = {
  flex: 1,
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 6,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
}
