/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect } from 'react'
import { StyleSheet, ScrollView, Alert, View, Platform, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Button,
  ListItem,
  Text,
  CheckBox,
  Dialog,
  Icon,
  Avatar
} from '@rneui/base'

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

  const [themePref, setThemePref] = useState('dark')

  const list = [
    {
      name: 'Sync w/ Calendar Preferences',
      icon: <Icon name="sync" type="material" />,
      onPress: () => setSyncView(true)
    },
    {
      name: 'Notification Preferences',
      icon: <Icon name="notifications" type="material" />,
      onPress: () => setNotiView(true)
    },
    {
      name: 'Theme',
      icon: <Icon name="color-lens" type="material" />,
      onPress: () => setThemeView(true)
    }
  ]

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
      setReady(false)

      await getSyncPref()
      await getNotiPref()
      await getThemePref()

      setReady(true)
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  const getSyncPref = async () => {
    try {
      const value = await AsyncStorage.getItem('syncEvents5')
      if (value !== null) {
        const pref = JSON.parse(value)
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
      } else {
        notiPref.push({
          weekly: false,
          days: [
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false },
            { notiID: '', use: false }
          ]
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getThemePref = async () => {
    try {
      const value = await AsyncStorage.getItem('themePref')
      if (value !== null) {
        setThemePref(JSON.parse(value))
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

  function newInfo (i) {
    return (
      originalNotiPref.length > i &&
      originalNotiPref[i].weekly === notiPref[i].weekly &&
      originalNotiPref[i].days.every((v, j) => v === notiPref[i].days[j])
    )
  }

  async function schedulePushNotification (time, i) {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to start working!',
        body: 'Time to be productive!'
      },
      trigger: {
        weekday: i + 1,
        hour: new Date(time).getHours(),
        minute: new Date(time).getMinutes(),
        repeats: true
      }
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

  async function handleSave () {
    // save settings to AsyncStorage
    await AsyncStorage.setItem('syncEvents5', JSON.stringify(syncPref))
    await AsyncStorage.setItem('notiPref', JSON.stringify(notiPref))
    // await AsyncStorage.setItem('themePref', JSON.stringify(themePref))

    // schedule push notifications
    for (let i = 0; i < notiPref.length; i++) {
      const notification = notiPref[i]
      for (let j = 0; j < 7; j++) {
        if (notification.days[j].notiid != null) {
          await Notifications.cancelScheduledNotificationAsync(
            notification.days[j].notiId
          )
        }

        if (notification.days[j].use) {
          notiPref[i].days[j].notiId = await schedulePushNotification(
            notification.time,
            j,
            notification.weekly
          )
        }
      }
    }

    // return to homescreen
    navigation.navigate('Home', { editName: '' })
  }

  if (!ready) {
    return null
  }
  return (
    <SafeAreaView style={styles.container}>
      <Dialog
        isVisible={syncView}
        onBackdropPress={() => setSyncView(false)}
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
        overlayStyle={{ backgroundColor: 'white' }}
      >
        <Dialog.Title title="When do you want reminder notifications?" />
        {notiPref.map((l, i) => (
          <View key={i} style={{ borderWidth: 1, borderRadius: 10 }}>
            <View
              style={[
                styles.section,
                { flexDirection: 'row', alignItems: 'center' }
              ]}
            >
              {newInfo(i)
                ? (
                <Text h1 h1Style={styles.label}>
                  {' '}
                  Edit on:
                </Text>
                  )
                : (
                <Text h1 h1Style={styles.label}>
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
                        ? { backgroundColor: '#6a99e6', margin: 1 }
                        : { backgroundColor: 'gray', margin: 1 }
                    }
                    size="small"
                    rounded
                    title={days[j].slice(0, 1)}
                    onPress={() => changeNoti(i, j)}
                  />
                )
              })}
            </View>
            {l.days.some((e) => e.use === true) === false
              ? (
              <Text style={{ fontSize: 15, color: 'red', alignSelf: 'center' }}>
                Nothing is selected!
              </Text>
                )
              : null}
          </View>
        ))}

        <Dialog.Actions>
          <Dialog.Button
            title="New"
            onPress={() => {
              notiPref.push({
                weekly: false,
                days: [
                  { notiID: '', use: false },
                  { notiID: '', use: false },
                  { notiID: '', use: false },
                  { notiID: '', use: false },
                  { notiID: '', use: false },
                  { notiID: '', use: false },
                  { notiID: '', use: false }
                ]
              })
            }}
          />
        </Dialog.Actions>
      </Dialog>

      {list.map((l, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => l.onPress()}
        >
          <ListItem>
            {l.icon}
            <ListItem.Content>
              <ListItem.Title>{l.name}</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </TouchableOpacity>
      ))}

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
