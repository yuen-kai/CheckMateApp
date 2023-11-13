/* eslint-disable multiline-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  useColorScheme,
  SafeAreaView
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Slider,
  Input,
  CheckBox,
  Avatar,
  Icon,
  Text,
  Button,
  ThemeProvider,
  createTheme,
  Header,
  Dialog
} from '@rneui/themed'
import Section from './Section'

let savedTasks

export default function AddTaskScreen ({ route, navigation }) {
  let selectedTask
  const { editName } = route.params
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
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
  const [date, setDate] = useState(new Date().setHours(24, 0, 0, 0))
  const [mode, setMode] = useState('date')
  const [show, setShow] = useState(false)
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [importance, setImportance] = useState(5)
  const [dueImportance, setDueImportance] = useState(3)
  const [length, setLength] = useState(0)
  const [originalLength, setOriginalLength] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [weekly, setWeekly] = useState(false)
  const [description, setDescription] = useState('')
  const [empty, setEmpty] = useState(false)
  const [edit, setEdit] = useState(false)
  const [same, setSame] = useState(false)
  const [alert, setAlert] = useState({ show: false })
  const [checked, setChecked] = useState(1)
  const [timeUsed, setTimeUsed] = useState(0)

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

  // Get data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getData()
    })

    return unsubscribe
  }, [])

  const getData = async () => {
    const change = [...daysUsed]
    change.splice(new Date().getDay(), 1, true)
    setDaysUsed(change)
    try {
      const jsonValue = await AsyncStorage.getItem('tasks')
      savedTasks = jsonValue != null ? JSON.parse(jsonValue) : null
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

  async function getTheme () {
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

  const editInfo = async () => {
    try {
      if (editName !== '') {
        const change = [...daysUsed]
        selectedTask =
          savedTasks[0][new Date().getDay()][
            savedTasks[0][new Date().getDay()].findIndex(
              (task) => task.name === editName
            )
          ]
        setEdit(true)
        setDate(new Date(selectedTask.date))
        setName(selectedTask.name)
        setImportance(selectedTask.importance)
        setLength(selectedTask.length)

        if (selectedTask.originalLength != null) {
          setOriginalLength(selectedTask.originalLength)
        }
        if (selectedTask.timeUsed != null) {
          setTimeUsed(selectedTask.timeUsed)
        }

        setHours(Math.floor(selectedTask.length / 60))
        setMinutes(selectedTask.length % 60)

        setDueImportance(selectedTask.dueImportance)
        setDescription(selectedTask.description)
        for (let i = 0; i <= daysUsed.length - 1; i++) {
          if (
            savedTasks[0][i].some((task) => task.name === editName) ||
            savedTasks[1][i].some((task) => task.name === editName)
          ) {
            change.splice(i, 1, true)
          }
        }
        await setDaysUsed(change)
        isRepeating()
        for (let i = 0; i < savedTasks[1].length; i++) {
          if (savedTasks[1][i].some((task) => task.name === editName)) {
            setWeekly(true)
          }
        }
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

  function newInfo () {
    const task = savedTasks[0][new Date().getDay()].find(
      (task) => task.name === editName
    )

    // check if state props are the same as task props
    return (
      task !== undefined &&
      edit &&
      !(
        name === task.name &&
        importance === task.importance &&
        length === task.length &&
        dueImportance === task.dueImportance &&
        new Date(date).getTime() === new Date(task.date).getTime()
      )
    )
  }

  // Date picker
  function showDatepicker () {
    showMode('date')
  }

  function showTimepicker () {
    showMode('time')
  }

  function showMode (currentMode) {
    setShow(true)
    setMode(currentMode)
  }

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date
    setShow(false)
    setDate(currentDate)
  }

  // Display Time/Date
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

  function displayDate (date) {
    const month = new Date(date).getMonth() + 1
    const day = new Date(date).getDate()
    return month + '/' + day
  }

  // Update days used
  async function changeDay (i) {
    const change = [...daysUsed]
    change.splice(i, 1, !daysUsed[i])
    await setDaysUsed(change)
    isRepeating()
  }

  function printSavedTasks (savedTasks) {
    console.log('||||||||||||||||||||||||||||||||||||||||')
    for (let i = 0; i < savedTasks.length; i++) {
      console.log('-----------' + days[i] + '--------------')
      for (let j = 0; j < savedTasks[i].length; j++) {
        console.log(savedTasks[i][j].name)
      }
    }
  }

  async function saveTasks (thisOrAll) {
    let d
    if (daysUsed[new Date().getDay()]) {
      d = new Date().setHours(0, 0, 0, 0)
    } else {
      if (daysUsed.indexOf(true) - new Date().getDay() > 0) {
        d = new Date().setDate(
          new Date().getDate() + daysUsed.indexOf(true) - new Date().getDay()
        )
      } else {
        d = new Date().setDate(
          new Date().getDate() +
            daysUsed.indexOf(true) -
            new Date().getDay() +
            7
        )
      }
      d = new Date(d).setHours(0, 0, 0, 0)
    }
    const dueIncrease = new Date(date).getTime() - new Date(d).getTime()
    selectedTask = {
      name,
      sortValue:
        parseInt(
          new Date(date).getTime() / (1000 * 60 * 60) +
            (6 - dueImportance) * 2 * (11 - importance)
        ) +
        parseInt(length) / 10,
      length: parseInt(length),
      pLength: parseInt(length),
      originalLength: originalLength > 0 ? originalLength : length,
      timeUsed,
      date,
      start: new Date(),
      end: new Date(),
      importance,
      dueImportance,
      repeating: isRepeating(),
      dueIncrease,
      description,
      weekly
    }

    // Put in event for all the days used
    for (let i = 0; i <= daysUsed.length - 1; i++) {
      if (daysUsed[i] === true) {
        if (edit === true && savedTasks[0][i].some((task) => task.name === editName)) {
          savedTasks[0][i].splice(
            savedTasks[0][i].findIndex((task) => task.name === editName),
            1
          )
        }
        savedTasks[0][i].push({ ...selectedTask })
        if (i !== new Date().getDay()) {
          savedTasks[0][i][savedTasks[0][i].length - 1].timeUsed = 0
        }

        if (weekly === true) {
          if (edit === true && savedTasks[1][i].some((task) => task.name === editName)) {
            savedTasks[1][i].splice(
              savedTasks[1][i].findIndex((task) => task.name === editName),
              1
            )
          }
          savedTasks[1][i].push({ ...selectedTask })
          savedTasks[1][i][savedTasks[1][i].length - 1].timeUsed = 0
        }
      } else if (thisOrAll !== 'none') {
        if (savedTasks[0][i].some((task) => task.name === selectedTask.name)) {
          savedTasks[0][i].splice(
            savedTasks[0][i].findIndex(
              (task) => task.name === selectedTask.name
            ),
            1
          )
        }
        if (
          thisOrAll === 'all' &&
          savedTasks[1][i].some((task) => task.name === selectedTask.name)
        ) {
          savedTasks[1][i].splice(
            savedTasks[1][i].findIndex(
              (task) => task.name === selectedTask.name
            ),
            1
          )
        }
      }
    }
    // printSavedTasks(savedTasks[0])
    setEmpty(false)

    // save data
    try {
      const jsonValue = JSON.stringify(savedTasks)
      await AsyncStorage.setItem('tasks', jsonValue)
    } catch (e) {
      console.log(e)
    }

    // Go back to home page
    navigation.navigate('Home', { editName: selectedTask.name })
  }

  // Saving/Processing
  const handleSave = async () => {
    // Check if valid
    if (name === '' || importance === 0 || length === 0) {
      setEmpty(true)
      setAlert({
        show: true,
        title: 'Invalid Task',
        message: 'Not all fields have been filled out!',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else if ((await sameName(name)) === true) {
      setAlert({
        show: true,
        title: 'Name Taken',
        message: 'Name already taken. Please choose a different name.',
        buttons: [{ title: 'OK', action: () => setAlert({ show: false }) }]
      })
    } else {
      if (!newInfo()) {
        // check if task occurs in savedTasks[1]
        let occurs = false
        for (let i = 0; i < savedTasks[1].length; i++) {
          if (savedTasks[1][i].some((element) => element.name === editName)) {
            occurs = true
          }
        }

        let secondOccurs = false

        // check if task occurs in savedTasks[0] but usedDays[i] is false
        for (let i = 0; i < savedTasks[0].length; i++) {
          if (
            savedTasks[0][i].some((element) => element.name === editName) &&
            !daysUsed[i]
          ) {
            secondOccurs = true
          }
        }

        // check if task occurs in savedTasks[1] but usedDays[i] is false
        if (weekly) {
          for (let i = 0; i < savedTasks[1].length; i++) {
            if (
              savedTasks[1][i].some((element) => element.name === editName) &&
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
          saveTasks('none')
        }
      } else {
        saveTasks('none')
      }
    }
  }

  async function sameName (name) {
    const savedTaskJsonValue = await AsyncStorage.getItem('setTasks')
    const events =
      savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null
    for (let i = 0; i < daysUsed.length; i++) {
      if (daysUsed[i]) {
        if ((edit === true && name !== editName) || edit === false) {
          if (
            events[0][i].some((element) => element.name === name) ||
            (weekly &&
              events[1][i].some((element) => element.name === name)) ||
            savedTasks[0][i].some((element) => element.name === name) ||
            (weekly &&
              savedTasks[1][i].some((element) => element.name === name))
          ) {
            setSame(true)
            return true
          }
        }
      }
    }
    setSame(false)
    return false
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
      setReady(true)
      return true
    } else {
      setReady(true)
      return false
    }
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
            text: edit === true ? 'Edit Task' : 'Add Task',
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

        {alert.show ? (
          <Dialog
            overlayStyle={{ backgroundColor: colors.white }}
            onBackdropPress={() => setAlert({ show: false })}
          >
            <Dialog.Title
              title={alert.title}
              titleStyle={{ color: colors.grey1 }}
            />
            {alert.message !== 'reccuring' ? (
              <Text style={{ color: colors.grey1 }}>{alert.message}</Text>
            ) : (
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
              {alert.message === 'reccuring' ? (
                <Dialog.Button
                  title="OK"
                  titleStyle={{ color: colors.grey1 }}
                  onPress={() => {
                    setAlert({ show: false })
                    checked === 1 ? saveTasks('this') : saveTasks('all')
                  }}
                />
              ) : null}
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

        <ScrollView>
          <View style={{ flex: 1 }}>
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
                contentStyle={{
                  borderColor: colors.grey2,
                  paddingTop: 7,
                  paddingBottom: 3
                }}
              >
                <Input
                  multiline
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  placeholder="Add Name"
                  placeholderTextColor={colors.grey2}
                  renderErrorMessage={false}
                  errorStyle={{ color: colors.error }}
                  onChangeText={async (name) => {
                    setName(name)
                    await sameName(name)
                  }}
                  value={name}
                  inputStyle={{ color: colors.grey1, fontSize: 17 }}
                  selectionColor={colors.primary}
                />
              </Section>
            </View>
            {(empty && name === '') || same ? (
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
            ) : null}
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
                contentStyle={{
                  borderColor: colors.grey2,
                  paddingTop: 7,
                  paddingBottom: 3
                }}
              >
                <Input
                  multiline
                  placeholder="Add Description"
                  placeholderTextColor={colors.grey2}
                  renderErrorMessage={false}
                  onChangeText={(description) => setDescription(description)}
                  value={description}
                  inputStyle={{ color: colors.grey1, fontSize: 17 }}
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  selectionColor={colors.primary}
                />
              </Section>
            </View>

            <View style={styles.section}>
              <Icon
                name="timer"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <View style={[styles.section, { width: '83%' }]}>
                <Section
                  labelContainerStyle={{ backgroundColor: colors.background }}
                  label="Hours"
                  labelStyle={{ color: colors.grey2 }}
                  contentStyle={{
                    borderColor: colors.grey2,
                    paddingHorizontal: 5,
                    paddingVertical: 8,
                    justifyContent: 'center'
                  }}
                  containerStyle={{ flex: 3, marginRight: 5 }}
                >
                  <Input
                    placeholder="Hours"
                    placeholderTextColor={colors.grey2}
                    keyboardType="numeric"
                    onChangeText={(hours) => {
                      hours = parseInt(hours)
                      if (isNaN(hours)) {
                        hours = 0
                      }
                      setHours(hours)
                      setLength(hours * 60 + minutes)
                    }}
                    value={
                      hours !== 0 && !isNaN(hours) ? hours.toString() : null
                    }
                    inputStyle={{ color: colors.grey1, fontSize: 17 }}
                    renderErrorMessage={false}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    selectionColor={colors.primary}
                  />
                </Section>
                <Section
                  labelContainerStyle={{ backgroundColor: colors.background }}
                  label="Minutes"
                  labelStyle={{ color: colors.grey2 }}
                  contentStyle={{
                    borderColor: colors.grey2,
                    paddingHorizontal: 5,
                    paddingVertical: 8,
                    justifyContent: 'center'
                  }}
                  containerStyle={{ flex: 3, marginRight: 5 }}
                >
                  <Input
                    placeholder="Minutes"
                    placeholderTextColor={colors.grey2}
                    renderErrorMessage={false}
                    errorStyle={{ color: colors.error }}
                    keyboardType="numeric"
                    onChangeText={(minutes) => {
                      minutes = parseInt(minutes)
                      if (isNaN(minutes)) {
                        minutes = 0
                      }
                      setMinutes(minutes)
                      setLength(hours * 60 + minutes)
                    }}
                    value={
                      minutes !== 0 && !isNaN(minutes)
                        ? minutes.toString()
                        : null
                    }
                    inputStyle={{ color: colors.grey1, fontSize: 17 }}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    selectionColor={colors.primary}
                  />
                </Section>
              </View>
            </View>
            {empty && length === 0 ? (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.error,
                  alignSelf: 'flex-start',
                  left: '17%'
                }}
              >
                {'Enter a non-zero task length'}
              </Text>
            ) : null}
            <View style={styles.section}>
              <Icon
                name="exclamation-triangle"
                type="font-awesome-5"
                color={colors.grey1}
                size={20}
                style={{ marginLeft: 3 }}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Importance"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2 }}
              >
                <View style={{ marginTop: 10, marginLeft: 7 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Text style={{ fontSize: 13, color: colors.grey2 }}>
                      Least
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.grey2 }}>
                      Most
                    </Text>
                  </View>
                  <Slider
                    thumbStyle={{ width: 25, height: 25 }}
                    trackStyle={{ width: '100%' }}
                    minimumTrackTintColor={colors.grey2}
                    maximumTrackTintColor={colors.grey4}
                    value={importance}
                    allowTouchTrack={true}
                    onValueChange={(importance) => setImportance(importance)}
                    minimumValue={1}
                    maximumValue={10}
                    thumbTintColor={colors.primary}
                    thumbProps={{
                      children: (
                        <Text
                          style={{
                            fontSize: 15,
                            padding: 3,
                            alignSelf: 'center',
                            color: colors.white
                          }}
                        >
                          {importance}
                        </Text>
                      )
                    }}
                    step={1}
                  />
                </View>
              </Section>
            </View>

            <View style={styles.section}>
              <Icon
                name="calendar-today"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Due Date"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2 }}
              >
                <View
                  style={{ flexDirection: 'row', marginLeft: 5, marginTop: 10 }}
                >
                  <View style={{ padding: 3 }}>
                    <Button
                      title={displayDate(date)}
                      titleStyle={{ color: colors.white }}
                      buttonStyle={{
                        backgroundColor: colors.primary,
                        borderRadius: 5
                      }}
                      onPress={() => showDatepicker()}
                    />
                  </View>
                  <View style={{ padding: 3 }}>
                    <Button
                      title={displayTime(date)}
                      titleStyle={{ color: colors.white }}
                      buttonStyle={{
                        backgroundColor: colors.primary,
                        borderRadius: 5
                      }}
                      onPress={() => showTimepicker()}
                    />
                  </View>
                </View>

                {show && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={new Date(date)}
                    mode={mode}
                    onChange={onChange}
                    style={{
                      width: '100%',
                      backgroundColor: colors.background
                    }}
                    textColor={colors.white}
                    themeVariant={colorScheme}
                  />
                )}
              </Section>
            </View>
            <View style={styles.section}>
              <Icon
                name="calendar-alert"
                type="material-community"
                color={colors.grey1}
                size={35}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Due Date's Importance"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2 }}
              >
                <View style={{ marginTop: 10, marginLeft: 7 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Text style={{ fontSize: 13, color: colors.grey2 }}>
                      Least
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.grey2 }}>
                      Most
                    </Text>
                  </View>
                  <Slider
                    thumbStyle={{ width: 25, height: 25 }}
                    trackStyle={{ width: '100%' }}
                    minimumTrackTintColor={colors.grey2}
                    maximumTrackTintColor={colors.grey4}
                    value={dueImportance}
                    onValueChange={(dueImportance) =>
                      setDueImportance(dueImportance)
                    }
                    minimumValue={1}
                    maximumValue={5}
                    allowTouchTrack={true}
                    thumbTintColor={colors.primary}
                    thumbProps={{
                      children: (
                        <Text
                          style={{
                            fontSize: 15,
                            padding: 3,
                            alignSelf: 'center',
                            color: colors.white
                          }}
                        >
                          {dueImportance}
                        </Text>
                      )
                    }}
                    step={1}
                  />
                </View>
              </Section>
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
                  textStyle={{ color: colors.grey2 }}
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
                {daysUsed.includes(true) === false ? (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.error,
                      alignSelf: 'center'
                    }}
                  >
                    Nothing is selected!
                  </Text>
                ) : null}
              </Section>
            </View>
            <Button
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
          </View>
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
    padding: 10
  },
  button: {
    backgroundColor: '#152075',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 5
  },
  label: {
    fontSize: 16
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 5
  }
})
