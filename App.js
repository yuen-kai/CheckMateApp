import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from './HomeScreen'
import AddTaskScreen from './AddTaskScreen'
import AddWorkTimeScreen from './AddWorkTimeScreen'
import SyncEventsScreen from './SyncEventsScreen'
import 'react-native-gesture-handler'

const Stack = createNativeStackNavigator()

export default class App extends React.Component {
  render () {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false }}
            name="Home"
            component={HomeScreen}
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
        </Stack.Navigator>
      </NavigationContainer>
    )
  }
}
