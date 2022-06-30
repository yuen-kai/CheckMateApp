/* eslint-disable no-unused-expressions */
/* eslint-disable no-lone-blocks */
/* eslint-disable react/prop-types */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Alert, ScrollView, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Avatar, CheckBox, Input, Button, Text } from 'react-native-elements'

let workTimes

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
})

export default function AddWorkTimeScreen ({ route, navigation }) {
  const { editName } = route.params
  let selectedTask
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  const [daysUsed, setDaysUsed] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false
  ])
  const [startShow, setStartShow] = useState(false)
  const [endShow, setEndShow] = useState(false)
  const [ready, setReady] = useState(false)
  const [start, setStart] = useState(
    new Date(new Date().setHours(new Date().getHours() + 1)).setMinutes(0)
  )
  const [end, setEnd] = useState(
    new Date(new Date().setHours(new Date().getHours() + 1)).setMinutes(30)
  )
  const [weekly, setWeekly] = useState(false)
  const [repeating, setRepeating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [empty, setEmpty] = useState(false)
  const [edit, setEdit] = useState(false)
  const [notification, setNotification] = useState('')
  const [same, setSame] = useState(false)

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getData()
    })

    registerForPushNotificationsAsync().then()

    return () => {
      unsubscribe
    }
  }, [])

  const getData = async () => {
    const change = [...daysUsed]
    change.splice(new Date().getDay(), 1, true)
    setDaysUsed(change)
    try {
      const jsonValue = await AsyncStorage.getItem('setTasks')
      workTimes = jsonValue != null ? JSON.parse(jsonValue) : null
      editInfo()
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  async function schedulePushNotification (event, i, weekly) {
    const triggerTime = new Date(
      new Date(
        new Date(event.pStart).setDate(
          new Date().getDate() + (i - new Date().getDay())
        )
      ).getTime() -
        event.notification * 1000 * 60
    )
    if (weekly) {
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
        trigger: {
          weekday: i + 1,
          hour: triggerTime.getHours(),
          minute: triggerTime.getMinutes(),
          repeats: true
        }
      })
    } else {
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
        trigger: triggerTime
      })
    }
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

  const editInfo = async () => {
    try {
      if (editName !== '') {
        const change = [...daysUsed]
        selectedTask =
          workTimes[0][new Date().getDay()][
            workTimes[0][new Date().getDay()].findIndex(
              (task) => task.name === editName
            )
          ]
        setEdit(true)
        setName(editName)
        setStart(selectedTask.pStart)
        setEnd(selectedTask.pEnd)
        setRepeating(selectedTask.repeating)
        setDescription(selectedTask.description)
        setNotification(selectedTask.notification)
        await AsyncStorage.removeItem('editName')
        for (let i = 0; i <= daysUsed.length - 1; i++) {
          if (
            workTimes[0][i].findIndex((task) => task.name === editName) !== -1
          ) {
            change.splice(i, 1, true)
          }
        }
        if (
          workTimes[1][new Date().getDay()].findIndex(
            (task) => task.name === editName
          ) !== -1
        ) {
          setWeekly(true)
        }
        await setDaysUsed(change)
      }
    } catch (e) {
      Alert.alert(
        'Failed to get edit info!',
        'Failed to get edit info! Please try again.'
      )
      console.log(e)
    }
    setReady(true)
  }

  function newInfo () {
    const task = workTimes[0][new Date().getDay()].find(
      (event) => event.name === editName
    )
    // check if state props are the same as task props
    return (
      task !== undefined &&
      edit &&
      !(
        name === task.name &&
        roundTime(start).getTime() === roundTime(task.pStart).getTime() &&
        roundTime(end).getTime() === roundTime(task.pEnd).getTime()
      )
    )
  }

  function roundTime (time) {
    return new Date(Math.floor(new Date(time) / (60 * 1000)) * 60 * 1000)
  }

  const onStartChange = (event, selectedDate) => {
    overlapingTime()
    const currentDate = selectedDate || start
    setStartShow(false)
    setStart(currentDate)
  }

  const onEndChange = (event, selectedDate) => {
    overlapingTime()
    const currentDate = selectedDate || end
    setEndShow(false)
    setEnd(currentDate)
  }

  function showTimepicker (type) {
    if (startShow === true) {
      setStartShow(false)
    } else if (endShow === true) {
      setEndShow(false)
    } else if (type === 'start') {
      setStartShow(true)
    } else {
      setEndShow(true)
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

  function changeDay (i) {
    const change = [...daysUsed]
    change.splice(i, 1, !daysUsed[i])
    setDaysUsed(change)
  }

  async function sameName () {
    const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
    const savedTask =
      savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null
    for (let i = 0; i < daysUsed.length; i++) {
      if (daysUsed[i]) {
        if ((edit === true && name !== editName) || edit === false) {
          if (
            workTimes[0][i].some((element) => element.name === name) ||
            (weekly &&
              workTimes[1][i].some((element) => element.name === name)) ||
            savedTask[0][i].some((element) => element.name === name) ||
            (weekly && savedTask[1][i].some((element) => element.name === name))
          ) {
            {
              setSame(true)
              return true
            }
          }
        }
      }
    }
    setSame(false)
    return false
  }

  function overlapingTime () {
    for (let i = 0; i < daysUsed.length; i++) {
      if (daysUsed[i]) {
        const a = workTimes[0][i].findIndex((event) => event.name === editName)
        const b = workTimes[1][i].findIndex((event) => event.name === editName)
        if (
          workTimes[0][i].some(
            (element) =>
              roundTime(element.start) <= roundTime(start) &&
              roundTime(element.end) > roundTime(start) &&
              workTimes[0][i].indexOf(element) !== a
          ) ||
          workTimes[0][i].some(
            (element) =>
              roundTime(element.start) < roundTime(end) &&
              roundTime(element.end) >= roundTime(end) &&
              workTimes[0][i].indexOf(element) !== a
          ) ||
          workTimes[0][i].some(
            (element) =>
              roundTime(element.start) >= roundTime(start) &&
              roundTime(element.end) <= roundTime(end) &&
              workTimes[0][i].indexOf(element) !== a
          ) ||
          workTimes[0][i].some(
            (element) =>
              roundTime(element.start) <= roundTime(start) &&
              roundTime(element.end) >= roundTime(end) &&
              workTimes[0][i].indexOf(element) !== a
          ) ||
          (weekly &&
            workTimes[1][i].some(
              (element) =>
                roundTime(element.start) <= roundTime(start) &&
                roundTime(element.end) > roundTime(start) &&
                workTimes[1][i].indexOf(element) !== b
            )) ||
          (weekly &&
            workTimes[1][i].some(
              (element) =>
                roundTime(element.start) < roundTime(end) &&
                roundTime(element.end) >= roundTime(end) &&
                workTimes[1][i].indexOf(element) !== b
            )) ||
          (weekly &&
            workTimes[1][i].some(
              (element) =>
                roundTime(element.start) >= roundTime(start) &&
                roundTime(element.end) <= roundTime(end) &&
                workTimes[1][i].indexOf(element) !== b
            )) ||
          (weekly &&
            workTimes[1][i].some(
              (element) =>
                roundTime(element.start) <= roundTime(start) &&
                roundTime(element.end) >= roundTime(end) &&
                workTimes[1][i].indexOf(element) !== b
            ))
        ) {
          return true
        }
      }
    }
    return false
  }

  const handleSave = async () => {
    let sameTime = false
    await isRepeating()

    selectedTask = {
      name,
      pStart: roundTime(start),
      pEnd: roundTime(end),
      start: roundTime(start),
      end: roundTime(end),
      length: (roundTime(end) - roundTime(start)) / (60 * 1000),
      repeating,
      description,
      notificationId: null,
      notification
    }
    // console.log(selectedTask.length)
    // set sametime to true if the times overlap
    sameTime = overlapingTime()

    // Check if valid
    if (name === '') {
      setEmpty(true)
      Alert.alert('Empty Name', 'Please enter a name.')
    } else if (
      !(
        selectedTask.start != null &&
        selectedTask.end != null &&
        roundTime(selectedTask.end) - roundTime(selectedTask.start) >= 1
      )
    ) {
      Alert.alert(
        'Invalid Time',
        'The times that you have set for this task are invalid.'
      )
    } else if ((await sameName()) === true) {
      Alert.alert('Name Used', 'Name already used. Please select a new name.')
    } else if (sameTime === true) {
      Alert.alert(
        'Event Times Overlap',
        'The times that you have set for this event overlap with the times of another event.'
      )
    } else {
      const remove = !newInfo()
      // Put in task for all the days used
      for (let i = 0; i <= daysUsed.length - 1; i++) {
        if (daysUsed[i] === true) {
          if (edit === true) {
            if (
              workTimes[0][i].findIndex((task) => task.name === editName) !== -1
            ) {
              if (workTimes[0][i].notificationId != null) {
                await Notifications.cancelScheduledNotificationAsync(
                  workTimes[0][i][
                    workTimes[0][i].findIndex((task) => task.name === editName)
                  ].notificationId
                )
              }
            }
            workTimes[0][i].splice(
              workTimes[0][i].findIndex((task) => task.name === editName),
              1
            )
          }

          workTimes[0][i].push(selectedTask)
          if (selectedTask.notification !== '') {
            if (weekly) {
              workTimes[0][i][workTimes[0][i].length - 1].notificationId =
                await schedulePushNotification(selectedTask, i, true)
            } else {
              workTimes[0][i][workTimes[0][i].length - 1].notificationId =
                await schedulePushNotification(selectedTask, i, false)
            }
          }

          if (weekly === true) {
            if (edit === true) {
              workTimes[1][i].splice(
                workTimes[1][i].findIndex((task) => task.name === editName),
                1
              )
            }
            workTimes[1][i].push(selectedTask)
          }
        } else if (remove) {
          if (workTimes[0][i].some((task) => task.name === selectedTask.name)) {
            if (workTimes[0][i].notificationId != null) {
              await Notifications.cancelScheduledNotificationAsync(
                workTimes[0][i][
                  workTimes[0][i].findIndex((task) => task.name === editName)
                ].notificationId
              )
            }
            workTimes[0][i].splice(
              workTimes[0][i].findIndex(
                (task) => task.name === selectedTask.name
              ),
              1
            )
          }
          if (
            weekly === true &&
            workTimes[1][i].some((task) => task.name === selectedTask.name)
          ) {
            workTimes[1][i].splice(
              workTimes[1][i].findIndex(
                (task) => task.name === selectedTask.name
              ),
              1
            )
          }
        }
      }
      setEmpty(false)
      // save data
      try {
        const jsonValue = JSON.stringify(workTimes)
        await AsyncStorage.setItem('setTasks', jsonValue)
      } catch (e) {
        console.log(e)
      }

      // Go back to home page
      navigation.navigate('Home', { editName: selectedTask.name })
    }
  }

  // Set repeating
  function isRepeating () {
    let count = 0

    daysUsed.forEach((element) => {
      if (element) {
        count++
      }
    })

    if (weekly || count >= 2) {
      setRepeating(true)
    } else {
      setRepeating(false)
    }
    setReady(true)
  }

  if (!ready) {
    return null
  }
  return (
    <View style={styles.container}>
      <ScrollView style={{ padding: 10 }}>
        <Text style={{ fontSize: 20, padding: 4 }}>
          {days[new Date().getDay()]}, {monthNames[new Date().getMonth()]}{' '}
          {new Date().getDate()}
        </Text>
        <View style={{ flexDirection: 'column' }}>
          <View style={styles.section}>
            {/* <Text style={{ fontSize: 17, padding:3}}>Name:</Text> */}
            <Input
              multiline
              label="Name"
              placeholder="Add Name"
              renderErrorMessage={empty || same}
              errorMessage={
                empty
                  ? 'Please enter a name'
                  : same
                    ? 'Another task or event already has this name'
                    : null
              }
              onChangeText={(name) => {
                setName(name)
                sameName()
              }}
              value={name}
            />
          </View>
          <View style={styles.section}>
            <Input
              multiline
              label="Description"
              placeholder="Add Description"
              renderErrorMessage={false}
              onChangeText={(newDescription) => setDescription(newDescription)}
              value={description}
            />
          </View>
          <View style={styles.section}>
            <Button
              title={start != null ? displayTime(start) : 'Start'}
              buttonStyle={{ backgroundColor: '#6a99e6', margin: 10 }}
              onPress={() => showTimepicker('start')}
            />
            <Text
              h4
              h4Style={{ fontWeight: 'normal', fontSize: 18, margin: 10 }}
            >
              to
            </Text>
            <Button
              title={end != null ? displayTime(end) : 'End'}
              buttonStyle={{ backgroundColor: '#6a99e6', margin: 10 }}
              onPress={() => showTimepicker('end')}
            />
          </View>
          {/* start picker */}
          {startShow && (
            <DateTimePicker
              testID="startDateTimePicker"
              value={new Date(start)}
              mode={'time'}
              display="default"
              onChange={onStartChange}
            />
          )}

          {/* end picker */}
          {endShow && (
            <DateTimePicker
              testID="endDateTimePicker"
              value={new Date(end)}
              mode={'time'}
              display="default"
              onChange={onEndChange}
            />
          )}

          {start != null &&
          end != null &&
          roundTime(end) - roundTime(start) <= 0
            ? (
            <Text style={{ fontSize: 15, color: 'red', marginBottom: 15 }}>
              Events need to be at least 1 minute long!
            </Text>
              )
            : overlapingTime()
              ? (
            <Text style={{ fontSize: 15, color: 'red', marginBottom: 15 }}>
              Overlaping times!
            </Text>
                )
              : null}

          <Input
            label="Notifications"
            placeholder="None"
            keyboardType="numeric"
            onChangeText={(notification) => setNotification(notification)}
            value={Notifications !== '' ? notification.toString() : null}
          />
        </View>

        {/* <Text h1 h1Style={{ fontSize:16, color:'#8a939c'}}> Use for:</Text> */}
        <View
          style={[
            styles.section,
            { flexDirection: 'row', alignItems: 'center' }
          ]}
        >
          {newInfo()
            ? (
            <Text h1 h1Style={{ fontSize: 16, color: '#8a939c' }}>
              {' '}
              Edit on:
            </Text>
              )
            : (
            <Text h1 h1Style={{ fontSize: 16, color: '#8a939c' }}>
              {' '}
              Repeat on:
            </Text>
              )}
        </View>
        <CheckBox
          containerStyle={{
            backgroundColor: 'rgba(0,0,0,0)',
            borderWidth: 0
          }}
          title="Weekly"
          checked={weekly}
          onPress={() => setWeekly(!weekly)}
        />
        <View
          style={{
            padding: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {daysUsed.map((day, i) => {
            return (
              <Avatar
                key={i}
                containerStyle={
                  day === true
                    ? { backgroundColor: '#6a99e6', margin: 1 }
                    : { backgroundColor: 'gray', margin: 1 }
                }
                size="small"
                rounded
                title={days[i].slice(0, 1)}
                onPress={() => changeDay(i)}
              />
            )
          })}
        </View>
        {daysUsed.includes(true) === false
          ? (
          <Text style={{ fontSize: 15, color: 'red', alignSelf: 'center' }}>
            Nothing is selected!
          </Text>
            )
          : null}
      </ScrollView>
      <Button
        title="Save"
        buttonStyle={{
          backgroundColor: '#6a99e6',
          alignSelf: 'flex-end',
          bottom: 5,
          right: 5
        }}
        onPress={() => handleSave()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  },
  button: {
    backgroundColor: '#152075',
    padding: 6,
    margin: 10,
    borderRadius: 5
  },
  workButton: {
    backgroundColor: '#152075',
    padding: 6,
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
    flex: 4
  },
  section: {
    // backgroundColor:'blue',
    flexDirection: 'row',
    // justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: '3%'
  }
})
