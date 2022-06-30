/* eslint-disable multiline-ternary */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-expressions */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useEffect, useState, useRef } from 'react'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Icon,
  Divider,
  Overlay,
  Button,
  SpeedDial,
  ListItem,
  Tooltip,
  Text,
  Dialog,
  CheckBox,
  LinearProgress
} from 'react-native-elements'
import logo from './assets/Icon.png'
import controls from './assets/Controls.png'
import eventScreen from './assets/EventScreen.png'
import taskScreen from './assets/TaskScreen.png'
import homeScreen from './assets/HomeScreen.png'
import syncScreen from './assets/SyncScreen.png'
import top from './assets/Top.png'
// import { SpeedDial } from "@rneui/themed";
import DraggableFlatList, {
  ScaleDecorator
} from 'react-native-draggable-flatlist'
import * as Calendar from 'expo-calendar'
import ConfettiCannon from 'react-native-confetti-cannon'
// import Confetti from 'react-confetti'
import Confetti from 'react-native-confetti'
import { ConsoleSqlOutlined } from '@ant-design/icons'

let tasks = []
let setTasks = []
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
let confettiView

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
})

export default function HomeScreen ({ route, navigation }) {
  // eslint-disable-next-line prefer-const
  const { editName } = route.params

  const instructions = [
    {
      title: 'Welcome to CheckMate!',
      content:
        "Hi, I'm your personal productivity assistant. Let me give you a brief guide!",
      image: logo,
      width: 200,
      height: 200
    },
    {
      title: '1. Adding Tasks',
      content:
        'Before I can assist you, I need to know what tasks you need to work on. Add your tasks and fill out their parameters.',
      image: taskScreen,
      width: 200,
      height: 422.22
    },
    {
      title: '2. Adding Events',
      content:
        'I also need to know your events. Add your events and fill out their parameters.',
      image: eventScreen,
      width: 200,
      height: 422.22
    },
    {
      title: '3. Syncing With Calendar',
      content:
        'Would you like events from your calendar to be added to your schedule? You can change these preferences by holding the sync button at the top of the screen (pressing it will allow you to review and add your calendar events).',
      image: syncScreen,
      width: 200,
      height: 198.05
    },
    {
      title: '4. Making the Schedule',
      content:
        'This part is taken care for you. An optimized schedule using your tasks and events will be automatically created for you.',
      image: homeScreen,
      width: 200,
      height: 422.22
    },
    {
      title: '5. Using the Schedule',
      content:
        'Work at your own pace by selecting a task and using the buttons at the bottom of the screen to start, pause, finish, or edit it. Events will automatically be started when the time is right. Your schedule will automatically adjust for you.',
      image: controls,
      width: 200,
      height: 94.72
    },
    {
      title: 'Be Productive!',
      content:
        "That's all! Click on the '?' icon to see this tutorial again. Now go be productive!",
      image: top,
      width: 200,
      height: 91.38
    }
  ]

  const [avaliableTime, setAvaliableTime] = useState(0)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [taskIndex, setTaskIndex] = useState(0)
  const [selectable, setSelectable] = useState(true)
  const [instructionIndex, setInstructionIndex] = useState(-1)
  const [combined, setCombined] = useState([])
  const [syncOptions, setSyncOptions] = useState(false)
  const [error, setError] = useState(false)
  const [checked, setChecked] = useState(2)
  const [progress, setProgress] = useState(0)
  const [taskLength, setTaskLength] = useState(0)

  // get data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getData()
    })
    // getData()
    getSelectable()

    registerForPushNotificationsAsync().then()

    return () => {
      unsubscribe
    }
  }, [editName])

  useEffect(() => {
    const timer = setInterval(() => {
      makeCombined()
    }, 5000)
    return () => clearInterval(timer)
  }, [selectable, progress])

  useEffect(() => {
    if (tasks.length > 0) {
      setProgress(1 - tasks[0].length / taskLength)
    }
  }, [taskLength])

  async function schedulePushNotification (event, i) {
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
      trigger: new Date(
        new Date(
          new Date(
            new Date().setDate(new Date().getDate() + (i - new Date().getDay()))
          ).setHours(
            new Date(event.start).getHours(),
            new Date(event.start).getMinutes()
          )
        ).getTime() -
          event.notification * 60 * 1000
      )
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

  const getData = async () => {
    try {
      setReady(false)
      const promises = []
      promises.push(new Promise(savedTasks))
      promises.push(new Promise(savedSetTasks))
      promises.push(new Promise(changeDay))
      promises.push(new Promise(firstTime))
      await Promise.all(promises).then(
        () => {
          // fulfillment
          const newCombined = [...makeCombined()]
          if (editName !== '') {
            if (newCombined.some((task) => task.name === editName)) {
              setTaskIndex(
                newCombined.findIndex((task) => task.name === editName)
              )
            } else {
              setTaskIndex(0)
            }
          } else {
            setTaskIndex(0)
          }

          setReady(true)
        },
        () => {
          // rejection
          console.log('uh oh')
        }
      )
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  async function getSyncEvents (edit) {
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status === 'granted') {
      manageSyncEvents(edit)
    }
  }

  async function reviewEvents () {
    let events = []
    setError(false)
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      )
      const calendarIds = calendars.map((calendar) => calendar.id)
      events = await Calendar.getEventsAsync(
        calendarIds,
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999))
      )
      events = events.filter(
        (event) => time(event.endDate).getTime() > time(new Date()).getTime()
      )
    }

    navigation.navigate('SyncEvents', {
      events,
      checkedEvents: checkEvents(events)
    })
  }

  async function setSyncPreferences (syncedEvents) {
    try {
      const jsonValue = JSON.stringify(syncedEvents)
      await AsyncStorage.setItem('syncEvents5', jsonValue)
      if (syncedEvents === 'always') {
        syncEvents()
      } else if (syncedEvents === 'review') {
        reviewEvents()
      }
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  async function manageSyncEvents (edit) {
    const JsonValue = await AsyncStorage.getItem('syncEvents5')
    const syncEvents = JsonValue != null ? JSON.parse(JsonValue) : null
    if (syncEvents == null || edit) {
      setSyncOptions(true)
    } else {
      await setSyncPreferences(syncEvents)
    }
  }

  function checkEvents (events) {
    // console.log(events)
    const newEvents = events.filter((event) => {
      const a = setTasks.findIndex((setTask) => event.title === setTask.name)
      return (
        !setTasks.some((element) => element.name === event.title) &&
        !(
          setTasks.some(
            (element) =>
              time(element.start) <= time(event.startDate) &&
              time(element.end) > time(event.startDate) &&
              setTasks.indexOf(element) !== a
          ) ||
          setTasks.some(
            (element) =>
              time(element.start) < time(event.endDate) &&
              time(element.end) >= time(event.endDate) &&
              setTasks.indexOf(element) !== a
          ) ||
          setTasks.some(
            (element) =>
              time(element.start) >= time(event.startDate) &&
              time(element.end) <= time(event.endDate) &&
              setTasks.indexOf(element) !== a
          ) ||
          setTasks.some(
            (element) =>
              time(element.start) <= time(event.startDate) &&
              time(element.end) >= time(event.endDate) &&
              setTasks.indexOf(element) !== a
          )
        )
      )
    })
    return newEvents
  }

  async function getEvents () {
    let events
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      )
      const calendarIds = calendars.map((calendar) => calendar.id)
      events = await Calendar.getEventsAsync(
        calendarIds,
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999))
      )
      events = events.filter(
        (event) => time(event.endDate).getTime() > time(new Date()).getTime()
      )
    }
    return events
  }

  async function syncEvents () {
    let events
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      )
      const calendarIds = calendars.map((calendar) => calendar.id)
      events = await Calendar.getEventsAsync(
        calendarIds,
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999))
      )
      events = events.filter(
        (event) => time(event.endDate).getTime() > time(new Date()).getTime()
      )
    }
    let newEvents = checkEvents(events)
    const originalNewEvents = []
    for (let i = 0; i < newEvents.length; i++) {
      const event = newEvents[i]
      originalNewEvents.push(event)
      setTasks.push({
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
      if (event.location !== '') {
        setTasks[setTasks.length - 1].description +=
          ' At ' + event.location + '.'
      }
      i--
      newEvents = checkEvents(events)
    }
    // add events in Events but not in newEvents to reviewEvents
    const reviewEvents = events.filter((event) => {
      return !originalNewEvents.some(
        (element) => element.title === event.title
      )
    })
    if (reviewEvents.length > 0) {
      setError(true)
    }
    sortTimes()
    saveTasks()
    makeCombined()
  }

  const firstTime = async (resolve, reject) => {
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      const first = JsonValue != null ? JSON.parse(JsonValue) : null
      if (first == null) {
        setInstructionIndex(0)
        const jsonValue = JSON.stringify(false)
        await AsyncStorage.setItem('firsty', jsonValue)
      }

      resolve(true)
    } catch (e) {
      reject(e)
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  const savedTasks = async (resolve, reject) => {
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      const first = JsonValue != null ? JSON.parse(JsonValue) : true
      const dayJsonValue = await AsyncStorage.getItem('day')
      let day = dayJsonValue != null ? JSON.parse(dayJsonValue) : null
      let oldTasks = []
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      let savedTask =
        savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null

      if (first) {
        day = null
        savedTask = null
      }

      let needUpdate = false
      // Set up savedTask
      if (savedTask == null) {
        needUpdate = true
        savedTask = [new Array(7), new Array(7)]
        savedTask.forEach((element) => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        })
      }
      // If it is a new day
      if (
        day != null &&
        new Date(new Date().setHours(0, 0, 0, 0)).getTime() !==
          new Date(day).getTime()
      ) {
        oldTasks = [...savedTask[0][new Date(day).getDay()]]
        // If it is a new week, set the week's tasks to the weekly ones
        if (
          new Date(new Date().setHours(0, 0, 0, 0)).getTime() -
            new Date(day).getTime() >
          (new Date().getDay() - new Date(day).getDay()) * 1000 * 60 * 60 * 24
        ) {
          savedTask[0] = [...savedTask[1]]
        }

        // Shift due dates
        savedTask[0][new Date().getDay()].forEach((e) => {
          if (e.repeating === true) {
            const d = new Date().setHours(0, 0, 0, 0)
            e.date = new Date(new Date(d).getTime() + e.dueIncrease)
            e.sortValue = updateSortValue(e)
          }
        })
        // Remove or edit recuring tasks
        for (let i = 0; i < oldTasks.length; i++) {
          const newIndex = savedTask[0][new Date().getDay()].findIndex(
            (element) => element.name === oldTasks[i].name
          )
          if (newIndex !== -1) {
            if (savedTask[0][new Date().getDay()][newIndex].overridable) {
              oldTasks.splice(i, 1)
              i--
            } else {
              savedTask[0][new Date().getDay()][newIndex].length = parseInt(
                savedTask[0][new Date().getDay()][newIndex].length
              )
              oldTasks[i].length = parseInt(oldTasks[i].length)
              savedTask[0][new Date().getDay()][newIndex].length =
                parseInt(savedTask[0][new Date().getDay()][newIndex].length) +
                oldTasks[i].length
              savedTask[0][new Date().getDay()][newIndex].sortValue =
                updateSortValue(savedTask[0][new Date().getDay()][newIndex])
              oldTasks.splice(i, 1)
              i--
              savedTask[0][new Date().getDay()][newIndex].repeating = false
            }
          }
        }
        tasks = oldTasks.concat(savedTask[0][new Date().getDay()])
        savedTask[0][new Date().getDay()] = [...tasks]
      } else {
        // console.log(savedTask[0][new Date().getDay()])
        tasks = savedTask[0][new Date().getDay()]
      }

      if (first && !needUpdate) {
        tasks.forEach((element) => {
          element.sortValue = updateSortValue(element)
          element.repeating = false
        })
      }
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('tasks', jsonValue)
      resolve(true)
    } catch (e) {
      reject(e)
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  const savedSetTasks = async (resolve, reject) => {
    try {
      // await AsyncStorage.removeItem('setTasks', jsonValue)
      const JsonValue = await AsyncStorage.getItem('firsty')
      const first = JsonValue != null ? JSON.parse(JsonValue) : true
      const dayJsonValue = await AsyncStorage.getItem('day')
      let day = dayJsonValue != null ? JSON.parse(dayJsonValue) : null
      const savedTaskJsonValue = await AsyncStorage.getItem('setTasks')
      let savedTask =
        savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null

      if (first) {
        day = null
        savedTask = null
      }

      let needUpdate = false
      // Set up savedTask
      if (savedTask == null) {
        needUpdate = true
        savedTask = [new Array(7), new Array(7)]
        savedTask.forEach((element) => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        })
      }
      // If it is a new day
      if (
        day != null &&
        new Date(new Date().setHours(0, 0, 0, 0)).getTime() !==
          new Date(day).getTime()
      ) {
        // If it is a new week, set the week's tasks to the weekly ones
        if (
          new Date(new Date().setHours(0, 0, 0, 0)).getTime() -
            new Date(day).getTime() >
          (new Date().getDay() - new Date(day).getDay()) * 1000 * 60 * 60 * 24
        ) {
          savedTask[0] = [...savedTask[1]]
        }

        // Shift times
        savedTask[0][new Date().getDay()].forEach((e) => {
          if (e.repeating === true) {
            e.start = new Date().setHours(
              new Date(e.start).getHours(),
              new Date(e.start).getMinutes()
            )
            e.end = new Date().setHours(
              new Date(e.end).getHours(),
              new Date(e.end).getMinutes()
            )
          }
        })
        setTasks = [...savedTask[0][new Date().getDay()]]
      } else {
        setTasks = savedTask[0][new Date().getDay()]
      }

      if (first && !needUpdate) {
        setTasks.forEach((element) => {
          element.repeating = false
        })
      }
      sortTimes()
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('setTasks', jsonValue)
      resolve(true)
    } catch (e) {
      reject(e)
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  function updateSortValue (element) {
    return (
      parseInt(
        new Date(element.date).getTime() / (1000 * 60 * 60) +
          (6 - element.dueImportance) * 2 * (11 - element.importance)
      ) +
      parseInt(element.length) / 10
    )
  }

  const changeDay = async (resolve, reject) => {
    try {
      const dayJsonValue = await AsyncStorage.getItem('day')
      let day = dayJsonValue != null ? JSON.parse(dayJsonValue) : null
      if (
        day == null ||
        new Date(new Date().setHours(0, 0, 0, 0)).getTime() !==
          new Date(day).getTime()
      ) {
        day = new Date().setHours(0, 0, 0, 0)
        const jsonValue = JSON.stringify(day)
        await AsyncStorage.setItem('day', jsonValue)
        const JsonValue = await AsyncStorage.getItem('firsty')
        const first = JsonValue != null ? JSON.parse(JsonValue) : null
        if (first != null) {
          await getSyncEvents(false)
        }
      }
      resolve(true)
    } catch (e) {
      reject(e)
      console.log(e)
    }
  }

  async function getSelectable () {
    const JsonValue = await AsyncStorage.getItem('selectable')
    const JsonValueT = await AsyncStorage.getItem('sTask')
    const selectable1 = JsonValue != null ? JSON.parse(JsonValue) : true
    let test
    if (!selectable1) {
      test = JsonValueT != null ? JSON.parse(JsonValueT) : null
    }
    setSelectable(selectable1)
  }

  // Find day and time
  function day (time) {
    return (
      Math.floor(new Date() / (60 * 1000 * 60 * 24)) -
      Math.floor(new Date(time) / (60 * 1000 * 60 * 24))
    )
  }

  function time (t) {
    return new Date(Math.floor(new Date(t) / (60 * 1000)) * 60 * 1000)
  }

  // Update setTasks based on current time
  function sortSetTasks () {
    for (let i = 0; i <= setTasks.length - 1; i++) {
      if (time(new Date(setTasks[i].end).getTime()) <= time(new Date())) {
        setTasks.splice(i, 1)
        i--
      } else if (
        time(new Date(setTasks[i].start).getTime()) < time(new Date())
      ) {
        setTasks[i].start = time(new Date())
      }
    }
  }

  // Combine tasks and setTasks
  function makeCombined () {
    let setIndex = 0
    let tempAvaliable = 0
    // var splitTask = false
    const tempC = []
    sortSetTasks()
    if (tasks.length > 0 || setTasks.length > 0) {
      let tempTime = time(new Date())
      if (
        combined.length > 0 &&
        combined[0].sortValue == null &&
        setTasks.length > 0
      ) {
        setTasks[0].length =
          (time(setTasks[0].end).getTime() -
            time(setTasks[0].start).getTime()) /
          (1000 * 60)
      }
      if (selectable === false && tasks.length > 0) {
        // console.log('in')
        tasks[0].length -=
          (time(new Date()).getTime() - time(tasks[0].start).getTime()) /
          (1000 * 60)
        if (tasks[0].length <= 0) {
          tasks[0].length = 10
          setTaskLength(tasks[0].length)
        }
        setProgress(1 - tasks[0].length / taskLength)

        // console.log(tasks[0].length + ' ' + taskLength)
      }
      for (let i = 0; i <= tasks.length - 1; i++) {
        if (
          setIndex < setTasks.length - 1 ||
          (setIndex < setTasks.length &&
            time(tempTime).getTime() < time(setTasks[setIndex].start).getTime())
        ) {
          if (
            time(tempTime).getTime() ===
            time(setTasks[setIndex].start).getTime()
          ) {
            // Add set task
            // console.log("Add set task: "+setTasks[setIndex].name)
            tempTime = setTasks[setIndex].end
            tempC.push({ ...setTasks[setIndex] })
            tempAvaliable +=
              (time(setTasks[setIndex].end).getTime() -
                time(setTasks[setIndex].start).getTime()) /
              (1000 * 60)
            setIndex++
          }
          if (
            tasks[i].length <=
            Math.floor(
              (time(setTasks[setIndex].start).getTime() -
                time(tempTime).getTime()) /
                (1000 * 60)
            )
          ) {
            // Task length <= time until set task -> add task
            // console.log("Task length <= time until set task -> add task: "+tasks[i].name)
            tasks[i].start = tempTime
            tasks[i].end = time(
              new Date(tempTime).getTime() + tasks[i].length * 1000 * 60
            )
            tempTime = new Date(tasks[i].end)
            tempC.push({ ...tasks[i] })
            tempAvaliable += parseInt(tasks[i].length)
          } else if (
            Math.floor(
              (time(setTasks[setIndex].start).getTime() -
                time(tempTime).getTime()) /
                (1000 * 60)
            ) > 0
          ) {
            // Split Task
            // console.log("Split Task: "+tasks[i].name)
            tasks[i].start = tempTime
            tasks[i].end = time(setTasks[setIndex].start)
            tempTime = tasks[i].end
            tempC.push({ ...tasks[i] })
            tasks.splice(i + 1, 0, { ...tasks[i] })
            tasks[i + 1].length -=
              (time(tasks[i].end) - time(tasks[i].start)) / (1000 * 60)
            if (
              !(
                tasks[i].name.substring(tasks[i].name.length - 8) === ' (cont.)'
              )
            ) {
              tasks[i + 1].name = tasks[i].name + ' (cont.)'
            }
            tempAvaliable +=
              (time(tasks[i].end) - time(tasks[i].start)) / (1000 * 60)
          } else {
            i--
          }
        } else if (setTasks.length > 0 && setIndex === setTasks.length - 1) {
          if (
            time(tempTime).getTime() !==
            time(setTasks[setIndex].start).getTime()
          ) {
            tempC.push({
              break: true,
              end: time(setTasks[setIndex].start),
              length:
                (time(setTasks[setIndex].start).getTime() -
                  time(tempTime).getTime()) /
                (1000 * 60),
              name: 'Break'
            })
          }
          // console.log("last setTask: "+setTasks[setIndex].name)
          tempTime = setTasks[setIndex].end
          tempC.push({ ...setTasks[setIndex] })
          tempAvaliable +=
            (time(setTasks[setIndex].end).getTime() -
              time(setTasks[setIndex].start).getTime()) /
            (1000 * 60)
          setIndex++
        }
        if (setIndex === setTasks.length) {
          // no more set tasks -> Add task
          // console.log("no more set tasks -> Add task: "+tasks[i].name)
          tasks[i].start = tempTime
          tasks[i].end = new Date(
            time(time(tempTime).getTime() + tasks[i].length * 1000 * 60)
          )
          tempC.push({ ...tasks[i] })
          tempAvaliable += tasks[i].length
          tempTime = tasks[i].end
        }

        if (
          i > 0 &&
          tasks[i].name.substring(tasks[i].name.length - 8) === ' (cont.)'
        ) {
          tasks.splice(i, 1)
          i -= 1
        }
      }
      // Add remaining setTasks
      for (setIndex; setIndex < setTasks.length; setIndex++) {
        if (
          time(tempTime).getTime() !== time(setTasks[setIndex].start).getTime()
        ) {
          tempC.push({
            break: true,
            end: time(setTasks[setIndex].start),
            length:
              (time(setTasks[setIndex].start).getTime() -
                time(tempTime).getTime()) /
              (1000 * 60),
            name: 'Break'
          })
        }
        tempC.push({ ...setTasks[setIndex] })
        tempTime = time(setTasks[setIndex].end)
        tempAvaliable +=
          (time(setTasks[setIndex].end).getTime() -
            time(setTasks[setIndex].start).getTime()) /
          (1000 * 60)
      }
    }
    // Round avaliable time to the nearest whole number
    setAvaliableTime(Math.round(tempAvaliable))
    setCombined(tempC)

    return tempC
  }

  function displayTimeLeft (time) {
    let hours = ''
    let minutes = ''
    const inbetween = ''
    if (Math.floor(time / 60) > 0) {
      if (Math.floor(time / 60) === 1) {
        hours = '1 hour'
      } else {
        hours = Math.floor(time / 60) + ' hours'
      }
    }
    if (time % 60 > 0) {
      if (Math.floor(time % 60) === 1) {
        minutes = '1 minute'
      } else {
        minutes = Math.floor(time % 60) + ' minutes'
      }
    }
    return hours + ' ' + minutes
  }

  function renderItem (item) {
    const index = item.index
    const drag = item.drag
    const isActive = item.isActive
    item = item.item

    // if (item.break == null) {
    return (
      <ScaleDecorator>
        {index === 0
          ? (
          <Text style={{ alignSelf: 'flex-start', marginLeft: 3 }}>
            {displayTime(combined[0].start)}
          </Text>
            )
          : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ alignSelf: 'flex-end' }}>{displayTime(item.end)}</Text>
          <TouchableOpacity
            style={{ flexGrow: 1, marginBottom: 15, marginLeft: 15 }}
            onLongPress={
              item.sortValue != null &&
              item.name.substring(item.name.length - 8) !== ' (cont.)'
                ? drag
                : null
            }
            disabled={isActive || item.break != null}
            onPress={() =>
              item.name.substring(item.name.length - 8) !== ' (cont.)'
                ? setTaskIndex(index)
                : setTaskIndex(
                  combined.findIndex(
                    (task) =>
                      task.name ===
                        item.name.substring(0, item.name.length - 8)
                  )
                )
            }
          >
            <ListItem
              bottomDivider
              containerStyle={
                taskIndex === index
                  ? {
                      backgroundColor: '#6a99e6',
                      borderRadius: 10,
                      height: item.length * 2 < 60 ? 60 : item.length * 2
                    }
                  : item.break == null
                    ? {
                        borderRadius: 10,
                        height: item.length * 2 < 60 ? 60 : item.length * 2
                      }
                    : {
                        backgroundColor: '#cacccb',
                        borderRadius: 10,
                        height: item.length * 2 < 60 ? 60 : item.length * 2
                      }
              }
            >
              {item.sortValue <
              new Date(new Date().setHours(24, 0, 0, 0)).getTime() /
                (1000 * 60 * 60) +
                (6 - 4) * 2 * (11 - 7) +
                60 / 10
                ? (
                <Icon
                  name="exclamation"
                  type="font-awesome"
                  color="red"
                  size={20}
                />
                  )
                : null}
              <ListItem.Content
                style={item.break != null ? { alignItems: 'center' } : null}
              >
                <ListItem.Title
                  style={
                    taskIndex !== index
                      ? item.break == null
                        ? { fontWeight: 'bold', color: 'gray' }
                        : { fontWeight: 'bold', color: 'white', fontSize: 20 }
                      : { fontWeight: 'bold', color: 'white' }
                  }
                >
                  {item.name}
                </ListItem.Title>
                {/* <ListItem.Subtitle
                    style={
                      taskIndex === index ? { color: 'white' } : null
                    }
                  >
                    {displayTime(item.start) +
                      ' - ' +
                      displayTime(item.end)}
                  </ListItem.Subtitle> */}
                {item.sortValue != null
                  ? (
                  <ListItem.Subtitle
                    style={taskIndex === index ? { color: 'white' } : null}
                  >
                    {'Due: ' +
                      days[new Date(item.date).getDay()] +
                      ' ' +
                      displayDate(item.date) +
                      ' ' +
                      displayTime(item.date)}
                  </ListItem.Subtitle>
                    )
                  : null}
                {item.length > 45
                  ? (
                  <ListItem.Subtitle
                    style={taskIndex === index ? { color: 'white' } : null}
                  >
                    {displayTimeLeft(item.length)}
                  </ListItem.Subtitle>
                    )
                  : null}
              </ListItem.Content>
            </ListItem>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    )
  }

  function setData (data) {
    tasks = data.data.filter(
      (task) =>
        task.sortValue != null &&
        task.name.substring(task.name.length - 8) !== ' (cont.)'
    )
    // console.log("setData "+tasks[0].name)
    makeCombined()
  }

  // Task controls
  function start () {
    if (combined[taskIndex].sortValue == null) {
      Alert.alert(
        "Events can't be started",
        'They will automatically start once it is the starting time.'
      )
    } else if (
      setTasks.length > 0 &&
      time(new Date()).getTime() >= time(setTasks[0].start).getTime()
    ) {
      Alert.alert(
        'Event in progress',
        'You can start this task when the event has finished.'
      )
    } else {
      // console.log("in")
      setSelectable(false)
      const selectedTask = combined[taskIndex]
      // remove selectedTask from tasks
      tasks.splice(
        tasks.findIndex((task) => task.name === selectedTask.name),
        1
      )
      setTaskIndex(0)
      tasks.splice(0, 0, selectedTask)
      tasks[0].start = Date.now()
      setTaskLength(tasks[0].length)
      saveTasks()
      saveSelectable()
      setReady(true)
      // console.log("start"+ tasks[0].name)
      makeCombined()
    }
  }

  function pause () {
    setReady(true)
    setSelectable(true)
    tasks[0].sortValue = updateSortValue(tasks[0])
    saveTasks()
    removeSelectable()
    makeCombined()
  }

  function stop () {
    Alert.alert(
      'Are you sure?',
      'This task/event will be removed permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => remove() }
      ],
      { cancelable: true }
    )
  }

  function remove () {
    setProgress(1)
    setTimeout(
      async function () {
        if (confettiView) {
          confettiView.startConfetti()
        }
        removeSelectable()
        // console.log(combined[taskIndex])
        if (combined[taskIndex].sortValue != null) {
          // remove combined[taskIndex] from tasks
          tasks.splice(
            tasks.findIndex((task) => task.name === combined[taskIndex].name),
            1
          )
        } else {
          // remove combined[taskIndex] from setTasks
          if (combined[taskIndex].notificationId != null) {
            await Notifications.cancelScheduledNotificationAsync(
              combined[taskIndex].notificationId
            )
          }
          setTasks.splice(
            setTasks.findIndex(
              (task) => task.name === combined[taskIndex].name
            ),
            1
          )
        }
        saveTasks()
        // explosion && explosion.start()
        setTaskIndex(0)
        setSelectable(true)
        setReady(true)
        makeCombined()
      },
      selectable === false ? 1000 : 0
    )
  }

  // Store selectable(working on task) status
  async function saveSelectable () {
    try {
      const jsonValue = JSON.stringify(false)
      await AsyncStorage.setItem('selectable', jsonValue)
      const sTjsonValue = JSON.stringify(tasks[taskIndex])
      await AsyncStorage.setItem('sTask', sTjsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  async function removeSelectable () {
    try {
      const jsonValue = JSON.stringify(true)
      await AsyncStorage.setItem('selectable', jsonValue)
      const sTjsonValue = JSON.stringify(null)
      await AsyncStorage.setItem('sTask', sTjsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  // Save tasks
  async function saveTasks () {
    try {
      // console.log("saveTasks1 "+tasks[0].name)
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      let savedTask =
        savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null
      savedTask[0][new Date().getDay()] = [...tasks]
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('tasks', jsonValue)

      const savedSetTaskJsonValue = await AsyncStorage.getItem('setTasks')
      savedTask =
        savedSetTaskJsonValue != null
          ? JSON.parse(savedSetTaskJsonValue)
          : null
      savedTask[0][new Date().getDay()] = [...setTasks]
      const setJsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('setTasks', setJsonValue)
      // console.log("saveTasks2 "+tasks[0].name)
      // makeCombined()
    } catch (e) {
      console.log(e)
    }
  }

  // Sort tasks
  function sortTask () {
    // console.log("hmmmmm")
    // console.log("sortTask "+tasks[0].name)
    const beforeTask = [...combined][taskIndex]

    tasks.sort(function (a, b) {
      return a.sortValue - b.sortValue
    })

    saveTasks()
    const newCombined = makeCombined()
    setTaskIndex(
      newCombined.findIndex((task) => task.name === beforeTask.name)
    )
  }

  function sortTimes () {
    setTasks.sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
    // console.log("sortTimes "+tasks[0].name)
    makeCombined()
  }

  // Get task information
  function displayTime (date) {
    let hours = new Date(date).getHours()
    const minutes = new Date(date).getMinutes()
    let amPm = ' am'
    if (hours >= 12) {
      amPm = ' pm'
    }
    if (hours === 0) {
      hours = 12
    }
    if (hours > 12) {
      hours -= 12
    }
    if (hours < 10) {
      hours = ' ' + hours
    }
    if (minutes < 10) {
      return hours + ':' + '0' + minutes + amPm
    }
    return hours + ':' + minutes + amPm
  }

  function displayDate (date) {
    const month = new Date(date).getMonth() + 1
    const day = new Date(date).getDate()
    return month + '/' + day
  }

  // function taskName () {
  //   if (combined.length > 0) {
  //     return combined[taskIndex].name
  //   }
  //   return 'Add a Task'
  // }

  // Editing
  async function editTask () {
    try {
      saveTasks()
      // console.log(combined[taskIndex])
      if (
        combined[taskIndex].sortValue !== undefined &&
        combined[taskIndex].sortValue != null
      ) {
        navigation.navigate('AddTask', { editName: combined[taskIndex].name })
      } else {
        navigation.navigate('AddWorkTime', {
          editName: combined[taskIndex].name
        })
      }
    } catch (e) {
      Alert.alert(
        'Error getting task edit info!',
        'Failed to get task edit info! Please try again.'
      )
      console.log(e)
    }
  }

  function resetOrder () {
    const original = [...tasks]
    const temp = tasks.sort(function (a, b) {
      return a.sortValue - b.sortValue
    })
    tasks = [...original]
    // saveTasks()
    // Check if tasks and temp are identical arrays
    return JSON.stringify(tasks) !== JSON.stringify(temp)
  }

  if (!ready) {
    return null
  }
  return (
    // null
    <SafeAreaView style={styles.container}>
      <Dialog
        isVisible={syncOptions}
        onBackdropPress={() => setSyncOptions(false)}
        overlayStyle={{ backgroundColor: 'white' }}
      >
        <Dialog.Title title="When do you want to sync with calendar events?" />
        {['Never', 'After Review', 'Always'].map((l, i) => (
          <CheckBox
            key={i}
            title={l}
            containerStyle={{ backgroundColor: 'white', borderWidth: 0 }}
            checkedIcon="dot-circle-o"
            uncheckedIcon="circle-o"
            checked={checked === i + 1}
            onPress={() => setChecked(i + 1)}
          />
        ))}

        <Dialog.Actions>
          <Dialog.Button
            title="CONFIRM"
            onPress={() => {
              if (checked === 1) {
                setSyncPreferences('never')
              } else if (checked === 2) {
                setSyncPreferences('review')
              } else {
                setSyncPreferences('always')
              }
              setSyncOptions(false)
            }}
          />
        </Dialog.Actions>
      </Dialog>

      {instructions.map((l, i) => (
        <Dialog
          isVisible={instructionIndex === i}
          overlayStyle={{ backgroundColor: 'white' }}
          key={i}
        >
          <Dialog.Title title={l.title} style={{ textAlign: 'center' }} />
          <Image
            style={{
              width: l.width,
              height: l.height,
              alignSelf: 'center',
              marginBottom: 10
            }}
            source={l.image}
          />
          <Text style={{ alignSelf: 'center' }}>{l.content}</Text>
          {i === 3
            ? ['Never', 'After Review', 'Always'].map((t, k) => (
                <CheckBox
                  key={k}
                  title={t}
                  containerStyle={{
                    backgroundColor: 'white',
                    borderWidth: 0
                  }}
                  checkedIcon="dot-circle-o"
                  uncheckedIcon="circle-o"
                  checked={checked === k + 1}
                  onPress={() => setChecked(k + 1)}
                />
              ))
            : null}

          <Dialog.Actions>
            {i === 3
              ? (
              <Dialog.Button
                title="NEXT"
                onPress={() => {
                  if (checked === 1) {
                    async () => {
                      const jsonValue = JSON.stringify('never')
                      await AsyncStorage.setItem('syncEvents5', jsonValue)
                    }
                  } else if (checked === 2) {
                    async () => {
                      const jsonValue = JSON.stringify('review')
                      await AsyncStorage.setItem('syncEvents5', jsonValue)
                    }
                  } else {
                    async () => {
                      const jsonValue = JSON.stringify('always')
                      await AsyncStorage.setItem('syncEvents5', jsonValue)
                    }
                  }
                  setInstructionIndex(i + 1)
                }}
              />
                )
              : i <= instructions.length - 1
                ? (
              <Dialog.Button
                title={i === instructions.length - 1 ? 'CLOSE' : 'NEXT'}
                onPress={() => setInstructionIndex(i + 1)}
              />
                  )
                : null}
            {i > 0
              ? (
              <Dialog.Button
                title="PREVIOUS"
                onPress={() => setInstructionIndex(i - 1)}
              />
                )
              : null}
          </Dialog.Actions>
        </Dialog>
      ))}

      <View style={{ flex: 9 }}>
        <View style={styles.top}>
          <Icon
            name="question-circle"
            type="font-awesome-5"
            size={25}
            onPress={() => setInstructionIndex(0)}
            solid={true}
          />
          <View>
            {!error ? (
              <Icon
                name="sync"
                type="material"
                size={30}
                // color='red'
                onPress={() => reviewEvents()}
                onLongPress={() => getSyncEvents(true)}
              />
            ) : (
              <Icon
                name="sync-problem"
                type="material"
                size={30}
                // color='red'
                onPress={() => {
                  reviewEvents()
                }}
                onLongPress={() => getSyncEvents(true)}
              />
            )}
          </View>
          <Icon
            name="settings"
            type="material"
            size={25}
            onPress={() => navigation.navigate('Settings')}
            solid={true}
          />
        </View>
        <View style={{ flex: 10, marginHorizontal: 20 }}>
          {combined.length === 0
            ? (
            <View
              style={{
                margin: 20,
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Image style={{ width: 200, height: 200 }} source={logo} />
              <Text h3 h3Style={{ fontWeight: 'normal', textAlign: 'center' }}>
                No tasks or events currently.
              </Text>
            </View>
              )
            : null}
          <DraggableFlatList
            containerStyle={{ flex: 10, marginHorizontal: 3 }}
            // debug={true}
            data={combined}
            onDragEnd={(data) => setData(data)}
            keyExtractor={(item, index) => {
              item.name != null ? item.name + '' + index : index
            }}
            renderItem={(item) => renderItem(item)}
          />
        </View>
        {resetOrder() ? (
          <View style={{ marginHorizontal: 20 }}>
            <View style={{ padding: 8 }}>
              <Button
                // raised={true}
                title="Optimize Order"
                buttonStyle={{ backgroundColor: '#1c247a' }}
                onPress={() => sortTask()}
              />
            </View>
          </View>
        ) : null}
        <SpeedDial
          isOpen={open}
          icon={{ name: 'add', color: '#fff' }}
          openIcon={{ name: 'close', color: '#fff' }}
          onOpen={() => setOpen(!open)}
          onClose={() => setOpen(!open)}
          color="#6a99e6"
          // make overlay transparent
          overlayColor="rgba(0,0,0,0)"
          transitionDuration={40}
        >
          <Tooltip
            // toggleAction="onLongPress"
            height={60}
            popover={<Text>Tasks can be done at any time</Text>}
          >
            <SpeedDial.Action
              icon={{ name: 'check-square', color: '#fff', type: 'feather' }}
              title="Task"
              onPress={() => {
                setOpen(false)
                navigation.navigate('AddTask', { editName: '' })
              }}
              color="#6a99e6"
            />
          </Tooltip>
          <Tooltip
            // toggleAction="onLongPress"
            height={60}
            popover={<Text>Events are done at a preset time</Text>}
          >
            <SpeedDial.Action
              icon={{ name: 'clock', color: '#fff', type: 'feather' }}
              title="Event"
              onPress={() => {
                setOpen(false)
                navigation.navigate('AddWorkTime', { editName: '' })
              }}
              color="#6a99e6"
            />
          </Tooltip>
        </SpeedDial>
        {selectable === false ? (
          <Overlay onBackdropPress={() => setSelectable(true)}>
            <Text h2 style={{ margin: 10 }}>
              {combined[taskIndex].name}
            </Text>
            {combined[taskIndex].description !== ''
              ? (
              <Text h3 h3Style={{ margin: 10, fontWeight: 'normal' }}>
                {combined[taskIndex].description}
              </Text>
                )
              : null}
            <View>
              <LinearProgress
                style={{ marginVertical: 10 }}
                value={progress}
                variant="determinate"
                color="blue"
              />
            </View>
            <Text h4 h4Style={{ margin: 10, fontWeight: 'normal' }}>
              {combined[taskIndex].length + ' minutes left'}
            </Text>
            <View
              style={{
                justifyContent: 'space-between',
                flexDirection: 'row',
                alignSelf: 'stretch'
              }}
            >
              <Icon
                name="pause-circle"
                size={30}
                type="font-awesome"
                // color={"white"}
                onPress={() => pause()}
                style={{ margin: 10 }}
              />
              <Icon
                name="stop-circle"
                type="font-awesome"
                size={30}
                onPress={combined.length > 0 ? () => stop() : null}
                style={{ margin: 10 }}
              />
              <Icon
                name="pencil-circle"
                type="material-community"
                size={30}
                onPress={() => {
                  pause()
                  editTask()
                }}
                style={{ margin: 10 }}
              />
            </View>
          </Overlay>
        ) : null}
      </View>
      <Divider style={{ backgroundColor: 'gray' }} />

      {/* Task controls display */}
      <View style={styles.selectView}>
        {/* <View style={styles.inSelection}>
        <Text style={{ fontSize: 20}}>{taskName()}</Text>
        <Icon color={selectable==false||combined.length==0?'gray':'black'} name="pencil-alt" type='font-awesome-5' onPress={selectable==false||combined.length==0?null:() => editTask()}/>
      </View> */}
        <View style={styles.inSelection}>
          {selectable === true ? (
            <Icon
              name="play-circle"
              type="font-awesome"
              size={30}
              // color={'white'}
              onPress={() => start()}
              disabled={combined.length < 0}
            />
          ) : (
            <Icon
              name="pause-circle"
              size={30}
              type="font-awesome"
              // color={"white"}
              onPress={() => pause()}
            />
          )}
          <Icon
            name="stop-circle"
            type="font-awesome"
            size={30}
            onPress={combined.length > 0 ? () => stop() : null}
          />
          <Icon
            name="pencil-circle"
            type="material-community"
            size={30}
            onPress={
              selectable === false || combined.length === 0
                ? null
                : () => editTask()
            }
          />
        </View>
        {avaliableTime > 0
          ? (
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              flexDirection: 'row',
              justifyContent: 'space-around',
              padding: 3,
              marginTop: 5
            }}
          >
            {displayTimeLeft(avaliableTime)} left
          </Text>
            )
          : null}
      </View>
      <Confetti
        confettiCount={20}
        size={2}
        timeout={0}
        duration={1200}
        ref={(node) => {
          confettiView = node
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#3A3B3C',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    flexDirection: 'column'
  },
  top: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    // flex: 0.5,
    padding: 8
  },
  button: {
    backgroundColor: '#3C00BB',
    padding: 5,
    borderRadius: 6,
    alignItems: 'center'
  },
  grayOverlay: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'gray',
    opacity: 0.5,
    top: 0,
    height: '100%',
    width: '100%'
  },
  topButton: {
    backgroundColor: '#3C00BB',
    padding: 8,
    borderRadius: 6
  },
  tasks: {
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#152075',
    padding: 5,
    borderColor: '#a6a6a6',
    borderWidth: 2
  },
  selectView: {
    flex: 1,
    padding: 3,
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  inSelection: {
    // flex: 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around'
  }
})
