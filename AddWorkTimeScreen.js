import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,Alert, ScrollView} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon,Tooltip} from 'react-native-elements'

var workTimes = []



export default class AddWorkTimeScreen extends React.Component {
  overlap = []
  invalid = []
  days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  id = 0
  editIndex = -1
  visible
  
  state = {
    newShow:false,
    type:'start',
    start: null,
    end: null,
    ready: false,
    show: false,
    
  }

  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
			this.getData();  
		});
  }

  checkErrors(){
    this.overlap.forEach(workTime => {
      var lapover = false
      this.overlap.forEach(element => {
        if(JSON.stringify(workTime) === JSON.stringify(element)&&element.start!=null&&element.end!=null&&((workTime.start!=null&&new Date(workTime.start).getTime()>=new Date(element.start).getTime()&&new Date(workTime.start).getTime()<=new Date(element.end).getTime())
          ||(workTime.end!=null&&new Date(workTime.end).getTime()>=new Date(element.start).getTime()&&new Date(workTime.end).getTime()<=new Date(element.end).getTime())
          ||(workTime.start!=null&&workTime.end!=null&&new Date(workTime.start).getTime()<=new Date(element.start).getTime()&&new Date(workTime.end).getTime()>=new Date(element.end).getTime()))){
            lapover = true
        }
        if(lapover==false){
          this.overlap.splice(this.overlap.indexOf(workTime),1)
          this.overlap.splice(this.overlap.indexOf(element),1)
        }
      });
    });
    this.invalid.forEach(workTime => {
      if(!(workTimes.start!=null&&workTimes.end!=null&&new Date(workTime.end).getTime() - (Math.floor((new Date(workTime.start).getTime())/(60*1000)) * (60*1000))<1000*60)){
        this.invalid.splice(this.invalid.indexOf(workTime),1)
      }
    });
  }

  roundTime(time){
    return Math.floor((new Date(time).getTime())/(60*1000)) * (60*1000)
  }

  onTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    this.setState({newShow:Platform.OS === 'ios',visible: -1});
    var workTime
    if(this.state.editIndex==-1){
      if(this.state.type == 'start'){
      this.setState({start:this.roundTime(currentDate)})
      }
      else{
        this.setState({end:this.roundTime(currentDate)})
      }
      workTime = {start:this.state.start,end:this.state.end,id:this.id}
    }
    else{
      workTime = workTimes[this.state.editIndex]
      if(this.state.type == 'start'){
        workTime.start=currentDate
        
        }
        else{
          workTime.end=currentDate
        }
    }
    
   
    this.checkErrors()
    workTimes.forEach(element => {
      if(JSON.stringify(workTime) !== JSON.stringify(element)&&((workTime.start!=null&&new Date(workTime.start).getTime()>=new Date(element.start).getTime()&&new Date(workTime.start).getTime()<=new Date(element.end).getTime())
        ||(workTime.end!=null&&new Date(workTime.end).getTime()>=new Date(element.start).getTime()&&new Date(workTime.end).getTime()<=new Date(element.end).getTime())
        ||(workTime.start!=null&&workTime.end!=null&&new Date(workTime.start).getTime()<=new Date(element.start).getTime()&&new Date(workTime.end).getTime()>=new Date(element.end).getTime())))
      {
        this.overlap.push(element,workTime)
      }
    });
    
    if(workTime.start!=null&&workTime.end!=null&&new Date(workTime.end).getTime() - new Date(workTime.start).getTime()<1000*60){
      this.invalid.push(workTime)
    }

    if(workTime.start!=null&&workTime.end!=null&&this.overlap.includes(workTime) == false&&this.invalid.includes(workTime) == false){
      if(this.state.editIndex!=-1){
        workTimes.splice(workTimes.indexOf(workTime),1)
      }
      else{
        this.setState({start:null,end:null})
        this.id++
      }
      workTimes.splice(this.sortWorkTime(workTime),0,workTime)
    }
    this.setState({ready:true})
  };

  showTimepicker(index,endStart) {
    if(index==-1){
      this.setState({newShow:true})
    }
    else{
      this.setState({visible:index})
    }
    this.setState({type:endStart,editIndex:index})
  }

  getData = async () => {
    try {
      
      const jsonValue = await AsyncStorage.getItem('workTimes')
      workTimes =  jsonValue != null ? JSON.parse(jsonValue) : null;
      if(workTimes == null){
        workTimes=[]
      }
      var max=workTimes.length-1
      workTimes.forEach(element => {
        if(element.id>max){
          max=element.id
        }
      });
      this.id = max+1
      this.setState({ready:true})
    } catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
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
    
    if(this.overlap.length==0&&this.invalid.length==0){
      try {
      const jsonValue = JSON.stringify(workTimes)
      await AsyncStorage.setItem('workTimes', jsonValue)
      } catch (e) {
        Alert.alert('Error saving','There has been an error saving your work time. Please try again.')
        console.log(e)
      } 
      this.props.navigation.navigate('Home');
    }
    else{
      Alert.alert('Invalid Work Times','Some of your work times are invalid. Please adress these issues and try again.')
    }
    
  }

  handleDelete(workIndex){
    workTimes.splice(workIndex,1)
    this.checkErrors()
    this.setState({ready:true})
  }

  async usePreset(){
    const savedTimeJsonValue = await AsyncStorage.getItem('savedWorkTimes')
    var savedTime =  savedTimeJsonValue != null ? JSON.parse(savedTimeJsonValue) : null;
    if(savedTime != null&&savedTime[new Date().getDay()]!=null){
      workTimes = savedTime[new Date().getDay()]
      this.setState({ready:true})
    }
  }

  async presetTimes(){
    try {
      const savedTimeJsonValue = await AsyncStorage.getItem('savedWorkTimes')
      var savedTime =  savedTimeJsonValue != null ? JSON.parse(savedTimeJsonValue) : null;
      if(savedTime == null){
        savedTime = new Array(7)
      }
      savedTime[new Date().getDay()]=[...workTimes]
      const jsonValue = JSON.stringify(savedTime)
      await AsyncStorage.setItem('savedWorkTimes', jsonValue)
    } catch (e) {
      Alert.alert('Error saving preset!','Failed to save preset work times! Please try again.')
      console.log(e)
    }
  }
  
  show(i){
    if(this.state.visible==i){
      return true
    }
    else{
      return Platform.OS === 'ios'
    }
  }

  render(){
    if(!this.state.ready){
      return null
    }
    return(
      
    <View style={styles.container}>
      <ScrollView style={{padding:10}}>
        <View style={{flexDirection:'row',justifyContent:'flex-end',alignItems: 'center'}}>
          <TouchableOpacity style={styles.button} onPress={() => this.usePreset()}>
            <Text style={{ fontSize: 18, padding:4, color: '#fff' }}>Use Preset</Text>
          </TouchableOpacity>
          <Tooltip height={115} width={250} popover={<Text>Use your preset work times for today. Warning: This will overide your current work times! To set a preset for every {this.days[new Date().getDay()]}, click the "set preset" button at the bottom of the page.</Text>}>
            <Icon size={32} name="info" type='feather'></Icon>
          </Tooltip>
        </View>
        {
          workTimes.map((workTime, i) => {
            return(
            <View key={workTime.id} style={{flexDirection: 'column'}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity style={styles.button} onPress={() => this.showTimepicker(i,'start')}>
                  <Text style={{ fontSize: 18, padding:4, color: '#fff' }}>{this.displayTime(workTime.start)}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 25}}>-</Text>
                <TouchableOpacity style={styles.button} onPress={() => this.showTimepicker(i,'end')}>
                  <Text style={{ fontSize: 18, padding:4, color: '#fff' }}>{this.displayTime(workTime.end)}</Text>
                </TouchableOpacity>
                {/* start picker */}
                {this.show(i) && (
                <DateTimePicker
                  value={this.state.type=='start'?new Date(workTime.start):new Date(workTime.end)}
                  mode={'time'}
                  display="default"
                  onChange={this.onTimeChange}
                />)}
                <Icon size={35} name="x-circle" type='feather' onPress={() => this.handleDelete(i)}/>
              </View>
              {this.overlap.includes(workTime)==true?<Text style={{ fontSize: 15, color: 'red' }}>This overlaps with other work times!</Text>
                :this.invalid.includes(workTime)==true?<Text style={{ fontSize: 15, color: 'red' }}>You need at least 1 minute of work time!</Text>
                :null
              }
            </View>
            )
          })
        }  
        <View style={{flexDirection: 'column'}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity style={styles.button} onPress={() => this.showTimepicker(-1,'start')}>
              <Text style={{ fontSize: 18, padding:4, color: '#fff' }}>{this.state.start!=null?this.displayTime(this.state.start):"Start"}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 25}}>-</Text>
            <TouchableOpacity style={styles.button} onPress={() => this.showTimepicker(-1,'end')}>
              <Text style={{ fontSize: 18, padding:4, color: '#fff' }}>{this.state.end!=null?this.displayTime(this.state.end):'End'}</Text>
            </TouchableOpacity>
            {/* start picker */}
            {this.state.newShow && (
            <DateTimePicker
              value={this.state.type=='start'&&this.state.start==null?new Date():this.state.type=='start'?new Date(this.state.start):this.state.type=='end'&&this.state.end==null?new Date():this.state.end}
              mode={'time'}
              display="default"
              onChange={this.onTimeChange}
            />)}
          </View>
          {this.overlap.findIndex((element)=>JSON.stringify({start:this.state.start,end:this.state.end,id:this.id}) == JSON.stringify(element))!=-1?<Text style={{ fontSize: 15, color: 'red' }}>This overlaps with other work times!</Text>
            :this.invalid.findIndex((element)=>JSON.stringify({start:this.state.start,end:this.state.end,id:this.id}) == JSON.stringify(element))!=-1?<Text style={{ fontSize: 15, color: 'red' }}>You need at least 1 minute of work time!</Text>
            :null
          }
        </View>
        
          <View style={{padding:8,flexDirection:'row',justifyContent: 'center',alignItems: 'center'}}>
            <TouchableOpacity style={[styles.button,{margin:3}]} onPress={() => this.presetTimes()}>
              <Text style={{ fontSize: 20, color: '#fff' }}>Set Preset</Text>
            </TouchableOpacity>
            <Tooltip height={70} width={160} popover={<Text>Set current work times as preset work times for every {this.days[new Date().getDay()]}.</Text>}>
              <Icon size={25} name="info" type='feather'></Icon>
            </Tooltip>
            <TouchableOpacity
              onPress={() => this.handleSave()}
              style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Save WorkTime</Text>
            </TouchableOpacity>  
          </View>
        </ScrollView>
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
    backgroundColor: "#3C00BB",
    padding: 6,
    margin: 10,
    borderRadius: 5,
  }
});