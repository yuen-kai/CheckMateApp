import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,Alert, ScrollView} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon,Tooltip,Avatar,CheckBox} from 'react-native-elements'
import ThemedListItem from 'react-native-elements/dist/list/ListItem';

var workTimes = []



export default class AddWorkTimeScreen extends React.Component {
  overlap = []
  invalid = []
  days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
  id = 0
  editIndex = -1
  visible
  
  state = {
    newShow:false,
    daysUsed:[false,false,false,false,false,false,false],
    type:'start',
    start: null,
    end: null,
    ready: false,
    show: false,
    weekly:false
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
        if(JSON.stringify(workTime) !== JSON.stringify(element)&&element.start!=null&&element.end!=null&&((workTime.start!=null&&this.roundTime(workTime.start)>=this.roundTime(element.start)&&this.roundTime(workTime.start)<=this.roundTime(element.end))
          ||(workTime.end!=null&&this.roundTime(workTime.end)>=this.roundTime(element.start)&&this.roundTime(workTime.end)<=this.roundTime(element.end))
          ||(workTime.start!=null&&workTime.end!=null&&this.roundTime(workTime.start)<=this.roundTime(element.start)&&this.roundTime(workTime.end)>=this.roundTime(element.end)))){
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
    return (Math.floor((new Date(time).getTime())/(60*1000)) * (60*1000))
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
      if(JSON.stringify(workTime)!== JSON.stringify(element)&&((workTime.start!=null&&this.roundTime(workTime.start)>=this.roundTime(element.start)&&this.roundTime(workTime.start)<=this.roundTime(element.end))
      ||(workTime.end!=null&&this.roundTime(workTime.end)>=this.roundTime(element.start)&&this.roundTime(workTime.end)<=this.roundTime(element.end))
      ||(workTime.start!=null&&workTime.end!=null&&this.roundTime(workTime.start)<=this.roundTime(element.start)&&this.roundTime(workTime.end)>=this.roundTime(element.end)))){
        this.overlap.push(element,workTime)
      }
    });
    if(workTime.start!=null&&workTime.end!=null&&this.roundTime(workTime.end) - this.roundTime(workTime.start)<=0){
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
    let change = [...this.state.daysUsed]
    change.splice(new Date().getDay(), 1,true)
    this.setState({daysUsed:change})
    try {
      const jsonValue = await AsyncStorage.getItem('savedWorkTimes')
      var timesWork =  JSON.parse(jsonValue);
      workTimes = timesWork[0][new Date().getDay()]
      console.log(workTimes)
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

  handleDelete(workIndex){    
    this.overlap.splice(this.overlap.indexOf(workTimes[workIndex]),1)
    this.invalid.splice(this.invalid.indexOf(workTimes[workIndex]),1)
    workTimes.splice(workIndex,1)
    
    this.checkErrors()
    this.setState({ready:true})
  }

  async handleSave(){
    if(this.overlap.length==0&&this.invalid.length==0){
      try {
        const savedTimeJsonValue = await AsyncStorage.getItem('savedWorkTimes')
        var savedTime =  savedTimeJsonValue != null ? JSON.parse(savedTimeJsonValue) : null;
        
        for(var i=0;i<=this.state.daysUsed.length-1;i++){
          if(this.state.daysUsed[i]==true){
            savedTime[0][i]=[...workTimes]
            if(this.state.weekly==true){
              savedTime[1][i]=[...workTimes]
            }
          }
        };
        const jsonValue = JSON.stringify(savedTime)
        
        await AsyncStorage.setItem('savedWorkTimes', jsonValue)
      }catch (e) {
        Alert.alert('Error saving','There has been an error saving your work time. Please try again.')
        console.log(e)
      } 
      this.props.navigation.navigate('Home');
    }
    else{
      Alert.alert('Invalid Work Times','Some of your work times are invalid. Please adress these issues and try again.')
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

  changeDay(i){
    let change = [...this.state.daysUsed]
    change.splice(i, 1,!this.state.daysUsed[i])
    this.setState({daysUsed:change})
  }

  render(){
    if(!this.state.ready){
      return null
    }
    return(
      
    <View style={styles.container}>
      <ScrollView style={{padding:10}}>      
      <Text style={{ fontSize: 20, padding:4}}>{this.days[new Date().getDay()]}, {this.monthNames[new Date().getMonth()]} {new Date().getDate()}</Text>

      <Text style={{ fontSize: 14, padding:4}}>Enter the times when you're available to work:</Text>
        {
          workTimes.map((workTime, i) => {
            return(
            <View key={workTime.id} style={{flexDirection: 'column',alignItems: 'stretch'}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity style={styles.workButton} onPress={() => this.showTimepicker(i,'start')}>
                  <Text style={{ fontSize: 17,color: '#fff' }}>{this.displayTime(workTime.start)}</Text>
                </TouchableOpacity>
                <Text style={{flex: 1, fontSize:18, alignSelf: 'center'  }}>to</Text>
                <TouchableOpacity style={styles.workButton} onPress={() => this.showTimepicker(i,'end')}>
                  <Text style={{ fontSize: 17,color: '#fff' }}>{this.displayTime(workTime.end)}</Text>
                </TouchableOpacity>
                {/* start picker */}
                {this.show(i) && (
                <DateTimePicker
                  value={this.state.type=='start'?new Date(workTime.start):new Date(workTime.end)}
                  mode={'time'}
                  display="default"
                  onChange={this.onTimeChange}
                />)}
                <Icon size={35} style={{flex: 1}} name="x-circle" type='feather' onPress={() => this.handleDelete(i)}/>
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
            <TouchableOpacity style={styles.workButton} onPress={() => this.showTimepicker(-1,'start')}>
              <Text style={{ fontSize: 17,  color: '#fff' }}>{this.state.start!=null?this.displayTime(this.state.start):"Start"}</Text>
            </TouchableOpacity>
            <Text style={{flex: 1,fontSize: 18,}}>to</Text>
            <TouchableOpacity style={styles.workButton} onPress={() => this.showTimepicker(-1,'end')}>
              <Text style={{ fontSize: 17, color: '#fff'}}>{this.state.end!=null?this.displayTime(this.state.end):'End'}</Text>
            </TouchableOpacity>
            <View style={{flex: 1}}/>
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
        <Text style={{ fontSize: 17, padding:3 }}>Use for:</Text>
        <CheckBox
            title='Weekly'
            checked={this.state.checked}
            onPress={() => this.setState({checked: !this.state.checked})}
          />
          <View style={{padding:8,flexDirection:'row',justifyContent: 'center',alignItems: 'center'}}>
          
          {
            this.state.daysUsed.map((day, i) => {
              return (
                <Avatar key={i}
                containerStyle={day==true?{backgroundColor:'#152075',margin:1}:{backgroundColor:'gray',margin:1}}
                  size="small"
                  rounded
                  title={this.days[i].slice(0, 1)}
                  onPress={() => this.changeDay(i)}
                />
              )
            })
          }
          </View>
          {this.state.daysUsed.includes(true)==false?<Text style={{ fontSize: 15, color: 'red', alignSelf:'center'}}>Nothing is selected!</Text>:null}
             
          
        </ScrollView>
        <TouchableOpacity
            onPress={() => this.handleSave()}
            style={[styles.button,{bottom:0,right:0,alignSelf:'flex-end',paddingVertical:0}]}>
            <Text style={{ fontSize: 17, color: '#fff', padding:3 }}>Save</Text>
            </TouchableOpacity> 
    </View>      

    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  button: {
    backgroundColor: "#152075",
    padding: 6,
    margin: 10,
    borderRadius: 5,
  },
workButton:{
  backgroundColor: "#152075",
  padding: 6,
  alignItems: 'center',
  margin: 10,
  borderRadius: 5,
  flex:4
}
});