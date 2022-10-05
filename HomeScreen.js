/* eslint-disable multiline-ternary */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-expressions */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import * as StoreReview from 'expo-store-review'
import * as Linking from 'expo-linking'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState, useRef } from 'react'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  useColorScheme,
  Appearance,
  SafeAreaView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
  LinearProgress,
  ThemeProvider,
  createTheme,
  Header
} from '@rneui/themed'
import logo from './assets/Icon.png'
import lightLogo from './assets/FadedIconLight.png'
import darkLogo from './assets/FadedIconDark.png'
import controls from './assets/Controls.png'
import eventScreen from './assets/EventScreen.png'
import taskScreen from './assets/TaskScreen.png'
import homeScreen from './assets/HomeScreen.png'
import syncScreen from './assets/SyncScreen.png'
import top from './assets/Top.png'
import DraggableFlatList, {
  ScaleDecorator
} from 'react-native-draggable-flatlist'
import * as Calendar from 'expo-calendar'
import Confetti from 'react-native-confetti'

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
  const { editName } = route.params

  const theme = createTheme({
    lightColors: {
      primary: '#6a99e6',
      green: '#00b300',
      background: '#f2f2f2',
      white: '#dbdbdb'
    },
    darkColors: {
      primary: '#56a3db',
      white: '#444444',
      green: '#039603',
      background: '#222222'
    }
  })

  const instructions = [
    {
      title: 'Welcome to CheckMate!',
      content:
        'Hi, I am your personal productivity assistant. Let me give you a brief guide!',
      image: logo,
      width: 200,
      height: 200
    },
    {
      title: '1. Adding Tasks',
      content:
        'Before I can assist you, I need to know what tasks you need to work on. Add your tasks and fill in the parameters.',
      image: taskScreen,
      width: 200,
      height: 398.14
    },
    {
      title: '2. Adding Events',
      content:
        'I also need to know your events. Add your events and fill in the parameters.',
      image: eventScreen,
      width: 200,
      height: 393.55
    },
    {
      title: '3. Syncing With Calendar',
      content:
        'Would you like events from your calendar to be added to your schedule? You can always change these preferences in settings. Clicking the sync button at the top of the home screen will allow you to review and add your calendar events.',
      image: syncScreen,
      width: 200,
      height: 206.12
    },
    {
      title: '4. Making the Schedule',
      content:
        'This part is taken care for you. An optimized schedule using your tasks and events will be automatically created for you.',
      image: homeScreen,
      width: 200,
      height: 389.85
    },
    {
      title: '5. Using the Schedule',
      content:
        'Work at your own pace by selecting a task and using the buttons at the bottom of the screen to start, pause, finish, or edit it. Events will automatically be started when the time is right. Use the arrows beside the selected task to move it up or down. Press the button near the bottom right to optimize your schedule.',
      image: controls,
      width: 200,
      height: 397.93
    },
    {
      title: 'Be Productive!',
      content:
        "That's all! Go to settings to toggle notification reminders. Click on the '?' icon to see this tutorial again. Go be productive!",
      image: top,
      width: 200,
      height: 65.55
    }
  ]

  const [avaliableTime, setAvaliableTime] = useState(0)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [taskIndex, setTaskIndex] = useState(0)
  const [selectable, setSelectable] = useState(true)
  const [instructionIndex, setInstructionIndex] = useState(-1)
  const [combined, setCombined] = useState([])
  const [error, setError] = useState(false)
  const [checked, setChecked] = useState(2)
  const [progress, setProgress] = useState(0)
  const [colors, setColors] = useState(theme.lightColors)
  const [colorScheme, setColorScheme] = useState(useColorScheme())
  const [first, setFirst] = useState(false)
  const [removal, setRemoval] = useState(false)
  const [alert, setAlert] = useState({ show: false })
  const [firstOpen, setFirstOpen] = useState(-1)

  // get data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      await getData()
      registerForPushNotificationsAsync().then()
      Calendar.requestCalendarPermissionsAsync().then()
    })

    return unsubscribe
  }, [route.params, navigation])

  useEffect(() => {
    if (!removal && firstOpen === 0) {
      const newCombined = [...makeCombined()]
      if (editName !== '') {
        if (newCombined.some((task) => task.name === editName)) {
          setTaskIndex(newCombined.findIndex((task) => task.name === editName))
        } else {
          setTaskIndex(0)
        }
      } else {
        setTaskIndex(0)
      }
      setReady(true)
      setFirstOpen(1)
    } else if (!removal && firstOpen === 1) {
      makeCombined()
    }
  }, [progress, taskIndex, removal, firstOpen])

  useEffect(() => {
    const timer = setInterval(() => {
      makeCombined()
    }, 5000)
    return () => clearInterval(timer)
  }, [selectable, progress])

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
      trigger: {
        date: new Date(
          new Date(
            new Date(
              new Date().setDate(
                new Date().getDate() + (i - new Date().getDay())
              )
            ).setHours(
              new Date(event.start).getHours(),
              new Date(event.start).getMinutes()
            )
          ).getTime() -
            event.notification * 60 * 1000
        ),
        channelId: 'Events'
      }
    })
  }

  async function registerForPushNotificationsAsync () {
    let token
    if (Device.isDevice) {
      const settings = await Notifications.getPermissionsAsync()
      const existingStatus =
        settings.granted ||
        settings.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') {
        setAlert({
          show: true,
          title: 'Push notification permission denied!',
          message: 'Please enable push notifications for this app.',
          buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
        })
        return
      }
      token = (await Notifications.getExpoPushTokenAsync()).data
    } else {
      setAlert({
        show: true,
        title: 'Must use physical device for Push Notifications',
        message: 'A physical device is neccesary for Push Notifications',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('Events', {
        name: 'Events',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        bypassDnd: true
      })
      Notifications.deleteNotificationChannelAsync('default')
    }

    return token
  }

  const getData = async () => {
    try {
      setFirstOpen(-1)
      const promises = []
      promises.push(new Promise(getTheme))
      promises.push(new Promise(savedTasks))
      promises.push(new Promise(savedSetTasks))
      promises.push(new Promise(getSync))
      promises.push(new Promise(firstTime))
      await Promise.all(promises).then(
        await async function () {
          await changeDay()
          await getSelectable()
          setFirstOpen(0)
        },
        () => {
          // rejection
          console.log('uh oh')
        }
      )
    } catch (e) {
      setAlert({
        show: true,
        title: 'Error getting data!',
        message: 'Please try again.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
      console.log(e)
    }
  }

  const getSync = async (resolve, reject) => {
    try {
      const JsonValue = await AsyncStorage.getItem('syncEvents5')
      const syncEvents = JsonValue != null ? JSON.parse(JsonValue) : null
      if (syncEvents != null) {
        if (syncEvents === 'never') {
          setChecked(1)
        } else if (syncEvents === 'review') {
          setChecked(2)
        } else if (syncEvents === 'always') {
          setChecked(3)
        }
      }
      resolve()
    } catch (e) {
      reject(e)
      console.log(e)
    }
  }

  const getTheme = async (resolve, reject) => {
    try {
      const themePref = await AsyncStorage.getItem('themePref')
      if (themePref !== null && JSON.parse(themePref) !== 'system') {
        setColorScheme(JSON.parse(themePref))
        if (JSON.parse(themePref) === 'light') {
          setColors(theme.lightColors)
        } else {
          setColors(theme.darkColors)
        }
      } else if (Appearance.getColorScheme() == null) {
        setColorScheme('light')
        setColors(theme.lightColors)
      } else if (Appearance.getColorScheme() === 'dark') {
        setColorScheme('dark')
        setColors(theme.darkColors)
      } else {
        setColorScheme('light')
        setColors(theme.lightColors)
      }
      resolve(true)
    } catch (e) {
      reject(e)
      console.log(e)
    }
  }

  async function getSyncEvents (edit) {
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status === 'granted') {
      await manageSyncEvents(edit)
    } else {
      setAlert({
        show: true,
        title: 'Calendar permission denied!',
        message: 'Please enable calendar permissions for this app.',
        buttons: [
          {
            title: 'OK',
            action: () => {
              setAlert({ show: false })
            }
          }
        ]
      })
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
    } else {
      setAlert({
        show: true,
        title: 'Calendar permission denied!',
        message: 'Please enable calendar permissions for this app.',
        buttons: [
          {
            title: 'OK',
            action: () => {
              setAlert({ show: false })
            }
          }
        ]
      })
      return
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
        await syncEvents()
      } else if (syncedEvents === 'review') {
        reviewEvents()
      }
    } catch (e) {
      setAlert({
        show: true,
        title: 'Error getting data!',
        message: 'Please try again.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
      console.log(e)
    }
  }

  async function manageSyncEvents (edit) {
    const JsonValue = await AsyncStorage.getItem('syncEvents5')
    const syncEvents = JsonValue != null ? JSON.parse(JsonValue) : null
    if (!(syncEvents == null || edit)) {
      await setSyncPreferences(syncEvents)
    }
  }

  function checkEvents (events) {
    const newEvents = events.filter((event) => {
      const a = setTasks.findIndex((setTask) => event.title === setTask.name)
      return (
        !tasks.some((task) => task.name === event.title) &&
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
    } else {
      setAlert({
        show: true,
        title: 'Calendar permission denied!',
        message: 'Please enable calendar permissions for this app.',
        buttons: [
          {
            title: 'OK',
            action: () => {
              setAlert({ show: false })
            }
          }
        ]
      })
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
    } else {
      setAlert({
        show: true,
        title: 'Calendar permission denied!',
        message: 'Please enable calendar permissions for this app.',
        buttons: [
          {
            title: 'OK',
            action: () => {
              setAlert({ show: false })
            }
          }
        ]
      })
      return
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
      if (event.alarms[0] != null) {
        setTasks[setTasks.length - 1].notification =
          event.alarms[0].relativeOffset * -1
        setTasks[setTasks.length - 1].notificationId =
          await schedulePushNotification(setTasks[setTasks.length - 1])
      } else {
        setTasks[setTasks.length - 1].notification = ''
      }
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
  }

  const firstTime = async (resolve, reject) => {
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      const first = JsonValue != null ? JSON.parse(JsonValue) : null
      const removeJsonValue = await AsyncStorage.getItem('removeNotifications')
      const removeNotifications =
        removeJsonValue != null ? JSON.parse(removeJsonValue) : null
      if (first == null) {
        setInstructionIndex(0)
        const jsonValue = JSON.stringify(0)
        await AsyncStorage.setItem('firsty', jsonValue)
        await AsyncStorage.setItem('removeNotifications', jsonValue)
        setFirst(true)
      } else if (removeNotifications == null) {
        Notifications.cancelAllScheduledNotificationsAsync()
        setAlert({
          show: true,
          title: 'Notification Changes',
          message: 'noti',
          buttons: [
            {
              title: 'OK',
              action: async () => {
                setAlert({ show: false })
                await AsyncStorage.setItem(
                  'removeNotifications',
                  JSON.stringify(true)
                )
              }
            }
          ]
        })
      }

      resolve(true)
    } catch (e) {
      reject(e)
      setAlert({
        show: true,
        title: 'Error getting data!',
        message: 'Please try again.',
        buttons: [
          {
            title: 'OK',
            action: () => {
              setAlert({ show: false })
            }
          }
        ]
      })
      console.log(e)
    }
  }

  const savedTasks = async (resolve, reject) => {
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      const first = JsonValue != null ? JSON.parse(JsonValue) : null
      const dayJsonValue = await AsyncStorage.getItem('day')
      let day = dayJsonValue != null ? JSON.parse(dayJsonValue) : null
      let oldTasks = []
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      let savedTask =
        savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null

      if (first == null) {
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
            oldTasks.splice(i, 1)
            i--
          }
        }
        tasks = oldTasks.concat(savedTask[0][new Date().getDay()])
        savedTask[0][new Date().getDay()] = [...tasks]
      } else {
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
      setAlert({
        show: true,
        title: 'Error getting data!',
        message: 'Please try again.',
        buttons: [
          {
            title: 'OK',
            action: () => {
              setAlert({ show: false })
            }
          }
        ]
      })
      console.log(e)
    }
  }

  const savedSetTasks = async (resolve, reject) => {
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      const first = JsonValue != null ? JSON.parse(JsonValue) : null
      const dayJsonValue = await AsyncStorage.getItem('day')
      let day = dayJsonValue != null ? JSON.parse(dayJsonValue) : null
      const savedTaskJsonValue = await AsyncStorage.getItem('setTasks')
      let savedTask =
        savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null

      if (first == null) {
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
          e.pStart = time(
            new Date().setHours(
              new Date(e.pStart).getHours(),
              new Date(e.pStart).getMinutes()
            )
          )
          e.start = e.pStart
          e.pEnd = time(
            new Date().setHours(
              new Date(e.pEnd).getHours(),
              new Date(e.pEnd).getMinutes()
            )
          )
          e.end = e.pEnd
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
      setAlert({
        show: true,
        title: 'Error getting data!',
        message: 'Please try again.',
        buttons: [
          {
            title: 'OK',
            action: () => {
              setAlert({ show: false })
            }
          }
        ]
      })
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

  const changeDay = async () => {
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
        await AsyncStorage.setItem('firsty', JSON.stringify(JsonValue + 1))
        const first = JsonValue != null ? (JSON.parse(JsonValue) === false ? 0 : JSON.parse(JsonValue)) : null
        await AsyncStorage.setItem('firsty', JSON.stringify(first + 1))
        if (first != null) {
          if (first === false || (first >= 5 && first % 5 === 0)) {
            if (await StoreReview.isAvailableAsync() && await StoreReview.hasAction()) {
              await StoreReview.requestReview().then(function (response) {
              })
            } else {
              if (Platform.OS === 'android') {
                const androidPackageName = 'com.yuenkai.CheckMate'
                Linking.openURL(`market://details?id=${androidPackageName}&showAllReviews=true`)
              } else if (Platform.OS === 'ios') {
                Linking.openURL(
                  `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${1570727502}?action=write-review`
                )
              }
            }
          }

          const { status } = await Calendar.requestCalendarPermissionsAsync()
          if (status === 'granted') {
            const calendars = await Calendar.getCalendarsAsync(
              Calendar.EntityTypes.EVENT
            )
            const calendarIds = calendars.map((calendar) => calendar.id)
            let events = await Calendar.getEventsAsync(
              calendarIds,
              new Date(new Date().setHours(0, 0, 0, 0)),
              new Date(new Date().setHours(23, 59, 59, 999))
            )
            events = events.filter(
              (event) => time(event.endDate).getTime() > time(new Date()).getTime()
            )
            if (events.length > 0) {
              await getSyncEvents(false)
            }
          } else {
            setAlert({
              show: true,
              title: 'Calendar permission denied!',
              message: 'Please enable calendar permissions for this app.',
              buttons: [
                {
                  title: 'OK',
                  action: () => {
                    setAlert({ show: false })
                  }
                }
              ]
            })
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function getSelectable () {
    if (tasks.length > 0) {
      const JsonValue = await AsyncStorage.getItem('selectable')
      const selectable1 = JsonValue != null ? JSON.parse(JsonValue) : true
      setSelectable(selectable1)
      setProgress(1 - tasks[0].length / tasks.pLength)
    }
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
    const tempC = []
    sortSetTasks()
    if (tasks.length > 0 || setTasks.length > 0) {
      let tempTime = time(new Date())

      if (
        taskIndex === 0 &&
        setTasks.length > 0 &&
        time(setTasks[0].start).getTime() - time(tempTime).getTime() >
          1000 * 60 &&
        tasks.length <= 0
      ) {
        setTaskIndex(1)
      }
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
      if (selectable === false) {
        if (
          setTasks.length > 0 &&
          tempTime.getTime() === time(new Date(setTasks[0].start)).getTime()
        ) {
          pause()
        } else if (tasks.length > 0) {
          if (
            (time(new Date()).getTime() - time(tasks[0].start).getTime()) /
              (1000 * 60) >
            0
          ) {
            tasks[0].length -=
              (time(new Date()).getTime() - time(tasks[0].start).getTime()) /
              (1000 * 60)
          }
          saveTasks()
          if (tasks[0].length <= 0) {
            tasks[0].length = 10
          }
          if (tasks[0].length > tasks[0].pLength) {
            tasks[0].pLength = tasks[0].length
          }
          setProgress(1 - tasks[0].length / tasks[0].pLength)
        }
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
            tasks[i].start = tempTime
            if (tasks[i].tLength != null) {
              tasks[i].end =
                time(tempTime).getTime() + tasks[i].tLength * 60 * 1000
            } else {
              tasks[i].end = time(
                new Date(tempTime).getTime() + tasks[i].length * 1000 * 60
              )
            }
            if (
              tasks[i].name.substring(tasks[i].name.length - 8) !== ' (cont.)'
            ) {
              tasks[i].tLength = null
            }
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
            tasks[i].start = tempTime
            tasks[i].end = time(setTasks[setIndex].start)
            tasks[i].tLength =
              Math.floor(
                time(tasks[i].end).getTime() - time(tasks[i].start).getTime()
              ) /
              (1000 * 60)
            tempTime = tasks[i].end
            tempC.push({ ...tasks[i] })
            tasks.splice(i + 1, 0, { ...tasks[i] })
            tasks[i + 1].tLength =
              tasks[i + 1].length -
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
              start: time(tempTime),
              break: true,
              end: time(setTasks[setIndex].start),
              length:
                (time(setTasks[setIndex].start).getTime() -
                  time(tempTime).getTime()) /
                (1000 * 60),
              name: 'Break'
            })
          }
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
          tasks[i].start = tempTime
          if (tasks[i].tLength != null) {
            tasks[i].end =
              time(tempTime).getTime() + tasks[i].tLength * 60 * 1000
          } else {
            tasks[i].end = new Date(
              time(time(tempTime).getTime() + tasks[i].length * 1000 * 60)
            )
          }
          if (
            tasks[i].name.substring(tasks[i].name.length - 8) !== ' (cont.)'
          ) {
            tasks[i].tLength = null
          }
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
            start: time(tempTime),
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
    if (hours === '') {
      return minutes
    }
    return hours + ' ' + minutes
  }

  function move (direction) {
    let tempTask
    if (direction === 'up') {
      const index = tasks.findIndex(
        (task) => task.name === combined[taskIndex].name
      )
      tempTask = combined[taskIndex]
      tasks.splice(index, 1)
      tasks.splice(index - 1, 0, { ...combined[taskIndex] })
    } else if (direction === 'down') {
      const index = tasks.findIndex(
        (task) => task.name === combined[taskIndex].name
      )
      tempTask = combined[taskIndex]
      tasks.splice(index, 1)
      tasks.splice(index + 1, 0, { ...combined[taskIndex] })
    }
    const tCombined = makeCombined()
    tempTask.name.substring(tempTask.name.length - 8) !== ' (cont.)'
      ? setTaskIndex(tCombined.findIndex((task) => task.name === tempTask.name))
      : setTaskIndex(
        tCombined.findIndex(
          (task) =>
            task.name === tempTask.name.substring(0, tempTask.name.length - 8)
        )
      )
    saveTasks()
  }

  function renderItem (item) {
    const index = item.index
    const drag = item.drag
    const isActive = item.isActive
    item = item.item

    return (
      <ScaleDecorator>
        {index === 0 ? (
          <Text
            style={{
              alignSelf: 'flex-start',
              marginLeft: 3,
              color: colors.grey2
            }}
          >
            {displayTime(combined[0].start)}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ alignSelf: 'flex-end', color: colors.grey2 }}>
            {displayTime(item.end)}
          </Text>
          <TouchableOpacity
            style={{ flexGrow: 1, marginBottom: 15, marginLeft: 15 }}
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
              containerStyle={
                taskIndex === index
                  ? {
                      borderColor:
                        colorScheme === 'light' ? colors.primary : '#55a1d9',
                      borderWidth: 2,
                      borderRadius: 10,
                      backgroundColor: colors.background,
                      height:
                        item.tLength != null
                          ? item.tLength * 2 < 60
                            ? null
                            : item.tLength * 2
                          : item.length * 2 < 60
                            ? null
                            : item.length * 2,
                      alignItems: 'flex-start'
                    }
                  : item.break == null
                    ? {
                        borderColor: colors.grey4,
                        borderWidth: 2,
                        borderRadius: 10,
                        backgroundColor: colors.background,
                        height:
                        item.tLength != null
                          ? item.tLength * 2 < 60
                            ? null
                            : item.tLength * 2
                          : item.length * 2 < 60
                            ? null
                            : item.length * 2,
                        alignItems: 'flex-start'
                      }
                    : {
                        backgroundColor: colors.white,
                        borderRadius: 10,
                        height: item.length * 2 < 60 ? null : item.length * 2,
                        alignItems: 'flex-start'
                      }
              }
            >
              <ListItem.Content>
                <View
                  style={
                    item.break == null
                      ? {
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignSelf: 'stretch'
                        }
                      : {
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignSelf: 'stretch'
                        }
                  }
                >
                  <View
                    style={item.break != null ? { alignItems: 'center' } : null}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <ListItem.Title
                        style={
                          taskIndex !== index
                            ? item.break == null
                              ? {
                                  fontWeight: 'bold',
                                  color: colors.grey1,
                                  paddingRight: 10
                                }
                              : {
                                  fontWeight: 'bold',
                                  color: colors.grey1,
                                  fontSize: 20,
                                  paddingRight: 10
                                }
                            : {
                                fontWeight: 'bold',
                                color: colors.grey1,
                                paddingRight: 10
                              }
                        }
                      >
                        {item.name}
                      </ListItem.Title>
                      {item.sortValue <
                      new Date(new Date().setHours(24, 0, 0, 0)).getTime() /
                        (1000 * 60 * 60) +
                        (6 - 4) * 2 * (11 - 7) +
                        60 / 10 ? (
                        <Icon
                          name="exclamation-triangle"
                          type="font-awesome-5"
                          color={colors.warning}
                          size={17}
                          style={{ alignSelf: 'flex-start' }}
                        />
                          ) : null}
                    </View>
                    {item.sortValue != null ? (
                      <ListItem.Subtitle
                        style={
                          taskIndex === index
                            ? { color: colors.grey1 }
                            : { color: colors.grey1 }
                        }
                      >
                        {'Due: ' +
                          days[new Date(item.date).getDay()] +
                          ' ' +
                          displayDate(item.date) +
                          ' ' +
                          displayTime(item.date)}
                      </ListItem.Subtitle>
                    ) : null}
                    {(item.tLength != null
                      ? item.tLength >= 45
                      : item.length >= 45) ||
                    (item.sortValue == null && item.length >= 30) ? (
                      <ListItem.Subtitle
                        style={
                          taskIndex === index
                            ? { color: colors.grey1 }
                            : { color: colors.grey1 }
                        }
                      >
                        {item.tLength != null
                          ? displayTimeLeft(item.tLength) + ' / '
                          : null}
                        {displayTimeLeft(item.length)}
                      </ListItem.Subtitle>
                        ) : null}
                  </View>
                  <View style={{ alignSelf: 'center', marginLeft: 5 }}>
                    {item.break == null &&
                    item.sortValue != null &&
                    index === taskIndex &&
                    tasks.findIndex(
                      (task) => task.name === combined[taskIndex].name
                    ) > 0 ? (
                      <Icon
                        name="arrow-upward"
                        onPress={() => move('up')}
                        color={colors.grey3}
                        size={20}
                        style={{ marginBottom: 5 }}
                      />
                        ) : null}
                    {item.break == null &&
                    item.sortValue != null &&
                    index === taskIndex &&
                    tasks.findIndex(
                      (task) => task.name === combined[taskIndex].name
                    ) <
                      tasks.length - 1 ? (
                      <Icon
                        name="arrow-downward"
                        onPress={() => move('down')}
                        color={colors.grey3}
                        size={20}
                        style={{ marginTop: 5 }}
                      />
                        ) : null}
                  </View>
                </View>
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
    makeCombined()
  }

  // Task controls
  function start () {
    if (combined[taskIndex].sortValue == null) {
      setAlert({
        show: true,
        title: "Events can't be started",
        message: 'They will automatically start once it is the starting time.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else if (
      setTasks.length > 0 &&
      time(new Date()).getTime() >= time(setTasks[0].start).getTime()
    ) {
      setAlert({
        show: true,
        title: 'Event in progress',
        message: 'You can start this task when the event has finished.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else {
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
      setProgress(0)
      saveTasks()
      saveSelectable()
      setReady(true)
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
    setAlert({
      show: true,
      title: 'Are you sure?',
      message: 'This task/event will be removed permanently.',
      buttons: [
        {
          title: 'Continue',
          action: () => {
            remove()
            setAlert({ show: false })
          }
        },
        { title: 'Cancel', action: () => setAlert({ show: false }) }
      ]
    })
  }

  function remove () {
    setRemoval(true)
    setProgress(1)
    setTimeout(
      async function () {
        setSelectable(true)
        if (confettiView) {
          confettiView.startConfetti()
        }
        removeSelectable()
        if (combined[taskIndex].sortValue != null) {
          // remove combined[taskIndex] from tasks
          tasks.splice(
            tasks.findIndex((task) => task.name === combined[taskIndex].name),
            1
          )
        } else {
          // remove combined[taskIndex] from setTasks
          if (
            !combined[taskIndex].weekly &&
            combined[taskIndex].notificationId != null
          ) {
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
        setTaskIndex(0)

        setReady(true)
        setRemoval(false)
        makeCombined()
      },
      selectable === false ? 2000 : 0
    )
  }

  // Store selectable(working on task) status
  async function saveSelectable () {
    try {
      const jsonValue = JSON.stringify(false)
      await AsyncStorage.setItem('selectable', jsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  async function removeSelectable () {
    try {
      const jsonValue = JSON.stringify(true)
      await AsyncStorage.setItem('selectable', jsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  // Save tasks
  async function saveTasks () {
    try {
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
    } catch (e) {
      console.log(e)
    }
  }

  // Sort tasks
  function sortTask () {
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

  // Editing
  async function editTask () {
    try {
      saveTasks()
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
      setAlert({
        show: true,
        title: 'Error getting task/event edit info!',
        message: 'Please try again.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
      console.log(e)
    }
  }

  function resetOrder () {
    const original = [...tasks]
    const temp = tasks.sort(function (a, b) {
      return a.sortValue - b.sortValue
    })
    tasks = [...original]

    // Check if tasks and temp are identical arrays
    return JSON.stringify(tasks) !== JSON.stringify(temp)
  }

  if (!ready) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      />
    )
  }
  return (
    <ThemeProvider theme={theme}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />
        <Header
          backgroundColor={colors.background}
          placement="left"
          centerComponent={{
            text: 'Schedule',
            style: {
              color: colors.grey1,
              fontSize: 19,
              fontWeight: 'bold'
            }
          }}
          rightComponent={
            <View style={styles.top}>
              <Icon
                name="question-circle"
                type="font-awesome-5"
                size={23}
                onPress={() => setInstructionIndex(0)}
                color={colors.grey1}
              />
              <View>
                {!error ? (
                  <Icon
                    name="calendar-sync"
                    type="material-community"
                    size={23}
                    color={colors.grey1}
                    onPress={() => reviewEvents()}
                    onLongPress={() => getSyncEvents(true)}
                    style={{ marginLeft: 20 }}
                  />
                ) : (
                  <Icon
                    name="sync-problem"
                    type="material"
                    size={23}
                    color={colors.grey1}
                    onPress={() => {
                      reviewEvents()
                    }}
                    onLongPress={() => getSyncEvents(true)}
                    style={{ marginLeft: 20 }}
                  />
                )}
              </View>
              <Icon
                name="settings"
                type="material"
                size={23}
                onPress={() => navigation.navigate('Settings')}
                solid={true}
                color={colors.grey1}
                style={{ marginLeft: 20 }}
              />
            </View>
          }
        />

        {alert.show ? (
          <Dialog
            overlayStyle={{ backgroundColor: colors.white }}
            onBackdropPress={async () => {
              alert.message === 'noti'
                ? await AsyncStorage.setItem(
                  'removeNotifications',
                  JSON.stringify(true)
                )
                : null
              setAlert({ show: false })
            }}
          >
            <Dialog.Title
              title={alert.title}
              titleStyle={{ color: colors.grey1 }}
            />
            {alert.message === 'noti' ? (
              <Text>
                <Text style={{ color: colors.grey1 }}>
                  CheckMate has recieved bug fixes and other changes relating to
                  notifications. However, this requires
                </Text>
                <Text style={{ fontWeight: 'bold', color: colors.grey1 }}>
                  {' '}
                  existing notifications to be deleted; You will need to add
                  them back manually.
                </Text>
                <Text style={{ color: colors.grey1 }}>
                  {' '}
                  We are very sorry for the inconvenience.
                </Text>
              </Text>
            ) : (
              <Text style={{ color: colors.grey1 }}>{alert.message}</Text>
            )}
            {alert.content}
            <Dialog.Actions>
              {alert.buttons.map((l, i) => (
                <Dialog.Button
                  key={i}
                  title={l.title}
                  titleStyle={{ color: colors.grey1 }}
                  onPress={() => l.action()}
                />
              ))}
            </Dialog.Actions>
          </Dialog>
        ) : null}

        {instructions.map((l, i) => (
          <Dialog
            isVisible={instructionIndex === i}
            overlayStyle={{ backgroundColor: colors.white }}
            key={i}
            onBackdropPress={() => {
              !first ? setInstructionIndex(-1) : null
            }}
          >
            <Dialog.Title
              title={l.title}
              titleStyle={{ color: colors.grey1 }}
              style={{ textAlign: 'center' }}
            />
            <Image
              style={{
                width: l.width,
                height: l.height,
                alignSelf: 'center',
                marginBottom: 10
              }}
              source={l.image}
            />
            <Text style={{ alignSelf: 'center', color: colors.grey1 }}>
              {l.content}
            </Text>
            {i === 3
              ? ['Never', 'After Review', 'Always'].map((t, k) => (
                  <CheckBox
                    key={k}
                    title={t}
                    textStyle={{ color: colors.grey1 }}
                    containerStyle={{
                      backgroundColor: colors.white,
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
              {i === 3 ? (
                <Dialog.Button
                  title="NEXT"
                  titleStyle={{ color: colors.grey1 }}
                  onPress={async () => {
                    if (checked === 1) {
                      const jsonValue = JSON.stringify('never')
                      await AsyncStorage.setItem('syncEvents5', jsonValue)
                    } else if (checked === 2) {
                      const jsonValue = JSON.stringify('review')
                      await AsyncStorage.setItem('syncEvents5', jsonValue)
                    } else {
                      const jsonValue = JSON.stringify('always')
                      await AsyncStorage.setItem('syncEvents5', jsonValue)
                    }
                    setInstructionIndex(i + 1)
                  }}
                />
              ) : i <= instructions.length - 1 ? (
                <Dialog.Button
                  title={i === instructions.length - 1 ? 'CLOSE' : 'NEXT'}
                  titleStyle={{ color: colors.grey1 }}
                  onPress={() => setInstructionIndex(i + 1)}
                />
              ) : null}
              {i > 0 ? (
                <Dialog.Button
                  title="PREVIOUS"
                  titleStyle={{ color: colors.grey1 }}
                  onPress={() => setInstructionIndex(i - 1)}
                />
              ) : null}
            </Dialog.Actions>
          </Dialog>
        ))}

        <View style={{ flexGrow: 1 }}>
          <View style={{ flex: 1, marginHorizontal: 20, marginTop: 10 }}>
            {combined.length === 0 ? (
              <View
                style={{
                  height: '100%',
                  // marginTop: 100,
                  alignSelf: 'stretch',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {/* <Image style={{ width: 150, height: 150 }} source={colorScheme === 'light' ? lightLogo : darkLogo} /> */}
                <Text
                  h3
                  h3Style={{
                    fontWeight: 'normal',
                    textAlign: 'center',
                    color: colors.grey1,
                    fontSize: 20,
                    marginBottom: 20
                  }}
                >
                  No tasks or events currently.
                </Text>
              </View>
            ) : null}
            <DraggableFlatList
              containerStyle={{ flex: 10, margin: 3, marginBottom: 5 }}
              data={combined}
              onDragEnd={(data) => setData(data)}
              keyExtractor={(item, index) => {
                item.name != null
                  ? item.name + '' + index.toString()
                  : index.toString()
              }}
              renderItem={(item) => renderItem(item)}
            />
          </View>
          {resetOrder() && !open ? (
            <View style={{ bottom: 65, right: 5, position: 'absolute' }}>
              <View style={{ padding: 8 }}>
                <Icon
                  name="low-priority"
                  reverse
                  raised
                  color={colors.primary}
                  iconStyle={{ color: colors.white }}
                  onPress={() => sortTask()}
                />
              </View>
            </View>
          ) : null}
          <SpeedDial
            isOpen={open}
            icon={{ name: 'add', color: colors.white }}
            openIcon={{ name: 'close', color: colors.white }}
            onOpen={() => setOpen(!open)}
            onClose={() => setOpen(!open)}
            color={colors.primary}
            overlayColor="rgba(0,0,0,0)" // make overlay transparent
            transitionDuration={40}
          >
            <Tooltip
              height={60}
              popover={
                <Text style={{ color: colors.grey1 }}>
                  Tasks can be done at any time
                </Text>
              }
            >
              <SpeedDial.Action
                icon={{
                  name: 'check-square',
                  color: colors.white,
                  type: 'feather'
                }}
                title="Task"
                containerStyle={{ backgroundColor: colors.white }}
                onPress={() => {
                  setOpen(false)
                  navigation.navigate('AddTask', { editName: '' })
                }}
                color={colors.primary}
              />
            </Tooltip>
            <Tooltip
              height={60}
              popover={
                <Text style={{ color: colors.grey1 }}>
                  Events are done at a preset time
                </Text>
              }
            >
              <SpeedDial.Action
                icon={{ name: 'clock', color: colors.white, type: 'feather' }}
                title="Event"
                onPress={() => {
                  setOpen(false)
                  navigation.navigate('AddWorkTime', { editName: '' })
                }}
                color={colors.primary}
              />
            </Tooltip>
          </SpeedDial>
          {selectable === false ? (
            <Overlay
              onBackdropPress={() => setSelectable(true)}
              overlayStyle={{ width: '80%', backgroundColor: colors.white }}
            >
              <Text
                h3
                style={{
                  fontSize: 30,
                  margin: 5,
                  marginBottom: 0,
                  color: colors.grey1
                }}
              >
                {combined[taskIndex].name}
              </Text>
              {combined[taskIndex].description !== '' ? (
                <Text
                  h4
                  h4Style={{
                    fontSize: 19,
                    margin: 5,
                    fontWeight: 'normal',
                    color: colors.grey1
                  }}
                >
                  {combined[taskIndex].description}
                </Text>
              ) : null}
              <View>
                <LinearProgress
                  style={{ marginVertical: 5 }}
                  value={progress}
                  variant="determinate"
                  color={colors.primary}
                />
              </View>
              <Text
                h4
                h4Style={{
                  fontSize: 15,
                  margin: 5,
                  fontWeight: 'normal',
                  color: colors.grey1
                }}
              >
                {tasks.length > 0
                  ? displayTimeLeft(tasks[0].length) + ' left'
                  : null}
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
                  color={colors.grey1}
                  onPress={() => pause()}
                  style={{ margin: 10 }}
                />
                <Icon
                  name="stop-circle"
                  type="font-awesome"
                  size={30}
                  onPress={() => stop()}
                  style={{ margin: 10 }}
                  color={colors.grey1}
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
                  color={colors.grey1}
                />
              </View>
            </Overlay>
          ) : null}
        </View>
        <Divider style={{ backgroundColor: colors.grey1 }} />

        {/* Task controls display */}
        <View style={styles.selectView}>
          <View style={styles.inSelection}>
            {selectable === true ? (
              <Icon
                name="play-circle"
                type="font-awesome"
                size={33}
                onPress={() => start()}
                disabled={combined.length <= 0}
                color={colors.grey1}
                disabledStyle={{ backgroundColor: null }}
              />
            ) : (
              <Icon
                name="pause-circle"
                size={33}
                type="font-awesome"
                onPress={() => pause()}
                color={colors.grey1}
                disabled={combined.length <= 0}
                disabledStyle={{ backgroundColor: null }}
              />
            )}
            <Icon
              name="stop-circle"
              type="font-awesome"
              size={33}
              onPress={() => stop()}
              color={colors.grey1}
              disabled={combined.length <= 0}
              disabledStyle={{ backgroundColor: null }}
            />
            <Icon
              name="pencil-circle"
              type="material-community"
              size={33}
              onPress={() => editTask()}
              color={colors.grey1}
              disabled={selectable === false || combined.length === 0}
              disabledStyle={{ backgroundColor: null }}
            />
          </View>
          {avaliableTime > 0 ? (
            <Text
              style={{
                textAlign: 'center',
                flexDirection: 'row',
                justifyContent: 'space-around',
                padding: 3,
                marginTop: 5,
                color: colors.grey1
              }}
            >
              {displayTimeLeft(avaliableTime)} of work left
            </Text>
          ) : null}
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
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    flexDirection: 'column'
  },
  top: {
    justifyContent: 'flex-end',
    flexDirection: 'row'
  },
  selectView: {
    // flex: 1,
    paddingBottom: 10,
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  inSelection: {
    marginTop: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around'
  }
})
