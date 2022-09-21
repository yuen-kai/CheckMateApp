/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import * as Linking from 'expo-linking'
import { StatusBar } from 'expo-status-bar'
import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Platform,
  TouchableOpacity,
  Appearance,
  useColorScheme,
  SafeAreaView,
  Share
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Button,
  ListItem,
  Text,
  CheckBox,
  Dialog,
  Icon,
  Avatar,
  createTheme,
  ThemeProvider,
  Header
} from '@rneui/themed'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
})

export default function SettingsScreen ({ navigation }) {
  const [ready, setReady] = useState(false)

  const [syncView, setSyncView] = useState(false)
  const [notiView, setNotiView] = useState(false)
  const [themeView, setThemeView] = useState(false)

  const [syncPref, setSyncPref] = useState(false)
  const [checked, setChecked] = useState(2)

  const [notiPref, setNotiPref] = useState([])
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
  const originalNotiPref = []

  const theme = createTheme({
    lightColors: {
      primary: '#6a99e6',
      grey4: '#efefef',
      background: '#f2f2f2'
    },
    darkColors: {
      primary: '#56a3db',
      white: '#606060',
      background: '#222222',
      grey4: '#272727'
    }
  })

  const [colors, setColors] = useState(theme.lightColors)
  const [colorScheme, setColorScheme] = useState(useColorScheme())
  const [themePref, setThemePref] = useState('system')
  const [checkedT, setCheckedT] = useState(1)
  const [alert, setAlert] = useState({ show: false })

  const list = [
    {
      name: 'Sync w/ Calendar Preferences',
      icon: <Icon name="sync" type="material" color={colors.grey1} />,
      onPress: () => setSyncView(true)
    },
    {
      name: 'Notification Preferences',
      icon: <Icon name="notifications" type="material" color={colors.grey1} />,
      onPress: () => setNotiView(true)
    },
    {
      name: 'Theme',
      icon: <Icon name="color-lens" type="material" color={colors.grey1} />,
      onPress: () => setThemeView(true)
    },
    {
      name: 'Review',
      icon: <Icon name="rate-review" type="material" color={colors.grey1} />,
      onPress: () => review()
    },
    {
      name: 'Share',
      icon: <Icon name="share" type="material" color={colors.grey1} />,
      onPress: () => share()
    }
  ]

  const review = async () => {
    if (Platform.OS === 'android') {
      const androidPackageName = 'com.yuenkai.CheckMate'
      Linking.openURL(`market://details?id=${androidPackageName}&showAllReviews=true`)
    } else if (Platform.OS === 'ios') {
      Linking.openURL(
        `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${1570727502}?action=write-review`
      )
    }
  }

  const share = async () => {
    try {
      await Share.share(
        {
          message:
            'Try CheckMate, a free productivity app. Download here: https://tinyurl.com/CheckMate-Schedule',
          url: 'https://tinyurl.com/CheckMate-Schedule',
          title: 'Download CheckMate'
        },
        {
          subject: 'Download CheckMate',
          tintColor: '#6a99e6'
        }
      )
    } catch (error) {
      alert(error.message)
    }
  }

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
      await getSyncPref()
      await getNotiPref()
      await getThemePref()

      setReady(true)
    } catch (e) {
      setAlert({
        show: true,
        title: 'Error getting data!',
        message: 'Please try again.'
      })
      console.log(e)
    }
  }

  const getSyncPref = async () => {
    try {
      const value = await AsyncStorage.getItem('syncEvents5')
      const pref = value != null ? JSON.parse(value) : null
      if (pref != null) {
        setSyncPref(pref)
        if (pref === 'never') {
          setChecked(1)
        } else if (pref === 'review') {
          setChecked(2)
        } else {
          setChecked(3)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getNotiPref = async () => {
    try {
      const value = await AsyncStorage.getItem('notiPref')
      if (value !== null) {
        setNotiPref(JSON.parse(value))
        originalNotiPref.push(...JSON.parse(value))
      } else {
        notiPref.push({
          weekly: false,
          show: false,
          days: [
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false }
          ],
          time: new Date(Math.floor(Date.now() / (60 * 1000)) * 60 * 1000)
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getThemePref = async () => {
    try {
      const value = await AsyncStorage.getItem('themePref')
      if (value !== null && JSON.parse(value) !== 'system') {
        setThemePref(JSON.parse(value))
        if (JSON.parse(value) === 'light') {
          setCheckedT(1)
          setColorScheme('light')
          setColors(theme.lightColors)
        } else {
          setCheckedT(2)
          setColorScheme('dark')
          setColors(theme.darkColors)
        }
      } else if (Appearance.getColorScheme() == null) {
        setCheckedT(3)
        setColorScheme('light')
        setColors(theme.lightColors)
      } else if (Appearance.getColorScheme() === 'dark') {
        setCheckedT(3)
        setColorScheme('dark')
        setColors(theme.darkColors)
      } else {
        setCheckedT(3)
        setColorScheme('light')
        setColors(theme.lightColors)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function changeNoti (i, j) {
    const change = [...notiPref]
    change[i].days[j].use = !change[i].days[j].use
    await setNotiPref(change)
  }

  async function changeWeekly (i, value) {
    const change = [...notiPref]
    change[i].weekly = value
    await setNotiPref(change)
  }

  const onChange = (event, selectedDate, i) => {
    const change = [...notiPref]
    change[i].time = selectedDate || change[i].time
    setNotiPref(change)
    setShow(false, i)
  }

  async function removeNoti (i) {
    const notification = notiPref[i]
    for (let j = 0; j < 7; j++) {
      if (notification.days[j].notiID !== '') {
        await Notifications.cancelScheduledNotificationAsync(
          notification.days[j].notiID
        )
      }
    }
    const change = [...notiPref]
    change.splice(i, 1)
    setNotiPref(change)
  }

  function setShow (thing, i) {
    const change = [...notiPref]
    change[i].show = thing
    setNotiPref(change)
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

  function newInfo (i) {
    return (
      originalNotiPref.length > i &&
      originalNotiPref[i].weekly === notiPref[i].weekly &&
      originalNotiPref[i].days.every(
        (v, j) =>
          v === notiPref[i].days[j] &&
          originalNotiPref[i].time === notiPref[i].time
      )
    )
  }

  async function schedulePushNotification (time, i, weekly) {
    if (weekly) {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to start working!',
          body: 'Time to be productive!'
        },
        trigger: {
          weekday: i + 1,
          hour: new Date(time).getHours(),
          minute: new Date(time).getMinutes(),
          repeats: true,
          channelId: 'Productivity Reminders'
        }
      })
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to start working!',
        body: 'Time to be productive!'
      },
      trigger: {
        date: new Date(
          new Date(time).setDate(
            new Date().getDate() + (i - new Date().getDay())
          )
        ),
        channelId: 'Productivity Reminders'
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
      Notifications.setNotificationChannelAsync('Productivity Reminders', {
        name: 'Productivity Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C'
      })
      Notifications.deleteNotificationChannelAsync('default')
    }

    return token
  }

  async function handleSave () {
    // schedule push notifications
    for (let i = 0; i < notiPref.length; i++) {
      const notification = notiPref[i]
      for (let j = 0; j < 7; j++) {
        if (
          notification.weekly ||
          new Date(
            new Date(notification.time).setDate(
              new Date().getDate() + (j - new Date().getDay())
            )
          ) > new Date()
        ) {
          if (notification.days[j].notiID !== '') {
            await Notifications.cancelScheduledNotificationAsync(
              notification.days[j].notiID
            )
          }

          if (notification.days[j].use) {
            notiPref[i].days[j].notiID = await schedulePushNotification(
              notification.time,
              j,
              notification.weekly
            )
          }
        }
      }
    }

    // save settings to AsyncStorage
    await AsyncStorage.setItem('syncEvents5', JSON.stringify(syncPref))
    await AsyncStorage.setItem('notiPref', JSON.stringify(notiPref))
    await AsyncStorage.setItem('themePref', JSON.stringify(themePref))

    // return to homescreen
    navigation.navigate('Home', { editName: '' })
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
      <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />

      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Header
          backgroundColor={colors.background}
          placement="left"
          centerComponent={{
            text: 'Settings',
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
              color={colors.grey1}
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

        <Dialog
          isVisible={syncView}
          onBackdropPress={() => setSyncView(false)}
          overlayStyle={{ backgroundColor: colors.white }}
        >
          <Dialog.Title
            title="When do you want to sync with calendar events?"
            titleStyle={{ color: colors.grey1 }}
          />
          {['Never', 'After Review', 'Always'].map((l, i) => (
            <CheckBox
              key={i}
              title={l}
              textStyle={{ color: colors.grey1 }}
              containerStyle={{ backgroundColor: colors.white, borderWidth: 0 }}
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={checked === i + 1}
              onPress={() => setChecked(i + 1)}
            />
          ))}

          <Dialog.Actions>
            <Dialog.Button
              title="CONFIRM"
              titleStyle={{ color: colors.grey1 }}
              onPress={() => {
                if (checked === 1) {
                  setSyncPref('never')
                } else if (checked === 2) {
                  setSyncPref('review')
                } else {
                  setSyncPref('always')
                }
                setSyncView(false)
              }}
            />
          </Dialog.Actions>
        </Dialog>

        <Dialog
          isVisible={notiView}
          onBackdropPress={() => setNotiView(false)}
          overlayStyle={{ backgroundColor: colors.white }}
        >
          <ScrollView>
            <Dialog.Title
              title="When do you want reminder notifications?"
              titleStyle={{ color: colors.grey1 }}
            />

            {notiPref.map((l, i) => (
              <View key={i} style={{ flexDirection: 'row', marginVertical: 5 }}>
                <View style={{ borderWidth: 1, borderRadius: 10 }}>
                  <Button
                    buttonStyle={{
                      backgroundColor: colors.primary,
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                      justifyContent: 'flex-start'
                    }}
                    onPress={() => setShow(true, i)}
                  >
                    <Text style={{ color: colors.white, marginLeft: 55 }}>
                      {displayTime(l.time)}
                    </Text>
                    <Icon
                      name="clear"
                      type="material"
                      onPress={() => removeNoti(i)}
                      color={colors.white}
                      style={{ marginLeft: 50 }}
                    />
                  </Button>
                  {l.show && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={new Date(l.time)}
                      mode={'time'}
                      onChange={(event, selectedDate) =>
                        onChange(event, selectedDate, i)
                      }
                      style={{ width: '100%' }}
                    />
                  )}
                  <View
                    style={[
                      styles.section,
                      { flexDirection: 'row', alignItems: 'center' }
                    ]}
                  >
                    {newInfo(i)
                      ? (
                      <Text
                        h1
                        h1Style={[styles.label, { color: colors.grey1 }]}
                      >
                        {' '}
                        Edit on:
                      </Text>
                        )
                      : (
                      <Text
                        h1
                        h1Style={[styles.label, { color: colors.grey1 }]}
                      >
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
                    textStyle={{ color: colors.grey1 }}
                    checked={l.weekly}
                    onPress={() => changeWeekly(i, !l.weekly)}
                  />

                  <View
                    style={{
                      padding: 8,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {l.days.map((day, j) => {
                      return (
                        <Avatar
                          key={j}
                          containerStyle={
                            day.use === true
                              ? { backgroundColor: colors.primary, margin: 1 }
                              : { backgroundColor: colors.grey3, margin: 1 }
                          }
                          size={25}
                          rounded
                          title={days[j].slice(0, 1)}
                          titleStyle={
                            day === true
                              ? { color: colors.white }
                              : { color: colors.background }
                          }
                          onPress={() => changeNoti(i, j)}
                        />
                      )
                    })}
                  </View>
                  {l.days.some((e) => e.use === true) === false
                    ? (
                    <Text
                      style={{
                        fontSize: 15,
                        color: colors.error,
                        alignSelf: 'center'
                      }}
                    >
                      Nothing is selected
                    </Text>
                      )
                    : null}
                </View>
              </View>
            ))}

            <Dialog.Actions>
              <Dialog.Button
                title="Done"
                onPress={() => {
                  setNotiView(false)
                }}
              />
              <Dialog.Button
                title="New"
                onPress={() => {
                  const tempPref = [...notiPref]
                  tempPref.push({
                    weekly: false,
                    show: false,
                    days: [
                      { notiID: '', use: false },
                      { notiID: '', use: false },
                      { notiID: '', use: false },
                      { notiID: '', use: false },
                      { notiID: '', use: false },
                      { notiID: '', use: false },
                      { notiID: '', use: false }
                    ],
                    time: new Date(
                      Math.floor(Date.now() / (60 * 1000)) * 60 * 1000
                    )
                  })
                  setNotiPref(tempPref)
                }}
              />
            </Dialog.Actions>
          </ScrollView>
        </Dialog>
        <Dialog
          isVisible={themeView}
          onBackdropPress={() => setThemeView(false)}
          overlayStyle={{ backgroundColor: colors.white }}
        >
          <Dialog.Title
            title="Set Theme"
            titleStyle={{ color: colors.grey1 }}
          />
          {['Light Mode', 'Dark Mode', 'System'].map((l, i) => (
            <CheckBox
              key={i}
              title={l}
              textStyle={{ color: colors.grey1 }}
              containerStyle={{ backgroundColor: colors.white, borderWidth: 0 }}
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={checkedT === i + 1}
              onPress={() => setCheckedT(i + 1)}
            />
          ))}

          <Dialog.Actions>
            <Dialog.Button
              title="CONFIRM"
              onPress={() => {
                if (checkedT === 1) {
                  setColorScheme('light')
                  setColors(theme.lightColors)
                  setThemePref('light')
                } else if (checkedT === 2) {
                  setColorScheme('dark')
                  setColors(theme.darkColors)
                  setThemePref('dark')
                } else {
                  if (Appearance.getColorScheme() == null) {
                    setColorScheme('light')
                    setColors(theme.lightColors)
                  } else if (Appearance.getColorScheme() === 'dark') {
                    setColorScheme('dark')
                    setColors(theme.darkColors)
                  } else {
                    setColorScheme('light')
                    setColors(theme.lightColors)
                  }
                  setThemePref('system')
                }
                setThemeView(false)
              }}
            />
          </Dialog.Actions>
        </Dialog>

        {list.map((l, i) => (
          <TouchableOpacity key={i} onPress={() => l.onPress()}>
            <ListItem containerStyle={{ backgroundColor: colors.grey4 }}>
              {l.icon}
              <ListItem.Content>
                <ListItem.Title style={{ color: colors.grey1 }}>
                  {l.name}
                </ListItem.Title>
              </ListItem.Content>
            </ListItem>
          </TouchableOpacity>
        ))}

        <Button
          title="Save"
          titleStyle={{ color: colors.white }}
          buttonStyle={{
            backgroundColor: colors.primary,
            alignSelf: 'flex-end',
            margin: 10,
            marginTop: 20,
            paddingHorizontal: 15,
            paddingVertical: 5,
            borderRadius: 8
          }}
          onPress={() => handleSave()}
        />
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
  },
  label: {
    fontSize: 16,
    color: '#8a939c'
  }
})
