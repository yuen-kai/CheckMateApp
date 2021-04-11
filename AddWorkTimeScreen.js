import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const currentDate = selectedDate || this.state.date;
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
      alert(e)
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
      alert(e)
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


    if(this.state.end.getTime()-this.state.start.getTime()<5*60*1000){
      alert('You need to have at least 5 minutes of workTime!')}
    else if(overlap==true){
      alert('This worktime overlaps with previous worktimes. To edit worktimes, you should instead go to the home screen and click on the worktime you want to edit.')
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
        alert(e)
      } 
      this.props.navigation.navigate('Home');
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