import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useDriverAuth } from '../context/DriverAuthContext'
import { colors, radius, shadow } from '../theme'

export default function Login() {
  const { login } = useDriverAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    if (!phone || !password) return setError('Enter phone and password.')
    setBusy(true)
    try {
      await login(phone.trim(), password)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed — check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.brandDark, justifyContent: 'center', paddingHorizontal: 24 }}
    >
      <View style={{ alignItems: 'center', marginBottom: 36 }}>
        <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Ionicons name="bus" size={34} color={colors.brandDark} />
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff' }}>TransitOps Driver</Text>
        <Text style={{ fontSize: 13, color: colors.faint, marginTop: 2 }}>Trips · GPS · Fuel proof</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: radius.lg, padding: 24, ...shadow }}>
        {error ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: radius.sm, padding: 10, marginBottom: 16 }}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={{ color: colors.red, fontSize: 13, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Text style={label}>PHONE NUMBER</Text>
        <View style={inputWrap}>
          <Ionicons name="call-outline" size={18} color={colors.faint} />
          <TextInput
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="9876500001"
            placeholderTextColor={colors.faint}
            style={inputField}
          />
        </View>

        <Text style={label}>PASSWORD</Text>
        <View style={inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.faint} />
          <TextInput
            secureTextEntry={!show}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.faint}
            style={inputField}
          />
          <TouchableOpacity onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.faint} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={submit}
          disabled={busy}
          activeOpacity={0.85}
          style={{ backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 6, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? <ActivityIndicator color={colors.brandDark} /> : <Text style={{ fontWeight: '800', color: colors.brandDark, fontSize: 15 }}>Sign In</Text>}
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: 16 }}>
          Credentials provided by your dispatcher
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const label = { fontSize: 11, fontWeight: '600', color: colors.subtle, marginBottom: 6, letterSpacing: 0.4 }
const inputWrap = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: 12,
  marginBottom: 16,
}
const inputField = { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text }
