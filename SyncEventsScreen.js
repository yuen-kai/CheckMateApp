/* eslint-disable react/prop-types */
import React from 'react'
import {
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Button,
  ListItem,
  Text,
  CheckBox
} from '@rneui/base'

export default class SyncEventsScreen extends React.Component {
  state = {
    use: [],
    ready: false
  }

  checkEvents = []
  events
  checkedEvents

  componentDidMount () {
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getData()
    })
  }

  getData = async () => {
    try {
      const eventsJson = await AsyncStorage.getItem('checkEvents')
      this.checkedEvents = eventsJson != null ? JSON.parse(eventsJson) : null
      const JsonValue = await AsyncStorage.getItem('events')
      this.events = JsonValue != null ? JSON.parse(JsonValue) : null
      const use = []
      this.events.forEach((event) => {
        use.push(false)
      })
      //   console.log(this.events)
      this.setState({ use, ready: true })
    } catch (e) {
      Alert.alert(
        'Failed to get data!',
        'Failed to get data! Please try again.'
      )
      console.log(e)
    }
  }

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

  time (t) {
    return new Date(Math.floor(new Date(t) / (60 * 1000)) * 60 * 1000)
  }

  reviewEvents (event) {
    // check if event has the same name as any events in checkEvents
    // console.log(!this.checkedEvents.some(e => e.id === event.id))
    return (
      event != null &&
      (!this.checkedEvents.some((e) => e.id === event.id) ||
        this.checkEvents.some(
          (e) => e.title === event.title && e.id !== event.id
        ) ||
        this.checkEvents.some(
          (element) =>
            this.time(element.startDate).getTime() <=
              this.time(event.startDate).getTime() &&
            this.time(element.endDate).getTime() >
              this.time(event.startDate).getTime() &&
            element.id !== event.id
        ) ||
        this.checkEvents.some(
          (element) =>
            this.time(element.startDate) < this.time(event.endDate) &&
            this.time(element.endDate) >= this.time(event.endDate) &&
            element.id !== event.id
        ) ||
        this.checkEvents.some(
          (element) =>
            this.time(element.startDate) >= this.time(event.startDate) &&
            this.time(element.endDate) <= this.time(event.endDate) &&
            element.id !== event.id
        ) ||
        this.checkEvents.some(
          (element) =>
            this.time(element.startDate) <= this.time(event.startDate) &&
            this.time(element.endDate) >= this.time(event.endDate) &&
            element.id !== event.id
        ))
    )
  }

  async handleSave () {
    const JsonValue = await AsyncStorage.getItem('setTasks')
    const setTasks = JsonValue != null ? JSON.parse(JsonValue) : null
    this.checkEvents.forEach((event) => {
      setTasks[0][new Date().getDay()].push({
        name: event.title,
        pStart: this.time(event.startDate),
        pEnd: this.time(event.endDate),
        start: this.time(event.startDate),
        end: this.time(event.endDate),
        length:
          (this.time(event.endDate).getTime() -
            this.time(event.startDate).getTime()) /
          (1000 * 60),
        description: event.notes
      })
      if (event.location !== '') {
        setTasks[0][new Date().getDay()][
          setTasks[0][new Date().getDay()].length - 1
        ].description += ' At ' + event.location + '.'
      }
    })
    setTasks.sort(function (a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
    await AsyncStorage.setItem('setTasks', JSON.stringify(setTasks))
    this.props.navigation.navigate('Home')
  }

  setUse (index) {
    const use = this.state.use
    use[index] = !use[index]
    this.setState({ use })
  }

  render () {
    if (!this.state.ready) {
      return null
    }
    return (
      <SafeAreaView style={styles.container}>
        {this.events.length === 0
          ? (
          <Text h4 style={{ alignSelf: 'center' }}>
            No Calendar Events
          </Text>
            )
          : null}
        <ScrollView contentContainerStyle={{ flex: 1 }}>
          {this.events.map((event, index) => {
            return (
              <ListItem key={index} bottomDivider>
                <CheckBox
                  checked={this.state.use[index]}
                  onPress={() => {
                    !this.state.use[index]
                      ? this.checkEvents.push(event)
                      : this.checkEvents.splice(
                        this.checkEvents.indexOf(event),
                        1
                      )
                    this.setUse(index)
                  }}
                  disabled={this.reviewEvents(event)}
                  uncheckedColor={this.reviewEvents(event) ? 'gray' : 'black'}
                />
                <ListItem.Content>
                  <ListItem.Title
                    style={
                      !this.checkedEvents.some((e) => e.id === event.id)
                        ? { color: 'gray' }
                        : { color: 'black' }
                    }
                  >
                    {event.title}
                  </ListItem.Title>
                  <ListItem.Subtitle
                    style={
                      !this.checkedEvents.some((e) => e.id === event.id)
                        ? { color: 'gray' }
                        : { color: 'black' }
                    }
                  >
                    {this.displayTime(event.startDate)} -{' '}
                    {this.displayTime(event.endDate)}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            )
          })}
          <Button
            title="Save"
            buttonStyle={{
              backgroundColor: '#6a99e6',
              alignSelf: 'flex-end',
              marginTop: 10
            }}
            onPress={() => this.handleSave()}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }
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
