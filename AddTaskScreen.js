/* eslint-disable react/prop-types */
import React from 'react'
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

export default class AddTaskScreen extends React.Component {
  editName
  selectedTask
  edit = false
  days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]

  state = {
    daysUsed: [false, false, false, false, false, false, false],
    date: new Date().setHours(24, 0, 0, 0),
    mode: 'date',
    show: false,
    ready: false,
    name: '',
    importance: 5,
    dueImportance: 3,
    length: 0,
    sortValue: 0,
    start: new Date(),
    end: new Date(),
    weekly: false,
    repeating: false,
    editMode: true,
    overridable: false,
    description: '',
    empty: false,
    usedName: false
  }

  // Get data
  componentDidMount () {
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getData()
    })
  }

  getData = async () => {
    const change = [...this.state.daysUsed]
    change.splice(new Date().getDay(), 1, true)
    this.setState({ daysUsed: change })
    try {
      const jsonValue = await AsyncStorage.getItem('tasks')
      savedTasks = jsonValue != null ? JSON.parse(jsonValue) : null
      this.editInfo()
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

  editInfo = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('editName')
      this.editName = jsonValue != null ? JSON.parse(jsonValue) : null
      if (this.editName != null) {
        const change = [...this.state.daysUsed]
        this.selectedTask =
          savedTasks[0][new Date().getDay()][
            savedTasks[0][new Date().getDay()].findIndex(
              (task) => task.name === this.editName
            )
          ]
        this.edit = true
        this.setState({
          date: new Date(new Date(this.selectedTask.date).getTime()),
          name: this.selectedTask.name,
          importance: this.selectedTask.importance,
          length: this.selectedTask.length,
          dueImportance: this.selectedTask.dueImportance,
          repeating: this.selectedTask.repeating,
          overridable: this.selectedTask.overridable,
          description: this.selectedTask.description
        })
        // await AsyncStorage.removeItem('editName')
        for (let i = 0; i <= this.state.daysUsed.length - 1; i++) {
          if (
            savedTasks[0][i].findIndex(
              (task) => task.name === this.editName
            ) !== -1
          ) {
            change.splice(i, 1, true)
          }
        }
        await this.setState({ daysUsed: change })
        this.isRepeating()
        if (
          savedTasks[1][new Date().getDay()].findIndex(
            (task) => task.name === this.editName
          ) !== -1
        ) {
          this.setState({ weekly: true })
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
    this.setState({ ready: true })
  }

  newInfo () {
    const task = savedTasks[0][new Date().getDay()].find(
      (task) => task.name === this.editName
    )
    // check if state props are the same as task props
    return (
      task !== undefined &&
      this.edit &&
      !(
        this.state.name === task.name &&
        this.state.importance === task.importance &&
        this.state.length === task.length &&
        this.state.dueImportance === task.dueImportance &&
        this.state.overridable === task.overridable &&
        new Date(this.state.date).getTime() === new Date(task.date).getTime()
      )
    )
  }

  // Date picker
  showDatepicker () {
    this.showMode('date')
  }

  showTimepicker () {
    this.showMode('time')
  }

  showMode (currentMode) {
    this.setState({ show: true })
    this.setState({ mode: currentMode })
  }

  onChange = (event, selectedDate) => {
    const currentDate = selectedDate || this.state.date
    this.setState({ show: false })
    this.setState({ date: currentDate })
  }

  // Display Time/Date
  displayTime (date) {
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

  displayDate (date) {
    const month = new Date(date).getMonth() + 1
    const day = new Date(date).getDate()
    return month + '/' + day
  }

  // Update days used
  async changeDay (i) {
    const change = [...this.state.daysUsed]
    change.splice(i, 1, !this.state.daysUsed[i])
    await this.setState({ daysUsed: change })
    this.isRepeating()
  }

  // Saving/Processing
  handleSave = async () => {
    let sameName = false
    this.isRepeating()
    let d
    // Set parameters
    await this.setState({
      sortValue:
        parseInt(
          new Date(this.state.date).getTime() / (1000 * 60 * 60) +
            (6 - this.state.dueImportance) * 2 * (11 - this.state.importance)
        ) +
        parseInt(this.state.length) / 10
    })
    // ((((this.state.importance*8)/100)*(this.state.length))/((6-this.state.dueImportance)*30))*24*60*60*1000
    if (this.state.daysUsed[new Date().getDay()]) {
      d = new Date().setHours(0, 0, 0, 0)
    } else {
      if (this.state.daysUsed.indexOf(true) - new Date().getDay() > 0) {
        d = new Date().setDate(
          new Date().getDate() +
            this.state.daysUsed.indexOf(true) -
            new Date().getDay()
        )
      } else {
        d = new Date().setDate(
          new Date().getDate() +
            this.state.daysUsed.indexOf(true) -
            new Date().getDay() +
            7
        )
      }
      d = new Date(d).setHours(0, 0, 0, 0)
    }
    const dueIncrease =
      new Date(this.state.date).getTime() - new Date(d).getTime()
    this.selectedTask = {
      name: this.state.name,
      sortValue: this.state.sortValue,
      length: this.state.length,
      date: this.state.date,
      start: this.state.start,
      end: this.state.end,
      importance: this.state.importance,
      dueImportance: this.state.dueImportance,
      repeating: this.state.repeating,
      dueIncrease,
      overridable: this.state.overridable,
      description: this.state.description
    }
    // console.log(this.selectedTask.length)
    // Same name
    sameName = await this.sameName()

    // Check if valid
    if (
      this.state.name === '' ||
      this.state.importance === 0 ||
      this.state.length === 0
    ) {
      this.setState({ empty: true })
      Alert.alert('Invalid Task', 'Not all fields have been filled out!')
    } else if (sameName === true) {
      this.setState({ usedName: true })
      Alert.alert('Name Used', 'Name already used. Please select a new name.')
    } else {
      // Put in task for all the days used
      for (let i = 0; i <= this.state.daysUsed.length - 1; i++) {
        if (this.state.daysUsed[i] === true) {
          if (this.edit === true) {
            savedTasks[0][i].splice(
              savedTasks[0][i].findIndex((task) => task.name === this.editName),
              1
            )
          }
          savedTasks[0][i].push(this.selectedTask)

          if (this.state.weekly === true) {
            if (this.edit === true) {
              savedTasks[1][i].splice(
                savedTasks[1][i].findIndex(
                  (task) => task.name === this.editName
                ),
                1
              )
            }

            savedTasks[1][i].push(this.selectedTask)
          }
        } else if (!this.newInfo()) {
          if (
            savedTasks[0][i].some(
              (task) => task.name === this.selectedTask.name
            )
          ) {
            savedTasks[0][i].splice(
              savedTasks[0][i].findIndex(
                (task) => task.name === this.selectedTask.name
              ),
              1
            )
          }
          if (
            this.state.weekly === true &&
            savedTasks[1][i].some(
              (task) => task.name === this.selectedTask.name
            )
          ) {
            savedTasks[1][i].splice(
              savedTasks[1][i].findIndex(
                (task) => task.name === this.selectedTask.name
              ),
              1
            )
          }
        }
      }
      this.setState({ empty: false, usedName: false })
      // save data
      try {
        const jsonValue = JSON.stringify(savedTasks)
        await AsyncStorage.setItem('tasks', jsonValue)
      } catch (e) {
        console.log(e)
      }

      // Go back to home page
      this.props.navigation.navigate('Home')
    }
  }

  async sameName () {
    const savedTaskJsonValue = await AsyncStorage.getItem('setTasks')
    const workTimes =
      savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) : null
    for (let i = 0; i < this.state.daysUsed.length; i++) {
      if (this.state.daysUsed[i]) {
        if (
          (this.edit === true && this.state.name !== this.editName) ||
          this.edit === false
        ) {
          if (
            workTimes[0][i].some(
              (element) => element.name === this.state.name
            ) ||
            (this.state.weekly &&
              workTimes[1][i].some(
                (element) => element.name === this.state.name
              )) ||
            savedTasks[0][i].some(
              (element) => element.name === this.state.name
            ) ||
            (this.state.weekly &&
              savedTasks[1][i].some(
                (element) => element.name === this.state.name
              ))
          ) {
            this.setState({ usedName: true })
            return true
          }
        }
      }
    }

    this.setState({ usedName: false })
    return false
  }

  // Set repeating
  isRepeating () {
    let count = 0

    this.state.daysUsed.forEach((element) => {
      if (element) {
        count++
      }
    })

    if (this.setState.weekly || count >= 2) {
      this.setState({ repeating: true, ready: true })
    } else {
      this.setState({ repeating: false, ready: true })
    }
  }

  render () {
    if (!this.state.ready) {
      return null
    }
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flex: 1 }}>
          <View style={styles.section}>
            {/* <Text style={{ fontSize: 17, padding:3}}>Name:</Text> */}
            <Input
              label="Name"
              placeholder="Add Name"
              renderErrorMessage={this.state.empty || this.state.usedName}
              errorMessage={
                this.state.empty && this.state.name === ''
                  ? 'Please enter a name'
                  : this.state.usedName === true
                    ? 'Another task or event already has this name'
                    : null
              }
              onChangeText={(name) => {
                this.setState({ name })
                this.sameName()
              }}
              value={this.state.name}
            />
          </View>
          <View style={styles.section}>
            <Input
              multiline
              label="Description"
              placeholder="Add Description"
              renderErrorMessage={false}
              onChangeText={(description) => this.setState({ description })}
              value={this.state.description}
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
                value={this.state.importance}
                // animateTransitions={true}
                allowTouchTrack={true}
                onValueChange={(importance) => this.setState({ importance })}
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
                      {this.state.importance}
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
              renderErrorMessage={this.state.empty && this.state.length === 0}
              errorMessage={
                this.state.empty && this.state.length === 0
                  ? 'Enter a non-zero task length'
                  : null
              }
              keyboardType="numeric"
              onChangeText={(length) => this.setState({ length })}
              value={
                this.state.length !== 0 ? this.state.length.toString() : null
              }
            />
          </View>
          <View style={styles.section}>
            <Text h1 h1Style={styles.label}>
              {' '}
              Due Date:
            </Text>
            <View
              style={{ flexDirection: 'row', marginLeft: 5, marginTop: 10 }}
            >
              <View style={{ padding: 3 }}>
                <Button
                  title={this.displayDate(this.state.date)}
                  buttonStyle={{ backgroundColor: '#6a99e6' }}
                  onPress={() => this.showDatepicker()}
                />
              </View>
              <View style={{ padding: 3 }}>
                <Button
                  title={this.displayTime(this.state.date)}
                  buttonStyle={{ backgroundColor: '#6a99e6' }}
                  onPress={() => this.showTimepicker()}
                />
              </View>
            </View>
          </View>
          {this.state.show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={new Date(this.state.date)}
              mode={this.state.mode}
              // display="default"
              onChange={this.onChange}
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
                value={this.state.dueImportance}
                onValueChange={(dueImportance) =>
                  this.setState({ dueImportance })
                }
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
                      {this.state.dueImportance}
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
            {this.newInfo()
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
            {/* {this.edit?
              <Switch
                style={{height:10}}
                value={this.state.editMode}
                onValueChange={(value) => this.setState({editMode: value})}
              />
            :null} */}
          </View>
          <CheckBox
            containerStyle={{
              backgroundColor: 'rgba(0,0,0,0)',
              borderWidth: 0
            }}
            title="Weekly"
            checked={this.state.weekly}
            onPress={() => this.setState({ weekly: !this.state.weekly })}
          />

          <View
            style={{
              padding: 8,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {this.state.daysUsed.map((day, i) => {
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
                  title={this.days[i].slice(0, 1)}
                  onPress={() => this.changeDay(i)}
                />
              )
            })}
          </View>
          {this.state.daysUsed.includes(true) === false
            ? (
            <Text style={{ fontSize: 15, color: 'red', alignSelf: 'center' }}>
              Nothing is selected!
            </Text>
              )
            : null}
          {this.state.repeating || this.state.weekly
            ? <View style={{ flexDirection: 'row' }}>
                <View style={{ flexGrow: 1 }}>
                  <CheckBox
                    containerStyle={{
                      backgroundColor: 'rgba(0,0,0,0)',
                      borderWidth: 0
                    }}
                    title="Override"
                    checked={this.state.overridable}
                    onPress={() =>
                      this.setState({ overridable: !this.state.overridable })
                    }
                  />
                </View>
                <View
                  style={{ alignItems: 'flex-end', justifyContent: 'center' }}
                >
                  <Tooltip
                    popover={
                      <Text>
                        Should the new repeated version of the task override the
                        old one? If not, the versions will be combined into one.
                      </Text>
                    }
                    height={120}
                  >
                    {/* <Icon name='InfoCircleOutline' type='antdesign'/> */}
                    <Icon name="question-circle" type="font-awesome-5" />
                  </Tooltip>
                </View>
              </View>
            : null}
          <Button
            title="Save"
            buttonStyle={{ backgroundColor: '#6a99e6', alignSelf: 'flex-end' }}
            onPress={() => this.handleSave()}
          />
        </View>
      </ScrollView>
    )
  }
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
