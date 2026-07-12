import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { DriverAuthProvider, useDriverAuth } from './src/context/DriverAuthContext'
import Login from './src/screens/Login'
import MyTrips from './src/screens/MyTrips'
import TripDetail from './src/screens/TripDetail'
import Profile from './src/screens/Profile'
import { colors } from './src/theme'

const Stack = createNativeStackNavigator()

function Root() {
  const { token, loading } = useDriverAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandDark }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="MyTrips" component={MyTrips} />
          <Stack.Screen name="TripDetail" component={TripDetail} />
          <Stack.Screen name="Profile" component={Profile} />
        </>
      ) : (
        <Stack.Screen name="Login" component={Login} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <DriverAuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Root />
      </NavigationContainer>
    </DriverAuthProvider>
  )
}
