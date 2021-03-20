import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

var workTimes = []



export default class AddWorkTimeScreen extends React.Component {
  state = {
    start: new Date(),
    end: new Date(),
    ready: false,
    startShow: false,
    endShow: false,
    mode: 'date',
    type: 'start'
  }

  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
			this.getData();  
		});
  }

  onStartChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    this.setState({startShow: Platform.OS === 'ios'});
    this.setState({start:currentDate});
  };

  onEndChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    this.setState({endShow: Platform.OS === 'ios'});
    this.setState({end:currentDate});
  };

  showMode(currentMode,type) {
    if(type=='start'){
      this.setState({startShow:true});
    }
    else{
      this.setState({endShow:true});
    }
    this.setState({mode:currentMode});
  };

  showDatepicker(type) {
    this.showMode('date',type);
  };

  showTimepicker(type) {
    this.showMode('time',type);
  };

  getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('workTimes')
      if(jsonValue != null){
        
        workTimes = JSON.parse(jsonValue)
      }
      this.setState({ready:true})
    } catch(e) {
      alert(e)
    }
    
  }

  handleSave = async () => {
    if(Date.parse(this.state.end)-Date.parse(this.state.start)<5*60*1000){
      alert('You need to have at least 5 minutes of workTime!')}
    else{
      try{
        var workTime = {start:this.state.start,end:this.state.end}
        // add new workTime to list of existing workTimes
        workTimes.push(workTime)
        //save data
        try {
          const jsonValue = JSON.stringify(workTimes)
          await AsyncStorage.setItem('workTimes', jsonValue)
        } catch (e) {
          alert(e)
        } 
        this.props.navigation.navigate('Home');
      }
      catch (e) {
        alert(e)
      }
    } 
  };

  render(){
    if(!this.state.ready){
      return null
    }
    return(
    <View style={styles.container}>
      <Button onPress={() => this.showDatepicker('start')} title="Select Start Day" />
      <Button onPress={() => this.showTimepicker('start')} title="Select Start Time" />
      <Button onPress={() => this.showDatepicker('end')} title="Select End Day" />
      <Button onPress={() => this.showTimepicker('end')} title="Select End Time" />

      {/* start picker */}
      {this.state.startShow && (
      <DateTimePicker
        // testID="dateTimePicker"
        value={this.state.start}
        mode={this.state.mode}
        // is24Hour={true}
        display="default"
        onChange={this.onStartChange}
      />)}

      {/* end picker */}
      {this.state.endShow && (
      <DateTimePicker
        // testID="dateTimePicker"
        value={this.state.end}
        mode={this.state.mode}
        // is24Hour={true}
        display="default"
        onChange={this.onEndChange}
      />)}

        <TouchableOpacity
          onPress={() => this.handleSave()}
          style={styles.button}>
         <Text style={{ fontSize: 20, color: '#fff' }}>Save WorkTime</Text>
        </TouchableOpacity>
    </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: "blue",
    padding: 20,
    borderRadius: 5,
    position: 'absolute',
    top:0,
    right:0,
  }
});