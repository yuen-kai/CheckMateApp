import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity, ScrollView, Alert} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon,Divider, SpeedDial, ThemeProvider} from 'react-native-elements';

var tasks = [];
var workTimes = [];


export default class HomeScreen extends React.Component {
  availableTime = 0
  intervalID
  open = true

  state = {
    ready: false,
    taskIndex: 0, 
    previousIndex:0,
    selectable: true,
  };


  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
			this.getData();  
		});
    this.getData();
    this.intervalID=setInterval(
      () => this.setState({ready:true}),
      10*1000
    );
  }


  getData = async () => {
    try {
      const taskJsonValue = await AsyncStorage.getItem('tasks')
      tasks =  taskJsonValue != null ? JSON.parse(taskJsonValue) : null;
      if(tasks == null){
        tasks=[]
      }
      const workTimeJsonValue = await AsyncStorage.getItem('workTimes')
      workTimes =  workTimeJsonValue != null ? JSON.parse(workTimeJsonValue) : null;
      if(workTimes == null){
        workTimes=[]
      }
      this.setState({ready:true})
      
    } catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  } 

  sortWorkTimes() {
    
    for(var i=0; i<=workTimes.length-1;i++){
      if(new Date(workTimes[i].end).getTime()<=Date.now()){
        workTimes.splice(i, 1)
        if(this.state.selectable==false){
          this.pause()
        }
      }
      else if(new Date(workTimes[i].start).getTime()<Date.now()){
        workTimes[i].start=new Date()
        
      }
      
    }
   this.saveWorkTimes()
  }

  saveWorkTimes = async () =>{
    try { 
      
      const jsonValue = JSON.stringify(workTimes)
      await AsyncStorage.setItem('workTimes', jsonValue)
    } catch (e) {
      Alert.alert('Error saving work times!','Failed to save work times! Please try again.')
      console.log(e)
    }
  }

  clear() {
    Alert.alert(
      'Clear All',
      "Are you sure? This action can not be undone!",
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        { text: 'Yes', onPress: () => this.clearAll()}
      ],
      { cancelable: true }
      
    )
  }

  async clearAll() {
    try {
      await AsyncStorage.removeItem('tasks')
      await AsyncStorage.removeItem('workTimes')
      tasks = []
      workTimes = []
      this.setState({selectable:true})
      this.setState({ready:true})
    } catch (e) {
      Alert.alert('Error clearing all!','Failed to clear all! Please try again.')
      console.log(e)
    }
  }

  makeSchedule(){
    var workIndex = 0;
    var lastTask = new Date()
    this.sortWorkTimes()
      var schedule = []
      for(var i = 1; i <= workTimes.length+1;i++){
        schedule.push([])
      }
    if(tasks.length > 0){
      
      
      var time = new Date(Math.floor(Date.now()/(60*1000))*60*1000)
      
      var newIndex = false
      
      if(this.state.selectable==true&&workTimes.length>0){
        time = new Date(workTimes[workIndex].start);
      }
      else if(this.state.selectable==false){
        tasks[0].length -= Math.round((Date.now()-new Date(tasks[0].start).getTime())/(1000*60))
      }
        for (var i = 0; i <=tasks.length-1; i++){
          if (workIndex<=workTimes.length-1&&new Date(time).getTime()==new Date(workTimes[workIndex].end).getTime())
          { 
            workIndex++;
            newIndex = true
          }
          if(workIndex <= workTimes.length-1){
            if (newIndex==true&&new Date(time).getTime()==new Date(workTimes[workIndex-1].end).getTime())
            { 
              newIndex = false
              time=workTimes[workIndex].start;
              
            }
            if (tasks[i].length<=Math.round((new Date(workTimes[workIndex].end).getTime()-new Date(time).getTime())/(1000*60)))
            {
              tasks[i].start = time
              tasks[i].end = new Date (new Date(time).getTime()+tasks[i].length*1000*60)
              time=tasks[i].end;
              schedule[workIndex].push({...tasks[i]})
            }
            else
            {
              
              tasks[i].start = time
              tasks[i].end = workTimes[workIndex].end
              schedule[workIndex].push({...tasks[i]})
              if(tasks[i].length-Math.round((new Date(workTimes[workIndex].end).getTime()-new Date(time).getTime())/(1000*60))>0){
                tasks.splice(i+1,0,{...tasks[i]})
                tasks[i+1].length -= Math.round((new Date(workTimes[workIndex].end).getTime()-new Date(time).getTime())/(1000*60))
              }
              time = tasks[i].end
            }
            schedule[workIndex][schedule[workIndex].length-1].color='#fff'
          }
          else{
            tasks[i].start = time
            tasks[i].end = new Date (new Date(time).getTime()+tasks[i].length*1000*60)
            tasks[i].color='#FF0000'
            schedule[workIndex].push({...tasks[i]})
            time=tasks[i].end;
          }
          lastTask = tasks[i].end
          if(i>0&&tasks[i].name==tasks[i-1].name){
            tasks.splice(i, 1)
            i-=1
          }
        }
        
      
    }
    if(workTimes.length>0){
      this.availableTime = new Date(workTimes[workTimes.length-1].end).getTime()-new Date(lastTask).getTime()
    }
    else{
      this.availableTime = Date.now()-new Date(lastTask).getTime()
    }
    return schedule
  }

  selected(index){
    this.setState({taskIndex: index})
  }

  start(){
    if(workTimes.length>0&&Date.now()>new Date(workTimes[0].start).getTime()&&Date.now()<new Date(workTimes[0].end).getTime()){
      this.setState({selectable:false})
      var selectedTask = tasks[this.state.taskIndex]
      tasks.splice(this.state.taskIndex, 1)
      this.setState({taskIndex: 0}) 
      
      
      this.sortTask()
      tasks.splice(0, 0, selectedTask)
      tasks[0].start=Date.now()
    }
    else if(workTimes.length==0||!(Date.now()>new Date(workTimes[0].start).getTime()&&Date.now()<new Date(workTimes[0].end).getTime())){
      Alert.alert(
        'Outside of Work Times',
        "You are only able to do tasks during your work times. Please add/edit your work times instead.",
        [
          { text: 'Ok'}
        ],
        { cancelable: true }
        
      )
    }
    
  }

  async pause(){
      if(tasks[0].length-Math.floor(((new Date ()).getTime()-new Date(tasks[0].start).getTime())/(1000*60))>0){
        tasks[0].length -= Math.floor(((new Date ()).getTime()-new Date(tasks[0].start).getTime())/(1000*60))
      }
      else{
        tasks[0].length = 10
      }
      this.setState({selectable:true})
    try {
      const jsonValue = JSON.stringify(tasks)
      await AsyncStorage.setItem('tasks', jsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  stop = async () =>{
      tasks.splice(0,1)
      try {
        const jsonValue = JSON.stringify(tasks)
        await AsyncStorage.setItem('tasks', jsonValue)
      } catch (e) {
        console.log(e)
      }
      this.setState({taskIndex:0})
      this.setState({selectable:true})
    
  }

  sortTask(){
    for(var i=tasks.length-1; i>=0; i--) {
      if(tasks[i].sortValue<=tasks[0].sortValue){
        var sortTask = tasks[0]
        tasks.splice(0,1)
        tasks.splice(i, 0, sortTask)
      }
    }
  }

  displayTime(date){
    var hours = new Date(date).getHours()
    var minutes = new Date(date).getMinutes()
    var amPm = ' am'
    if(hours>=12){
      amPm=' pm'
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
    return hours+':'+minutes+amPm
  }

  displayDate(date) {
    var month = new Date(date).getMonth()+1
    var day = new Date(date).getDate()
    return month+"/"+day
  }

  editTask = async () =>{
    if(tasks.length>0){
      try {
        const jsonValue = JSON.stringify(this.state.taskIndex)
        await AsyncStorage.setItem('editIndex', jsonValue)
        this.props.navigation.navigate('AddTask')
      } catch (e) {
        Alert.alert('Error getting task edit info!','Failed to get task edit info! Please try again.')
        console.log(e)
      }
    }
  }

  editWorkTimes = async (index) =>{
    try {
      const jsonValue = JSON.stringify(index)
      await AsyncStorage.setItem('workIndex', jsonValue)
      this.props.navigation.navigate('AddWorkTime')
    } catch (e) {
      Alert.alert('Error getting work times edit info!','Failed to get work times edit info! Please try again.')
      console.log(e)
    }
  }

  taskName(){
    if(tasks.length > 0){
      return tasks[this.state.taskIndex].name
    }
    return 'Select a Task'
  }

  findavailableTime(){
    var timeLeft = Math.round(this.availableTime/(60*1000))
    if(timeLeft>=0){
      return timeLeft+' minutes available'
    }
    else{ 
      return -timeLeft+' minutes needed!'
    }
   
  }

  numTasks(schedule,workTimeNum){
    if(schedule[workTimeNum].length==0){
      return '#fff'
    }
    else{
      return '#a6a6a6'
    }
  }

  render(){
    const { navigate } = this.props.navigation;
    if(!this.state.ready){
      return null
    }
    var schedule=this.makeSchedule()
    return (
      
      <SafeAreaView style={styles.container}>
        {/* <SpeedDial
            isOpen={this.open}
            icon={{ name: 'edit', color: '#fff' }}
            openIcon={{ name: 'close', color: '#fff' }}
            direction='down'
            onChange={() => setOpen(!this.open)}
          >
            <SpeedDial.Action
              icon={{ name: 'add', color: '#fff' }}
              title="Add"
              onPress={() => console.log('Add Something')}
            />
            <SpeedDial.Action
              icon={<Icon name="clipboard" size={50} type="feather" onPress={() =>navigate('AddTask')}/>}
              title="Delete"
              onPress={() => console.log('Delete Something')}
            />
          </SpeedDial> */}
        <View style={{flex:9}}>
          
        <View style={styles.top}> 
          <Icon name="clipboard" size={50} type="feather" disabled={!this.state.selectable} onPress={() =>navigate('AddTask')}/>
          <Icon name="clock" size={50} type="feather" disabled={!this.state.selectable} onPress={() =>navigate('AddWorkTime')}/>

        </View>
        <View style={{flex:8}}>
          <ScrollView style={{height: '100%'}}>
              
              <View style={{flex:1}}>
                {
                  workTimes.map((workTime, i) => {
                    
                    return (
                    
                      <View key={i} style={{flexDirection: 'row',alignSelf:'stretch',padding:5}}>
                        {/* <View style={{flex:1,alignSelf:'stretch'}}> */}
                          <TouchableOpacity
                          disabled={!this.state.selectable}
                          onPress={() => this.editWorkTimes(i)}
                          style={styles.workTimes}
                          >
                            <Text style={{ fontSize: 13, color: '#fff' }}>{this.displayTime(workTime.start)+' - '+this.displayTime(workTime.end)}</Text>
                          </TouchableOpacity>
                        {/* </View> */}
                          <View style={{flex:4, flexDirection:'column',borderBottomWidth:2,borderBottomColor:this.numTasks(schedule,i)}}>
                            {
                              schedule[i].map((task, j) => {
                                return (
                                <View  key={task.name}>
                                  <TouchableOpacity
                                  disabled={!this.state.selectable}
                                  onPress={() => this.selected(tasks.findIndex((element)=>element.name==task.name))}
                                  style={styles.tasks}
                                  > 
                                  
                                  <Text style={{ fontSize: 17, color: task.color, alignSelf: 'center' }}>{task.name}</Text>
                                  <View style={{flexDirection: 'row', justifyContent:'space-around', flexWrap:'wrap'}}>
                                    <Text style={{ fontSize: 13, color: '#fff' }}>{this.displayTime(task.start)+' - '+this.displayTime(task.end)+' (Due: '+this.displayDate(task.date)+' '+this.displayTime(task.date)+')'}</Text>
                                  </View>
                                  </TouchableOpacity>
                                </View>
                                );
                              })
                            }
                          </View>
                          
                        
                      </View>
                    );
                  })
                }
                <View style={{alignSelf:'stretch',padding:5}}>
                  <View style={{ borderBottomWidth:2,borderBottomColor:this.numTasks(schedule,schedule.length-1)}}>
                  {
                    schedule[schedule.length-1].map((task, i) => {
                      return (
                      <View  key={task.name} >
                        <TouchableOpacity
                        disabled={!this.state.selectable}
                        onPress={() => this.selected(tasks.findIndex((element)=>element.name==task.name))}
                        style={styles.overTasks}
                        > 
                        
                        <Text style={{ fontSize: 17, color: '#555555', alignSelf: 'center' }}>{task.name}</Text>
                        <Text style={{ fontSize: 13, color: '#555555' }}>{task.length+' min (Due: '+this.displayDate(task.date)+' '+this.displayTime(task.date)+')'}</Text>
                        </TouchableOpacity>
                      </View>
                      );
                    })
                  }
                  </View>
                </View>
              </View>
              
            <View style={{padding:8}}>
              {workTimes.length>0||tasks.length>0? 
                <TouchableOpacity onPress={() => this.clear()} style={styles.button}>
                  <Text style={{ fontSize: 20, color: '#fff' }}>Clear All</Text>
                </TouchableOpacity>
              : null}
            </View>
            
          </ScrollView>
          
        </View>
        {this.state.selectable==false? <View style={styles.grayOverlay}/>:null}
        </View>
        <Divider style={{ backgroundColor: 'gray' }} />
        <View style={styles.selectView}>
          <View style={styles.inSelection}>
            <Text style={{ fontSize: 20}}>{this.taskName()}</Text>
            <Icon color={this.state.selectable==false||tasks.length==0?'gray':'black'} name="pencil-alt" type='font-awesome-5' onPress={this.state.selectable==false||tasks.length==0?null:() => this.editTask()}/>
          </View>
          <View style={styles.inSelection}>
          {this.state.selectable==true?<Icon name="play" type='font-awesome-5' size={30} color={tasks.length>0?'limegreen':'gray'} onPress={tasks.length>0?() => this.start(): null}></Icon>:<Icon name="pause" size={30} type='font-awesome-5' color={'#FFCC00'} onPress={() => this.pause()}/>}
            
            <Icon name="stop" type='font-awesome-5'color={tasks.length>0?'red':'gray'} size={30} onPress={tasks.length>0?() => this.stop():null}/>
          </View>
          <View style={{flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around',padding:3}}>
            <Text style={{fontSize:15}}>{this.findavailableTime()}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
    
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },
  top: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    padding: 8
  },
  button: {
    backgroundColor: "blue",
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  grayOverlay: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor:'gray',
    opacity:.5,
    top:0,
    height:'100%',
    width:'100%',
  },
  topButton: {
    backgroundColor: "blue",
    padding: 8,
    borderRadius: 6,
  },
  tasks:{
    backgroundColor: "deepskyblue",
    padding: 5,
    borderColor:'#a6a6a6',
    borderWidth: 2,
    borderBottomWidth:0,
  },
  overTasks:{
    backgroundColor: "#AAAFB4",
    padding: 5,
    borderColor:'#a6a6a6',
    borderWidth: 2,
    borderBottomWidth:0,
  },
  workTimes: {
    flex: 1,
    backgroundColor: "blue",
    padding: 8,
    flexDirection: 'row',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  selectView: {
    flex: 2.5,
    padding: 3,
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  inSelection: {
    flex: 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  }
});