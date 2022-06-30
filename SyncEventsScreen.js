/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect } from 'react'
import { StyleSheet, ScrollView, Alert, View, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, ListItem, Text, CheckBox } from '@rneui/base'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
})

export default function SyncEventsScreen ({ route, navigation }) {
  const { events, checkedEvents } = route.params

  const [use, setUse] = useState([])
  const [ready, setReady] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [checkEvents, setCheckEvents] = useState([])
  const [notification, setNotification] = useState('')

  // const checkEvents = []

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getData()
    })

    registerForPushNotificationsAsync().then()
    // getData()
    return () => {
      unsubscribe
    }
  }, [])

  const getData = async () => {
    try {
      const used = []
      events.forEach((event) => {
        used.push(false)
      })
      setUse(used)
      setReady(true)
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  async function schedulePushNotification (event) {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: event.name,
        body:
          displayTime(event.start) +
          ' - ' +
          displayTime(event.end) +
          '.\n' +
          event.description
      },
      trigger: time(new Date(event.pStart))
    })
  }

  async function registerForPushNotificationsAsync () {
    let token
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!')
        return
      }
      token = (await Notifications.getExpoPushTokenAsync()).data
      // console.log(token)
    } else {
      alert('Must use physical device for Push Notifications')
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C'
      })
    }

    return token
  }

  function displayTime (date) {
    let hours = new Date(date).getHours()
    const minutes = new Date(date).getMinutes()
    let amPm = 'am'
    if (hours >= 12) {
      amPm = 'pm'
    }
    if (hours === 0) {
      hours = 12
    }
    if (hours > 12) {
      hours -= 12
    }
    if (minutes < 10) {
      return hours + ':' + '0' + minutes + amPm
    }
    return hours + ':' + minutes + ' ' + amPm
  }

  function time (t) {
    return new Date(Math.floor(new Date(t) / (60 * 1000)) * 60 * 1000)
  }

  function reviewEvents (event) {
    // check if event has the same name as any events in checkEvents
    return (
      event != null &&
      (!checkedEvents.some((e) => e.id === event.id) ||
        checkEvents.some((e) => e.title === event.title && e.id !== event.id) ||
        checkEvents.some(
          (element) =>
            time(element.startDate).getTime() <=
              time(event.startDate).getTime() &&
            time(element.endDate).getTime() > time(event.startDate).getTime() &&
            element.id !== event.id
        ) ||
        checkEvents.some(
          (element) =>
            time(element.startDate) < time(event.endDate) &&
            time(element.endDate) >= time(event.endDate) &&
            element.id !== event.id
        ) ||
        checkEvents.some(
          (element) =>
            time(element.startDate) >= time(event.startDate) &&
            time(element.endDate) <= time(event.endDate) &&
            element.id !== event.id
        ) ||
        checkEvents.some(
          (element) =>
            time(element.startDate) <= time(event.startDate) &&
            time(element.endDate) >= time(event.endDate) &&
            element.id !== event.id
        ))
    )
  }

  async function handleSave () {
    const JsonValue = await AsyncStorage.getItem('setTasks')
    const setTasks = JsonValue != null ? JSON.parse(JsonValue) : null
    for (const event of checkEvents) {
      setTasks[0][new Date().getDay()].push({
        name: event.title,
        pStart: time(event.startDate),
        pEnd: time(event.endDate),
        start: time(event.startDate),
        end: time(event.endDate),
        length:
          (time(event.endDate).getTime() - time(event.startDate).getTime()) /
          (1000 * 60),
        description: event.notes
      })
      if (event.alarms[0] != null) {
        setTasks[0][new Date().getDay()][
          setTasks[0][new Date().getDay()].length - 1
        ].notification = event.alarms[0].relativeOffset * -1
        setTasks[0][new Date().getDay()][
          setTasks[0][new Date().getDay()].length - 1
        ].notificationId = await schedulePushNotification(
          setTasks[0][new Date().getDay()][
            setTasks[0][new Date().getDay()].length - 1
          ]
        )
      } else {
        setTasks[0][new Date().getDay()][
          setTasks[0][new Date().getDay()].length - 1
        ].notification = ''
      }

      if (event.location !== '') {
        setTasks[0][new Date().getDay()][
          setTasks[0][new Date().getDay()].length - 1
        ].description += ' At ' + event.location + '.'
      }
    }
    setTasks.sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
    await AsyncStorage.setItem('setTasks', JSON.stringify(setTasks))
    navigation.navigate('Home', { editName: '' })
  }

  function setUseArr (index) {
    const tempUse = [...use]
    tempUse[index] = !tempUse[index]
    setUse(tempUse)
    setRefresh(!refresh)
  }

  if (!ready) {
    return null
  }
  return (
    <SafeAreaView style={styles.container}>
      {events.length === 0
        ? (
        <Text h4 style={{ alignSelf: 'center' }}>
          No Calendar Events
        </Text>
          )
        : null}
      <ScrollView>
        {events.map((event, index) => {
          return (
            <ListItem key={index} bottomDivider>
              {refresh || !refresh
                ? (
                <CheckBox
                  checked={use[index]}
                  onPress={() => {
                    if (!use[index]) {
                      checkEvents.push(event)
                    } else {
                      checkEvents.splice(checkEvents.indexOf(event), 1)
                    }
                    setUseArr(index)
                  }}
                  disabled={reviewEvents(event)}
                  uncheckedColor={reviewEvents(event) ? 'gray' : 'black'}
                />
                  )
                : null}
              <ListItem.Content>
                <ListItem.Title
                  style={
                    !checkedEvents.some((e) => e.id === event.id)
                      ? { color: 'gray' }
                      : { color: 'black' }
                  }
                >
                  {event.title}
                </ListItem.Title>
                <ListItem.Subtitle
                  style={
                    !checkedEvents.some((e) => e.id === event.id)
                      ? { color: 'gray' }
                      : { color: 'black' }
                  }
                >
                  {displayTime(event.startDate)} - {displayTime(event.endDate)}
                </ListItem.Subtitle>
                <ListItem.Subtitle
                  style={
                    !checkedEvents.some((e) => e.id === event.id)
                      ? { color: 'gray' }
                      : { color: 'black' }
                  }
                >
                  {event.notes +
                    (event.location !== ''
                      ? ' At ' + event.location + '.'
                      : '')}
                </ListItem.Subtitle>
                <ListItem.Subtitle
                  style={
                    !checkedEvents.some((e) => e.id === event.id)
                      ? { color: 'gray' }
                      : { color: 'black' }
                  }
                >
                  {event.alarms[0] != null
                    ? 'Notify ' +
                      event.alarms[0].relativeOffset * -1 +
                      ' minutes before.'
                    : "doesn't notify"}
                </ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
          )
        })}
        <Button
          title="Save"
          buttonStyle={{
            backgroundColor: '#6a99e6',
            alignSelf: 'flex-end',
            marginTop: 10
          }}
          onPress={() => {
            handleSave()
          }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#3A3B3C',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  }
})
