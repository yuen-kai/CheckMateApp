/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Button,
  ListItem,
  Text,
  CheckBox
} from '@rneui/base'

export default function SyncEventsScreen ({ route, navigation }) {
  const { events, checkedEvents } = route.params

  const [use, setUse] = useState([])
  const [ready, setReady] = useState(false)

  let checkEvents

  useEffect(() => {
    () => navigation.addListener('focus', () => {
      getData()
    })
  })

  const getData = async () => {
    try {
      const use = []
      events.forEach((event) => {
        use.push(false)
      })
      setUse(use)
      setReady(true)
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
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
    // console.log(!checkedEvents.some(e => e.id === event.id))
    return (
      event != null &&
      (!checkedEvents.some((e) => e.id === event.id) ||
        checkEvents.some(
          (e) => e.title === event.title && e.id !== event.id
        ) ||
        checkEvents.some(
          (element) =>
            time(element.startDate).getTime() <=
              time(event.startDate).getTime() &&
            time(element.endDate).getTime() >
              time(event.startDate).getTime() &&
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
    checkEvents.forEach((event) => {
      setTasks[0][new Date().getDay()].push({
        name: event.title,
        pStart: time(event.startDate),
        pEnd: time(event.endDate),
        start: time(event.startDate),
        end: time(event.endDate),
        length:
          (time(event.endDate).getTime() -
            time(event.startDate).getTime()) /
          (1000 * 60),
        description: event.notes
      })
      if (event.location !== '') {
        setTasks[0][new Date().getDay()][
          setTasks[0][new Date().getDay()].length - 1
        ].description += ' At ' + event.location + '.'
      }
    })
    setTasks.sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
    await AsyncStorage.setItem('setTasks', JSON.stringify(setTasks))
    navigation.navigate('Home')
  }

  function setUseArr (index) {
    const tempUse = use
    tempUse[index] = !tempUse[index]
    setUse(use)
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
        <ScrollView contentContainerStyle={{ flex: 1 }}>
          {events.map((event, index) => {
            return (
              <ListItem key={index} bottomDivider>
                <CheckBox
                  checked={use[index]}
                  onPress={() => {
                    !use[index]
                      ? checkEvents.push(event)
                      : checkEvents.splice(
                        checkEvents.indexOf(event),
                        1
                      )
                    setUseArr(index)
                  }}
                  disabled={reviewEvents(event)}
                  uncheckedColor={reviewEvents(event) ? 'gray' : 'black'}
                />
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
                    {displayTime(event.startDate)} -{' '}
                    {displayTime(event.endDate)}
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
            onPress={() => handleSave()}
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
