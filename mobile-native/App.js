import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { DriverAuthProvider, useDriverAuth } from './src/context/DriverAuthContext'
import Login from './src/screens/Login'
import MyTrips from './src/screens/MyTrips'
import TripDetail from './src/screens/TripDetail'
import Profile from './src/screens/Profile'
import { colors } from './src/theme'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Trips tab is its own stack so TripDetail pushes over the list without losing the tab bar.
function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyTrips" component={MyTrips} />
      <Stack.Screen name="TripDetail" component={TripDetail} />
    </Stack.Navigator>
  )
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandDark,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icon = route.name === 'Trips' ? 'cube' : 'person'
          return <Ionicons name={icon} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Trips" component={TripsStack} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  )
}

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
        <Stack.Screen name="App" component={Tabs} />
      ) : (
        <Stack.Screen name="Login" component={Login} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DriverAuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Root />
        </NavigationContainer>
      </DriverAuthProvider>
    </SafeAreaProvider>
  )
}
