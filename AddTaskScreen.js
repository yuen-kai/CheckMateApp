/* eslint-disable multiline-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  useColorScheme,
  Appearance,
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
  Header
} from '@rneui/themed'
// import { DateTimePicker } from 'react-native-ui-lib'
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
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [weekly, setWeekly] = useState(false)
  const [description, setDescription] = useState('')
  const [empty, setEmpty] = useState(false)
  const [edit, setEdit] = useState(false)
  const [same, setSame] = useState(false)

  const theme = createTheme({
    lightColors: {
      primary: '#6a99e6',
      background: '#f2f2f2'
    },
    darkColors: {
      primary: '#56a3db',
      white: '#606060',
      // primary: '#6a99e6',
      background: '#222222'
      // grey3: ''
    }
  })

  const [colors, setColors] = useState(theme.lightColors)
  const [colorScheme, setColorScheme] = useState(useColorScheme())

  // Get data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // console.log('hello')
      getData()
    })
    // console.log('hello')
    // getData()

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
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
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

        setHours(Math.floor(selectedTask.length / 60))
        setMinutes(selectedTask.length % 60)

        setDueImportance(selectedTask.dueImportance)
        setDescription(selectedTask.description)
        // await AsyncStorage.removeItem('editName')
        for (let i = 0; i <= daysUsed.length - 1; i++) {
          if (
            savedTasks[0][i].findIndex((task) => task.name === editName) !== -1
          ) {
            change.splice(i, 1, true)
          }
        }
        await setDaysUsed(change)
        isRepeating()
        if (
          savedTasks[1][new Date().getDay()].findIndex(
            (task) => task.name === editName
          ) !== -1
        ) {
          setWeekly(true)
        }
      }
    } catch (e) {
      // await AsyncStorage.removeItem('editName')
      Alert.alert(
        'Failed to get edit info!',
        'Failed to get edit info! Please try again.'
      )
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

  // Saving/Processing
  const handleSave = async () => {
    // await editInfo()
    // console.log(edit)
    let d
    // ((((importance*8)/100)*(length))/((6-dueImportance)*30))*24*60*60*1000
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
      date,
      start: new Date(),
      end: new Date(),
      importance,
      dueImportance,
      repeating: isRepeating(),
      dueIncrease,
      description
    }
    // console.log(selectedTask.length)
    // Same name

    // Check if valid
    if (name === '' || importance === 0 || length === 0) {
      setEmpty(true)
      Alert.alert('Invalid Task', 'Not all fields have been filled out!')
    } else if ((await sameName()) === true) {
      // setSame(true)
      Alert.alert('Name Used', 'Name already used. Please select a new name.')
    } else {
      // Put in task for all the days used
      for (let i = 0; i <= daysUsed.length - 1; i++) {
        if (daysUsed[i] === true) {
          if (edit === true) {
            savedTasks[0][i].splice(
              savedTasks[0][i].findIndex((task) => task.name === editName),
              1
            )
          }
          savedTasks[0][i].push(selectedTask)

          if (weekly === true) {
            if (edit === true) {
              savedTasks[1][i].splice(
                savedTasks[1][i].findIndex((task) => task.name === editName),
                1
              )
            }

            savedTasks[1][i].push(selectedTask)
          }
        } else if (!newInfo()) {
          if (
            savedTasks[0][i].some((task) => task.name === selectedTask.name)
          ) {
            savedTasks[0][i].splice(
              savedTasks[0][i].findIndex(
                (task) => task.name === selectedTask.name
              ),
              1
            )
          }
          if (
            weekly === true &&
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
  }

  async function sameName () {
    const savedTaskJsonValue = await AsyncStorage.getItem('setTasks')
    const workTimes =
      savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null
    for (let i = 0; i < daysUsed.length; i++) {
      if (daysUsed[i]) {
        if ((edit === true && name !== editName) || edit === false) {
          // console.log(edit)
          if (
            workTimes[0][i].some((element) => element.name === name) ||
            (weekly &&
              workTimes[1][i].some((element) => element.name === name)) ||
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
      <View style={[styles.container, { backgroundColor: colors.background }]} />
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
          // centerComponent=
        />

        <ScrollView>
          <View style={{ flex: 1 }}>
            {/* <View style={styles.section}> */}
            <View style={styles.section}>
              <Icon
                name="reorder"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Name"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2, paddingTop: 7, paddingBottom: 3 }}
              >
                {/* <Text style={{ fontSize: 17, padding:3}}>Name:</Text> */}
                <Input
                  multiline
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  // label="Name"
                  // labelStyle={{ color: colors.grey2 }}
                  placeholder="Add Name"
                  placeholderTextColor={colors.grey2}
                  renderErrorMessage={(empty && name === '') || same}
                  errorMessage={
                    empty && name === ''
                      ? 'Please enter a name'
                      : same
                        ? 'Another task or event already has this name'
                        : null
                  }
                  errorStyle={{ color: colors.error }}
                  onChangeText={async (name) => {
                    setName(name)
                    await sameName()
                    // console.log(same)
                  }}
                  value={name}
                  inputStyle={{ color: colors.grey1, fontSize: 17 }}
                />
              </Section>
            </View>
            <View style={styles.section}>
              <Icon
                name="reorder"
                type="material"
                color={colors.grey1}
                size={30}
              />
              <Section
                labelContainerStyle={{ backgroundColor: colors.background }}
                label="Description (Optional)"
                labelStyle={{ color: colors.grey2 }}
                contentStyle={{ borderColor: colors.grey2, paddingTop: 7, paddingBottom: 3 }}
              >
                <Input
                  multiline
                  // label="Description"
                  placeholder="Add Description"
                  placeholderTextColor={colors.grey2}
                  renderErrorMessage={false}
                  onChangeText={(description) => setDescription(description)}
                  value={description}
                  inputStyle={{ color: colors.grey1, fontSize: 17 }}
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                />
              </Section>
            </View>
            {/* </View> */}
            {/* <Section
              labelContainerStyle={{ backgroundColor: colors.background }}
              label="Length (min)"
              labelStyle={{ color: colors.grey2 }}
              contentStyle={{ borderColor: colors.grey2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            > */}
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
                  {/* <Text style={{ fontSize: 17,padding:3}}>Length (min):</Text> */}
                  <Input
                    // label="Length (min)"
                    // labelStyle={{ color: colors.grey2 }}
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
                    value={hours !== 0 && !isNaN(hours) ? hours.toString() : null}
                    inputStyle={{ color: colors.grey1, fontSize: 17 }}
                    renderErrorMessage={false}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
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
                    // label="Length (min)"
                    // labelStyle={{ color: colors.grey2 }}
                    placeholder="Minutes"
                    placeholderTextColor={colors.grey2}
                    renderErrorMessage={empty && length === 0}
                    errorMessage={
                      empty && length === 0
                        ? 'Enter a non-zero task length'
                        : null
                    }
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
                      minutes !== 0 && !isNaN(minutes) ? minutes.toString() : null
                    }
                    inputStyle={{ color: colors.grey1, fontSize: 17 }}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                  />
                </Section>
              </View>
            </View>
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
              {/* <Text style={{ fontSize: 17,padding:3}}>Importance:</Text> */}
              {/* <Text h1 h1Style={[styles.label, { color: colors.grey2 }]}>
                {' '}
                Importance
              </Text> */}
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
                  // animateTransitions={true}
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
              {/* <Text h1 h1Style={[styles.label, { color: colors.grey2 }]}>
                {' '}
                Due Date:
              </Text> */}
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
                // display="default"
                onChange={onChange}
                style={{ width: '100%', backgroundColor: colors.background }}
                textColor={colors.white}
                themeVariant={colorScheme}
              />
            )}
            </Section>
            </View>
            <View style={styles.section}>
              <Icon
                name='calendar-alert'
                type='material-community'
                color={colors.grey1}
                size={35}
              />
            <Section
              labelContainerStyle={{ backgroundColor: colors.background }}
              label="Due Date's Importance"
              labelStyle={{ color: colors.grey2 }}
              contentStyle={{ borderColor: colors.grey2 }}
            >
              {/* <Text h1 h1Style={[styles.label, { color: colors.grey2 }]}>
                {' '}
                Due Date&apos;s Importance:
              </Text> */}
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
                  // style={{}}
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
                name='replay'
                type='material'
                color={colors.grey1}
                size={30}
              />
            <Section
              labelContainerStyle={{ backgroundColor: colors.background }}
              label={newInfo() ? 'Edit on' : 'Repeat on'}
              labelStyle={{ color: colors.grey2 }}
              contentStyle={{ borderColor: colors.grey2 }}
            >
              {/* {newInfo() ? (
                <Text h1 h1Style={[styles.label, { color: colors.grey2 }]}>
                  {' '}
                  Edit on:
                </Text>
              ) : (
                <Text h1 h1Style={[styles.label, { color: colors.grey2 }]}>
                  {' '}
                  Repeat on:
                </Text>
              )} */}

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
                  // alignSelf: 'stretch'
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
                    fontSize: 15,
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
                borderRadius: 5
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
    // justifyContent: 'center',
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
    marginVertical: 10
  }
})
