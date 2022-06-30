/* eslint-disable multiline-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, ScrollView, Alert } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Slider,
  Input,
  CheckBox,
  Avatar,
  Tooltip,
  Icon,
  Text,
  Button
} from 'react-native-elements'

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
  const [weekly, setWeekly] = useState(false)
  const [repeating, setRepeating] = useState(false)
  const [overridable, setOverridable] = useState(false)
  const [description, setDescription] = useState('')
  const [empty, setEmpty] = useState(false)
  const [edit, setEdit] = useState(false)
  const [same, setSame] = useState(false)

  // Get data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // console.log('hello')
      getData()
    })
    // console.log('hello')
    // getData()

    return () => {
      unsubscribe
    }
  }, [])

  const getData = async () => {
    // console.log('hello')
    const change = [...daysUsed]
    change.splice(new Date().getDay(), 1, true)
    setDaysUsed(change)
    try {
      const jsonValue = await AsyncStorage.getItem('tasks')
      savedTasks = jsonValue != null ? JSON.parse(jsonValue) : null
      await editInfo()
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
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
        setDueImportance(selectedTask.dueImportance)
        setRepeating(selectedTask.repeating)
        setOverridable(selectedTask.overridable)
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
    setReady(true)
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
        overridable === task.overridable &&
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
    isRepeating()
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
      date,
      start: new Date(),
      end: new Date(),
      importance,
      dueImportance,
      repeating,
      dueIncrease,
      overridable,
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
      setRepeating(true)
      setReady(true)
    } else {
      setRepeating(false)
      setReady(true)
    }
  }

  if (!ready) {
    return null
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.section}>
          {/* <Text style={{ fontSize: 17, padding:3}}>Name:</Text> */}
          <Input
            multiline
            label="Name"
            placeholder="Add Name"
            renderErrorMessage={(empty && name === '') || same}
            errorMessage={
              empty && name === ''
                ? 'Please enter a name'
                : same
                  ? 'Another task or event already has this name'
                  : null
            }
            onChangeText={async (name) => {
              setName(name)
              await sameName()
              // console.log(same)
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
            onChangeText={(description) => setDescription(description)}
            value={description}
          />
        </View>
        <View style={styles.section}>
          {/* <Text style={{ fontSize: 17,padding:3}}>Importance:</Text> */}
          <Text h1 h1Style={styles.label}>
            {' '}
            Importance
          </Text>
          <View style={{ marginTop: 10, marginLeft: 7 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}
            >
              <Text style={{ fontSize: 13 }}>Least</Text>
              <Text style={{ fontSize: 13 }}>Most</Text>
            </View>
            <Slider
              thumbStyle={{ width: 25, height: 25 }}
              trackStyle={{ width: '100%' }}
              value={importance}
              // animateTransitions={true}
              allowTouchTrack={true}
              onValueChange={(importance) => setImportance(importance)}
              minimumValue={1}
              maximumValue={10}
              thumbTintColor="#6a99e6"
              thumbProps={{
                children: (
                  <Text
                    style={{
                      fontSize: 15,
                      padding: 3,
                      alignSelf: 'center',
                      color: '#fff'
                    }}
                  >
                    {importance}
                  </Text>
                )
              }}
              step={1}
            />
          </View>
        </View>
        <View style={styles.section}>
          {/* <Text style={{ fontSize: 17,padding:3}}>Length (min):</Text> */}
          <Input
            label="Length (min)"
            placeholder="Add Length"
            renderErrorMessage={empty && length === 0}
            errorMessage={
              empty && length === 0 ? 'Enter a non-zero task length' : null
            }
            keyboardType="numeric"
            onChangeText={(length) => setLength(length)}
            value={length !== 0 ? length.toString() : null}
          />
        </View>
        <View style={styles.section}>
          <Text h1 h1Style={styles.label}>
            {' '}
            Due Date:
          </Text>
          <View style={{ flexDirection: 'row', marginLeft: 5, marginTop: 10 }}>
            <View style={{ padding: 3 }}>
              <Button
                title={displayDate(date)}
                buttonStyle={{ backgroundColor: '#6a99e6' }}
                onPress={() => showDatepicker()}
              />
            </View>
            <View style={{ padding: 3 }}>
              <Button
                title={displayTime(date)}
                buttonStyle={{ backgroundColor: '#6a99e6' }}
                onPress={() => showTimepicker()}
              />
            </View>
          </View>
        </View>
        {show && (
          <DateTimePicker
            testID="dateTimePicker"
            value={new Date(date)}
            mode={mode}
            // display="default"
            onChange={onChange}
            style={{ width: '100%' }}
          />
        )}
        <View style={styles.section}>
          <Text h1 h1Style={styles.label}>
            {' '}
            Due Date&apos;s Importance:
          </Text>
          <View style={{ marginTop: 10, marginLeft: 7 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}
            >
              <Text style={{ fontSize: 13 }}>Least</Text>
              <Text style={{ fontSize: 13 }}>Most</Text>
            </View>
            <Slider
              // style={{}}
              thumbStyle={{ width: 25, height: 25 }}
              trackStyle={{ width: '100%' }}
              value={dueImportance}
              onValueChange={(dueImportance) => setDueImportance(dueImportance)}
              minimumValue={1}
              maximumValue={5}
              allowTouchTrack={true}
              thumbTintColor="#6a99e6"
              thumbProps={{
                children: (
                  <Text
                    style={{
                      fontSize: 15,
                      padding: 3,
                      alignSelf: 'center',
                      color: '#fff'
                    }}
                  >
                    {dueImportance}
                  </Text>
                )
              }}
              step={1}
            />
          </View>
        </View>
        <View
          style={[
            styles.section,
            { flexDirection: 'row', alignItems: 'center' }
          ]}
        >
          {newInfo()
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
        {repeating || weekly ? (
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flexGrow: 1 }}>
              <CheckBox
                containerStyle={{
                  backgroundColor: 'rgba(0,0,0,0)',
                  borderWidth: 0
                }}
                title="Override"
                checked={overridable}
                onPress={() => setOverridable(!overridable)}
              />
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Tooltip
                popover={
                  <Text>
                    Should the new repeated version of the task override the old
                    one? If not, the versions will be combined into one.
                  </Text>
                }
                height={120}
              >
                {/* <Icon name='InfoCircleOutline' type='antdesign'/> */}
                <Icon name="question-circle" type="font-awesome-5" />
              </Tooltip>
            </View>
          </View>
        ) : null}
        <Button
          title="Save"
          buttonStyle={{ backgroundColor: '#6a99e6', alignSelf: 'flex-end' }}
          onPress={() => handleSave()}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    // flex: 4,
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
  section: {
    // backgroundColor:'blue',
    flexDirection: 'column',
    // justifyContent: 'space-between',
    // alignItems: 'center',
    margin: '2%'
  },
  label: {
    fontSize: 16,
    color: '#8a939c'
  }
})
