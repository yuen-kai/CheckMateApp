import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,Alert} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon} from 'react-native-elements'

var workTimes = []



export default class AddWorkTimeScreen extends React.Component {
  edit = false
  workIndex
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
      workTimes =  jsonValue != null ? JSON.parse(jsonValue) : null;
      if(workTimes == null){
        workTimes=[]
      }
      this.editInfo()
      this.setState({ready:true})
    } catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
    
  }

  editInfo = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('workIndex')
      this.workIndex =  jsonValue != null ? JSON.parse(jsonValue) : null;
      if(this.workIndex != null){
        var selectedWork = workTimes[this.workIndex]
        this.edit = true
        this.setState({start:new Date(selectedWork.start),end:new Date(selectedWork.end)})
        await AsyncStorage.removeItem('workIndex')
      }
    } catch(e) {
      Alert.alert('Failed to get edit info!','Failed to get edit info! Please try again.')
      console.log(e)
    }
 }
 
  sortWorkTime(workTime){
    for (var i=workTimes.length-1; i>=0; i--)
    {
      if (new Date(workTimes[i].start).getTime()<=new Date(workTime.start).getTime())
      {
        return i+1
      }
    }
    return 0
  }
  
  displayTime(date){
    var hours = new Date(date).getHours()
    var minutes = new Date(date).getMinutes()
    var amPm = 'am'
    if(hours>=12){
      amPm='pm'
    }
    if(hours==0){
      hours=12
    }
    if(hours>12){
      hours -= 12
    }
    if(minutes<10){
      return hours+':'+'0'+minutes+amPm
    }
    return hours+':'+minutes+' '+amPm
  }
  
  handleSave = async () => {
    var overlap = false
    var workTime = {start:this.state.start,end:this.state.end}
    
    if(this.edit==false){
      workTimes.forEach(element => {
        if(new Date(element.start).getTime()>=new Date(workTime.start).getTime()&&new Date(element.start).getTime()<=new Date(workTime.end).getTime()){
          overlap = true
        }
        if(new Date(element.end).getTime()>=new Date(workTime.start).getTime()&&new Date(element.end).getTime()<=new Date(workTime.end).getTime()){
          overlap = true
        }
      });
    }


    if(this.state.end.getTime()-this.state.start.getTime()==0){
      Alert.alert('Invalid Work Time','You need to have at least 1 minutes of work times!')}
    else if(overlap==true){
      Alert.alert('Overlapping Work Times','This work time overlaps with previous work times. To edit worktimes, you should instead go to the home screen and click on the work time you want to edit.')
    }
    else{
      
      // add new workTime to list of existing workTimes
      if(this.edit==true){
        workTimes.splice(this.workIndex,1)
      }
      workTimes.splice(this.sortWorkTime(workTime),0,workTime)
      //save data
      try {
        const jsonValue = JSON.stringify(workTimes)
        await AsyncStorage.setItem('workTimes', jsonValue)
      } catch (e) {
        Alert.alert('Error saving','There has been an error saving your work time. Please try again.')
        console.log(e)
      } 
      this.props.navigation.navigate('Home');
    }
  };

  async handleDelete(){
    workTimes.splice(this.workIndex,1)
    try {
      const jsonValue = JSON.stringify(workTimes)
      await AsyncStorage.setItem('workTimes', jsonValue)
    } catch (e) {
      Alert.alert('Error deleting','There has been an error deleting your work time. Please try again.')
      console.log(e)
    } 
    this.props.navigation.navigate('Home');
  }

  render(){
    if(!this.state.ready){
      return null
    }
    return(
      
    <View style={styles.container}>
      <View style={{alignItems: 'center',}}>
        <Text style={{ fontSize: 20, padding:4}}>{this.displayTime(this.state.start)}</Text>
        <View style={{flexDirection: 'row',justifyContent: 'space-around'}}>
          <View style={{padding:2}}>
          <TouchableOpacity style={styles.button} onPress={() => this.showDatepicker('start')}>
            <Text style={{ fontSize: 18, color: '#fff' }}>Select Start Day</Text>
          </TouchableOpacity> 
          </View>
          <View style={{padding:2}}>
          <TouchableOpacity style={styles.button} onPress={() => this.showTimepicker('start')}>
            <Text style={{ fontSize: 18, color: '#fff' }}>Select Start Time</Text>
          </TouchableOpacity>
          </View>
        </View>
        <Text style={{ fontSize: 20,padding:4}}>{this.displayTime(this.state.end)}</Text>
        <View style={{flexDirection: 'row',alignItems: 'space-around'}}>
          <View style={{padding:2}}>
          <TouchableOpacity style={styles.button} onPress={() => this.showDatepicker('end')}>
            <Text style={{ fontSize: 18, color: '#fff' }}>Select End Day</Text>
          </TouchableOpacity> 
          </View>
          <View style={{padding:2}}>
          <TouchableOpacity style={styles.button} onPress={() => this.showTimepicker('end')}>
            <Text style={{ fontSize: 18, color: '#fff' }}>Select End Time</Text>
          </TouchableOpacity>
          </View>
        </View>
        {/* start picker */}
        {this.state.startShow && (
        <DateTimePicker
          minimumDate={new Date()}
          maximumDate={new Date(Date.now()+24*60*60*1000)}
          value={this.state.start}
          mode={this.state.mode}
          display="default"
          onChange={this.onStartChange}
        />)}

        {/* end picker */}
        {this.state.endShow && (
        <DateTimePicker
        minimumDate={new Date(this.state.start)}
          maximumDate={new Date(Date.now()+24*60*60*1000)}
          value={this.state.end}
          mode={this.state.mode}
          display="default"
          onChange={this.onEndChange}
        />)}
        <View style={{padding:8}}>
          <TouchableOpacity
            onPress={() => this.handleSave()}
            style={styles.button}>
          <Text style={{ fontSize: 20, color: '#fff' }}>Save WorkTime</Text>
          </TouchableOpacity>  
        </View>    
      </View>          
    {this.edit==true? <View style={{alignSelf: 'center', postition: 'absolute',bottom:0,right:0,padding:5}}><Icon size={40} name="trash-2" type='feather'onPress={() => this.handleDelete()}/></View>: null}

    </View>      

    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: "blue",
    padding: 5,
    borderRadius: 5,
  }
});