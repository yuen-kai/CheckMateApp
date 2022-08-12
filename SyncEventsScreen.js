/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  useColorScheme,
  View
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Button,
  ListItem,
  Text,
  ThemeProvider,
  createTheme,
  Header,
  Icon,
  Dialog
} from '@rneui/themed'

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

  const theme = createTheme({
    lightColors: {
      primary: '#6a99e6',
      listItemBg: '#g9g9g9',
      disabledBg: '#dbdbdb',
      background: '#f2f2f2'
    },
    darkColors: {
      primary: '#56a3db',
      white: '#606060',
      listItemBg: '#272727',
      disabledBg: '#333333',
      background: '#222222'
    }
  })

  const [colors, setColors] = useState(theme.lightColors)
  const [colorScheme, setColorScheme] = useState(useColorScheme())

  const [alert, setAlert] = useState({ show: false })

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
    try {
      const used = []
      events.forEach((event) => {
        used.push(false)
      })
      setUse(used)
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
      trigger: {
        date: time(
          new Date(event.pStart).getTime() - event.notification * 1000 * 60
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
            text: 'Review Calendar Events',
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
            <Text style={{ color: colors.grey1 }}>{alert.message}</Text>
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
            )
          : null}

        {events.length === 0
          ? (
          <Text
            h4
            style={{ alignSelf: 'center', color: colors.grey1, marginTop: 10 }}
          >
            No Calendar Events
          </Text>
            )
          : null}
        <ScrollView>
          {events.map((event, index) => {
            return (
              <ListItem
                key={index}
                containerStyle={{
                  backgroundColor: reviewEvents(event)
                    ? colors.disabledBg
                    : colors.listItemBg,
                  paddingVertical: 20,
                  borderWidth: 2,
                  borderRadius: 5,
                  borderColor: colors.grey4,
                  margin: 5
                }}
              >
                {refresh || !refresh
                  ? (
                  <ListItem.CheckBox
                    containerStyle={{
                      backgroundColor: reviewEvents(event)
                        ? colors.disabledBg
                        : colors.listItemBg,
                      borderRadius: 5,
                      marginLeft: 3,
                      padding: 10
                    }}
                    size={18}
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
                    uncheckedColor={colors.grey3}
                  />
                    )
                  : null}
                <ListItem.Content>
                  <ListItem.Title
                    style={
                      reviewEvents(event)
                        ? {
                            color: colors.grey3,
                            fontSize: 16,
                            fontWeight: 'bold'
                          }
                        : {
                            color: colors.grey1,
                            fontSize: 16,
                            fontWeight: 'bold'
                          }
                    }
                  >
                    {event.title}
                  </ListItem.Title>
                  <ListItem.Subtitle
                    style={
                      reviewEvents(event)
                        ? { color: colors.grey3, fontSize: 13 }
                        : { color: colors.grey1, fontSize: 13 }
                    }
                  >
                    {displayTime(event.startDate)} -{' '}
                    {displayTime(event.endDate)}
                  </ListItem.Subtitle>
                  {event.notes !== '' || event.location !== ''
                    ? (
                    <ListItem.Subtitle
                      style={
                        reviewEvents(event)
                          ? { color: colors.grey3 }
                          : { color: colors.grey1 }
                      }
                    >
                      {event.notes +
                        (event.location !== ''
                          ? ' At ' + event.location + '.'
                          : '')}
                    </ListItem.Subtitle>
                      )
                    : null}
                  <ListItem.Subtitle
                    style={
                      reviewEvents(event)
                        ? { color: colors.grey3 }
                        : { color: colors.grey1 }
                    }
                  >
                    {event.alarms[0] != null
                      ? 'Notify ' +
                        event.alarms[0].relativeOffset * -1 +
                        ' min before.'
                      : "Doesn't notify"}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            )
          })}
          <Button
            title="Save"
            titleStyle={{ color: colors.white }}
            buttonStyle={{
              backgroundColor: colors.primary,
              alignSelf: 'flex-end',
              margin: 10,
              borderRadius: 8,
              paddingHorizontal: 15,
              paddingVertical: 5
            }}
            onPress={() => {
              handleSave()
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  }
})
