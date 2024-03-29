import { GestureHandlerRootView } from 'react-native-gesture-handler'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from './HomeScreen'
import AddTaskScreen from './AddTaskScreen'
import AddWorkTimeScreen from './AddWorkTimeScreen'
import SyncEventsScreen from './SyncEventsScreen'
import SettingsScreen from './SettingsScreen'

const Stack = createNativeStackNavigator()

export default function App () {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            initialParams={{ editName: '' }}
          />
          <Stack.Screen
            name="AddTask"
            component={AddTaskScreen}
            options={{ title: 'Task' }}
          />
          <Stack.Screen
            name="AddWorkTime"
            component={AddWorkTimeScreen}
            options={{ title: 'Event' }}
          />
          <Stack.Screen
            name="SyncEvents"
            component={SyncEventsScreen}
            options={{ title: 'Review Calendar Events' }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}
