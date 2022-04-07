import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import AddTaskScreen from './AddTaskScreen';
import AddWorkTimeScreen from './AddWorkTimeScreen';

const Stack = createNativeStackNavigator();


export default class App extends React.Component {
  render(){
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen options={{headerShown: false}} name="Home" component={HomeScreen}/>
          <Stack.Screen name="AddTask" component={AddTaskScreen} options={{ title: 'Task' }}/>
          <Stack.Screen name="AddWorkTime" component={AddWorkTimeScreen} options={{ title: 'Work Times' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});