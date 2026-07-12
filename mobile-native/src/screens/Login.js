import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useDriverAuth } from '../context/DriverAuthContext'
import { colors } from '../theme'

export default function Login() {
  const { login } = useDriverAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    if (!phone || !password) return setError('Enter phone and password.')
    setBusy(true)
    try {
      await login(phone.trim(), password)
      // navigation happens automatically when token appears (App switches stacks)
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
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: colors.brand, marginBottom: 12 }} />
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>TransitOps Driver</Text>
        <Text style={{ fontSize: 13, color: colors.gray }}>Trips · GPS · Fuel proof</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24 }}>
        {error ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, marginBottom: 16 }}>
            <Text style={{ color: colors.red, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        <Text style={label}>PHONE NUMBER</Text>
        <TextInput
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="9876500001"
          style={input}
        />

        <Text style={label}>PASSWORD</Text>
        <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" style={input} />

        <TouchableOpacity
          onPress={submit}
          disabled={busy}
          style={{ backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? <ActivityIndicator color={colors.brandDark} /> : <Text style={{ fontWeight: '700', color: colors.brandDark }}>Sign In</Text>}
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.gray, marginTop: 16 }}>
          Credentials provided by your dispatcher
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const label = { fontSize: 11, fontWeight: '500', color: colors.subtle, marginBottom: 4, textTransform: 'uppercase' }
const input = {
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 6,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
  marginBottom: 16,
}
