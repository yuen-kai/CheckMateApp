/* eslint-disable no-unused-expressions */
/* eslint-disable no-lone-blocks */
/* eslint-disable react/prop-types */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Platform,
  useColorScheme,
  SafeAreaView
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Avatar,
  CheckBox,
  Input,
  Button,
  Text,
  ThemeProvider,
  createTheme,
  Header,
  Icon,
  Dialog
} from '@rneui/themed'
import Section from './Section'

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
  const [notification, setNotification] = useState(30)
  const [same, setSame] = useState(false)
  const [alert, setAlert] = useState({ show: false })
  const [checked, setChecked] = useState(1)

  const theme = createTheme({
    lightColors: {
      primary: '#6a99e6',
      background: '#f2f2f2'
    },
    darkColors: {
      primary: '#56a3db',
      white: '#606060',
      background: '#222222'
    }
  })
  const [colors, setColors] = useState(theme.lightColors)
  const [colorScheme, setColorScheme] = useState(useColorScheme())

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getData()
      registerForPushNotificationsAsync().then()
    })

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
      await editInfo()
      await getTheme()
      setReady(true)
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

  const getTheme = async () => {
    try {
      const themePref = await AsyncStorage.getItem('themePref')
      if (themePref !== null && JSON.parse(themePref) !== 'system') {
        setColorScheme(JSON.parse(themePref))
        if (JSON.parse(themePref) === 'light') {
          setColors(theme.lightColors)
        } else {
          setColors(theme.darkColors)
        }
      } else if (colorScheme == null) {
        setColorScheme('light')
        setColors(theme.lightColors)
      } else if (colorScheme === 'dark') {
        setColorScheme('dark')
        setColors(theme.darkColors)
      } else {
        setColorScheme('light')
        setColors(theme.lightColors)
      }
    } catch (e) {
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
          repeats: true,
          channelId: 'Events'
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
        trigger: { date: triggerTime, channelId: 'Events' }
      })
    }
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
            workTimes[0][i].some((task) => task.name === editName) ||
            workTimes[1][i].some((task) => task.name === editName)
          ) {
            change.splice(i, 1, true)
          }
        }
        setDaysUsed(change)
        isRepeating()
        for (let i = 0; i < workTimes[1].length; i++) {
          if (workTimes[1][i].some((task) => task.name === editName)) {
            setWeekly(true)
          }
        }
      }
    } catch (e) {
      setAlert({
        show: true,
        title: 'Error getting edit info!',
        message: 'Please try again.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
      console.log(e)
    }
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
        description === task.description &&
        roundTime(start).getTime() === roundTime(task.pStart).getTime() &&
        roundTime(end).getTime() === roundTime(task.pEnd).getTime() &&
        notification === task.notification
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

  async function sameName (name) {
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

  async function saveEvents (thisOrAll) {
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

    // Put in event for all the days used
    for (let i = 0; i <= daysUsed.length - 1; i++) {
      if (daysUsed[i] === true) {
        if (edit === true) {
          if (
            workTimes[0][i].findIndex((task) => task.name === editName) !== -1
          ) {
            if (
              workTimes[0][i][
                workTimes[0][i].findIndex((task) => task.name === editName)
              ].notificationId != null
            ) {
              await Notifications.cancelScheduledNotificationAsync(
                workTimes[0][i][
                  workTimes[0][i].findIndex((task) => task.name === editName)
                ].notificationId
              )
            }
            workTimes[0][i].splice(
              workTimes[0][i].findIndex((task) => task.name === editName),
              1
            )
          }
        }

        workTimes[0][i].push({ ...selectedTask })
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
          if (edit === true && workTimes[1][i].some((task) => task.name === editName)) {
            workTimes[1][i].splice(
              workTimes[1][i].findIndex((task) => task.name === editName),
              1
            )
          }
          workTimes[1][i].push({ ...selectedTask })
          if (selectedTask.notification !== '') {
            workTimes[1][i][workTimes[1][i].length - 1].notificationId =
              workTimes[0][i][workTimes[0][i].length - 1].notificationId
          }
        }
      } else if (thisOrAll !== 'none') {
        if (workTimes[0][i].some((task) => task.name === selectedTask.name)) {
          if (
            workTimes[0][i][
              workTimes[0][i].findIndex((task) => task.name === editName)
            ].notificationId != null
          ) {
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
          thisOrAll === 'all' &&
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

    // set sameTime to true if the times overlap
    sameTime = overlapingTime()

    // Check if valid
    if (name === '') {
      setEmpty(true)
      setAlert({
        show: true,
        title: 'Empty Name',
        message: 'Please enter a name.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else if (
      !(
        selectedTask.start != null &&
        selectedTask.end != null &&
        roundTime(selectedTask.end) - roundTime(selectedTask.start) >= 1
      )
    ) {
      setAlert({
        show: true,
        title: 'Invalid Time',
        message: 'The times that you have set for this event are invalid.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else if ((await sameName(name)) === true) {
      setAlert({
        show: true,
        title: 'Name Taken',
        message: 'Name already taken. Please choose a new name.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else if (sameTime === true) {
      setAlert({
        show: true,
        title: 'Event Times Overlap',
        message:
          'The times that you have set for this event overlap with the times of another event.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else {
      const remove = edit && !newInfo()

      if (remove) {
        // check if event occurs in workTimes[1]
        let occurs = false
        for (let i = 0; i < workTimes[1].length; i++) {
          if (workTimes[1][i].some((element) => element.name === editName)) {
            occurs = true
          }
        }

        let secondOccurs = false

        // check if event occurs in workTimes[0] but usedDays[i] is false
        for (let i = 0; i < workTimes[0].length; i++) {
          if (
            workTimes[0][i].some((element) => element.name === editName) &&
            !daysUsed[i]
          ) {
            secondOccurs = true
          }
        }

        if (weekly) {
          for (let i = 0; i < workTimes[1].length; i++) {
            if (
              workTimes[1][i].some((element) => element.name === editName) &&
              !daysUsed[i]
            ) {
              secondOccurs = true
            }
          }
        }

        if (occurs && secondOccurs) {
          setAlert({
            show: true,
            title: 'Delete recurring event',
            message: 'reccuring',
            buttons: [
              { title: 'Cancel', action: () => setAlert({ show: false }) }
            ]
          })
        } else {
          saveEvents('none')
        }
      } else {
        saveEvents('none')
      }
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
        <Header
          backgroundColor={colors.background}
          placement="left"
          centerComponent={{
            text: edit === true ? 'Edit Event' : 'Add Event',
            style: {
              color: colors.grey1,
              fontSize: 19,
              fontWeight: 'bold'
            }
          }}
          leftComponent={
            <Icon
              name="arrow-back"
              type="material"
              color={colors.black}
              onPress={() => navigation.goBack()}
            />
          }
        />

        {alert.show
          ? (
          <Dialog
            overlayStyle={{ backgroundColor: colors.white }}
            onBackdropPress={() => setAlert({ show: false })}
          >
            <Dialog.Title
              title={alert.title}
              titleStyle={{ color: colors.grey1 }}
            />
            {alert.message !== 'reccuring'
              ? (
              <Text style={{ color: colors.grey1 }}>{alert.message}</Text>
                )
              : (
                  ['This week', 'All weeks'].map((t, k) => (
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
                )}
            <Dialog.Actions>
              {alert.message === 'reccuring'
                ? (
                <Dialog.Button
                  title="OK"
                  titleStyle={{ color: colors.grey1 }}
                  onPress={() => {
                    setAlert({ show: false })
                    checked === 1 ? saveEvents('this') : saveEvents('all')
                  }}
                />
                  )
                : null}
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
            )
          : null}

        <ScrollView style={{ padding: 10 }}>
          <Text style={{ fontSize: 20, padding: 4, color: colors.grey1 }}>
            {days[new Date().getDay()]}, {monthNames[new Date().getMonth()]}{' '}
            {new Date().getDate()}
          </Text>
          <View style={{ flexDirection: 'column' }}>
            <View style={styles.section}>
              <Icon
                name="label"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Name"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2 }}
              >
                <Input
                  multiline
                  placeholder="Add Name"
                  placeholderTextColor={colors.grey2}
                  renderErrorMessage={false}
                  onChangeText={(name) => {
                    setName(name)
                    sameName(name)
                  }}
                  value={name}
                  inputStyle={{ color: colors.grey1, fontSize: 17 }}
                  inputContainerStyle={{ bottomBorderWidth: 0 }}
                  selectionColor={colors.primary}
                />
              </Section>
            </View>
            {(empty && name === '') || same
              ? (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.error,
                  alignSelf: 'flex-start',
                  left: '17%'
                }}
              >
                {empty && name === ''
                  ? 'Enter a name'
                  : 'Another task or event already has this name'}
              </Text>
                )
              : null}
            <View style={styles.section}>
              <Icon
                name="info"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Description (Optional)"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2 }}
              >
                <Input
                  multiline
                  placeholder="Add Description"
                  placeholderTextColor={colors.grey2}
                  renderErrorMessage={false}
                  onChangeText={(newDescription) =>
                    setDescription(newDescription)
                  }
                  value={description}
                  inputStyle={{ color: colors.grey1, fontSize: 17 }}
                  inputContainerStyle={{ bottomBorderWidth: 0 }}
                  selectionColor={colors.primary}
                />
              </Section>
            </View>
            <View style={styles.section}>
              <Icon
                name="alarm"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <View
                style={{
                  width: '83%',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Section
                  labelContainerStyle={{ backgroundColor: colors.background }}
                  label="Start"
                  labelStyle={{ color: colors.grey2 }}
                  contentStyle={{
                    borderColor: colors.grey2,
                    paddingHorizontal: 5,
                    paddingVertical: 8,
                    justifyContent: 'center'
                  }}
                  containerStyle={{ flex: 1, marginRight: 5 }}
                >
                  <Button
                    title={start != null ? displayTime(start) : 'Start'}
                    titleStyle={{ color: colors.grey1, textAlign: 'left' }}
                    buttonStyle={{
                      backgroundColor: 'rgba(0,0,0,0)',
                      justifyContent: 'flex-start',
                      paddingLeft: 5,
                      borderRadius: 20
                    }}
                    onPress={() => showTimepicker('start')}
                  />
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
                </Section>
                <Section
                  containerStyle={{ flex: 1, marginLeft: 5 }}
                  labelContainerStyle={{ backgroundColor: colors.background }}
                  label="End"
                  labelStyle={{ color: colors.grey2 }}
                  contentStyle={{
                    borderColor: colors.grey2,
                    paddingHorizontal: 5,
                    paddingVertical: 8,
                    justifyContent: 'center'
                  }}
                >
                  <Button
                    title={end != null ? displayTime(end) : 'End'}
                    titleStyle={{ color: colors.grey1, textAlign: 'left' }}
                    buttonStyle={{
                      backgroundColor: 'rgba(0,0,0,0)',
                      borderRadius: 20,
                      justifyContent: 'flex-start'
                    }}
                    onPress={() => showTimepicker('end')}
                  />
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
                </Section>
              </View>
            </View>
            {start != null &&
            end != null &&
            roundTime(end) - roundTime(start) <= 0
              ? (
              <Text style={{ fontSize: 13, color: colors.error, left: '17%' }}>
                Events need to be at least 1 minute long!
              </Text>
                )
              : overlapingTime()
                ? (
              <Text style={{ fontSize: 13, color: colors.error, left: '17%' }}>
                Overlaping times!
              </Text>
                  )
                : null}
            <View style={styles.section}>
              <Icon
                name="notifications"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Notifications (mins before start)"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2 }}
              >
                <Input
                  placeholder="None"
                  placeholderTextColor={colors.grey2}
                  keyboardType="numeric"
                  onChangeText={(notification) => setNotification(notification)}
                  value={
                    notification !== '' && notification !== null
                      ? notification.toString()
                      : null
                  }
                  inputStyle={{ color: colors.grey1, fontSize: 17 }}
                  inputContainerStyle={{ bottomBorderWidth: 0 }}
                  renderErrorMessage={false}
                  selectionColor={colors.primary}
                />
              </Section>
            </View>
          </View>

          <View style={styles.section}>
            <Icon
              name="replay"
              type="material"
              color={colors.grey1}
              size={30}
            />
            <Section
              labelContainerStyle={{ backgroundColor: colors.background }}
              label={newInfo() ? 'Edit on' : 'Repeat on'}
              labelStyle={{ color: colors.grey2 }}
              contentStyle={{ borderColor: colors.grey2 }}
            >
              <CheckBox
                containerStyle={{
                  backgroundColor: 'rgba(0,0,0,0)',
                  borderWidth: 0
                }}
                title="Weekly"
                textStyle={{ color: colors.grey1 }}
                checked={weekly}
                uncheckedColor={colors.grey2}
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
                          ? { backgroundColor: colors.primary, margin: 1 }
                          : { backgroundColor: colors.grey2, margin: 1 }
                      }
                      size="small"
                      rounded
                      title={days[i].slice(0, 1)}
                      titleStyle={
                        day === true
                          ? { color: colors.white }
                          : { color: colors.grey4 }
                      }
                      onPress={() => changeDay(i)}
                    />
                  )
                })}
              </View>
              {daysUsed.includes(true) === false
                ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.warning,
                    alignSelf: 'center'
                  }}
                >
                  Nothing is selected!
                </Text>
                  )
                : null}
            </Section>
          </View>
          <Button
            containerStyle={{ marginTop: 10 }}
            title="Save"
            titleStyle={{ color: colors.white }}
            buttonStyle={{
              backgroundColor: colors.primary,
              alignSelf: 'flex-end',
              borderRadius: 5,
              paddingHorizontal: 15,
              paddingVertical: 5
            }}
            onPress={() => handleSave()}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemeProvider>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 5
  }
})
