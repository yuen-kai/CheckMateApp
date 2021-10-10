import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity, ScrollView, Alert} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon,Divider, SpeedDial} from 'react-native-elements';

var tasks = [];
var workTimes = [];


export default class HomeScreen extends React.Component {
  availableTime = 0
  intervalID

  state = {
    open:false,
    ready: false,
    taskIndex: 0, 
    previousIndex:0,
    selectable: true,
  };

  //get data
  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getData();  
    });
    this.getData()
    this.getSelectable()
    this.intervalID=setInterval(
      () => this.setState({ready:true}),
      500
    );
  }
  
  getData = async () => {
      this.savedTasks()
      this.savedTime()
    
    this.setState({ready: true})
  } 

  async savedTasks(){
    try {
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      var savedTask = savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;
      if(savedTask == null){
        savedTask = [new Array(7),new Array(7)]
        savedTask.forEach(element => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        });
      } 
      if(savedTask[0][new Date().getDay()].length==0){
        savedTask[0][new Date().getDay()] = [...savedTask[1][new Date().getDay()]]
      }
      savedTask[0][new Date().getDay()].forEach(e => {
        if(e.repeating = true) 
        {
          var d = new Date().setHours(0,0,0,0)
          e.date = new Date(new Date(d).getTime()+e.dueIncrease)
        }
      });
      
     
      tasks = [...savedTask[0][new Date().getDay()]]
        const jsonValue = JSON.stringify(savedTask)
        await AsyncStorage.setItem('tasks', jsonValue)
        this.setState({ready:true})
    }catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }

  async savedTime(){
    try {
      const savedTimeJsonValue = await AsyncStorage.getItem('savedWorkTimes')
      var savedTime =  savedTimeJsonValue != null ? JSON.parse(savedTimeJsonValue) : null;
      if(savedTime == null){
        savedTime = [new Array(7),new Array(7)]
        savedTime.forEach(element => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        });
      } 
      if(savedTime[0][new Date().getDay()].length==0){
        savedTime[0][new Date().getDay()] = [...savedTime[1][new Date().getDay()]]
      }
      savedTime[0][new Date().getDay()].forEach(e => {
        e.start=new Date(e.start).setFullYear(new Date(Date.now()).getFullYear(), new Date(Date.now()).getMonth(), new Date(Date.now()).getDate())
        e.end=new Date(e.end).setFullYear(new Date(Date.now()).getFullYear(), new Date(Date.now()).getMonth(), new Date(Date.now()).getDate())
      });
      
     
      workTimes = [...savedTime[0][new Date().getDay()]]
        const jsonValue = JSON.stringify(savedTime)
        await AsyncStorage.setItem('savedWorkTimes', jsonValue)
        this.setState({ready:true})
    }catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }
  
  async getSelectable() {
    const JsonValue = await AsyncStorage.getItem('selectable')
    selectable =  JsonValue != null ? JSON.parse(JsonValue) : null;
    if(selectable == null){
      selectable=false
    }
    this.setState({selectable:selectable})
    this.savedTime()
  }

  //Find day and time
  day(time){
    return Math.floor(new Date()/(60*1000*60*24))-Math.floor(new Date(time)/(60*1000*60*24))
  }
  
  time(t){
    return new Date(Math.floor(new Date(t)/(60*1000))*60*1000)
  }
  
  //Update workTimes based on current time
  sortWorkTimes() {
    for(var i=0; i<=workTimes.length-1;i++){
      if(new Date(workTimes[i].end).getTime()<=Date.now()){
        workTimes.splice(i, 1)
      }
      else if(new Date(workTimes[i].start).getTime()<Date.now()){
        workTimes[i].start=new Date()
      }
    }
    if(workTimes.length>0&&new Date(workTimes[0].start).getTime()>Date.now()&&this.state.selectable==false){
      this.pause()
    }
  }

  //Make Schedule
  makeSchedule(){
    var workIndex = 0;
    var lastTask = new Date()
    this.sortWorkTimes()
      var schedule = []
      for(var i = 0; i <= workTimes.length;i++){
        schedule.push([])
      }
    if(tasks.length > 0){
      
      
      var time = this.time(Date.now())
      
      var newIndex = false
      
      if(this.state.selectable==true&&workTimes.length>0){
        time = new Date(workTimes[workIndex].start);
      }
      else if(this.state.selectable==false){
        
        if(tasks[0].length-((this.time(new Date ())-this.time(tasks[0].start))/(1000*60))>0){
          tasks[0].length -= ((this.time(new Date ())-this.time(new Date(tasks[0].start)))/(1000*60))
        }
        else{
          tasks[0].length = 10
        }
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
              tasks[i].end = this.time(new Date(time).getTime()+tasks[i].length*1000*60)
              time=tasks[i].end;
              schedule[workIndex].push({...tasks[i]})
            }
            else
            {
              
              tasks[i].start = time
              tasks[i].end = this.time(workTimes[workIndex].end)
              schedule[workIndex].push({...tasks[i]})
              if(tasks[i].length-(this.time(workTimes[workIndex].end)-this.time(time))/(1000*60)>0){
                tasks.splice(i+1,0,{...tasks[i]})
                tasks[i+1].length -= (this.time(workTimes[workIndex].end)-this.time(time))/(1000*60)
              }
              time = tasks[i].end
            }
          }
          else{
            tasks[i].start = time
            tasks[i].end = this.time(new Date(time).getTime()+tasks[i].length*1000*60)
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
      this.availableTime = this.time(workTimes[workTimes.length-1].end)-this.time(lastTask)
    }
    else{
      this.availableTime = this.time(Date.now())-this.time(lastTask)
    }
    return schedule
  }

  //Task controls
  start(){
    if(workTimes.length>0&&Date.now()>new Date(workTimes[0].start).getTime()&&Date.now()<new Date(workTimes[0].end).getTime()){
      this.setState({selectable:false})
      var selectedTask = tasks[this.state.taskIndex]
      tasks.splice(this.state.taskIndex, 1)
      this.setState({taskIndex: 0})
      this.sortTask()
      tasks.splice(0, 0, selectedTask)
      tasks[0].start=Date.now()
      this.saveTasks()
      this.saveSeletable()
    }
    else if(workTimes.length==0||!(Date.now()>new Date(workTimes[0].start).getTime()&&Date.now()<new Date(workTimes[0].end).getTime())){
      Alert.alert(
        'Outside of Work Times',
        "You are only able to do tasks during your work times. Please add/edit your work times instead.",
        [
          { text: 'Dismiss',style:"cancel"},
          {text:'Add/Edit',onPress: ()=>this.props.navigation.navigate('AddWorkTime')}
        ],
        { cancelable: true }
        
      )
    }
    
  }

  pause(){
    this.setState({ready:true,selectable:true})
    this.saveTasks()
    this.removeSeletable()
  }

  stop(){
    Alert.alert(
      'Are you sure?',
      "This action is irreversable and your task will be deleted.",
      [
        { text: 'Cancel',style:"cancel"},
        {text:'Continue',onPress: ()=>this.remove()}
      ],
      { cancelable: true }
      
    )
  }

  remove(){
    this.pause()
    tasks.splice(this.state.taskIndex,1)
    this.setState({taskIndex:0})
  }

  //Store selectable(working on task) status
  async saveSeletable(){
    try {
      const jsonValue = JSON.stringify(false)
      await AsyncStorage.setItem('selectable',jsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  async removeSeletable(){
    try {
      const jsonValue = JSON.stringify(true)
      await AsyncStorage.setItem('selectable',jsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  //Save tasks
  async saveTasks(){
    try {
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      var savedTask =  savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;
      savedTask[0][new Date().getDay()]=[...tasks]
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('tasks', jsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  //Rearange tasks to original order; moves first task back to optimized position
  sortTask(){
    for(var i=tasks.length-1; i>=0; i--) {
      if(tasks[i].sortValue<=tasks[0].sortValue){
        var sortTask = tasks[0]
        tasks.splice(0,1)
        tasks.splice(i, 0, sortTask)
      }
    }
    this.saveTasks()
    this.setState({ready:true})
  }

  //Get task information
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

  taskName(){
    if(tasks.length > 0){
      return tasks[this.state.taskIndex].name
    }
    return 'Add a Task'
  }

  //Editing
  editTask = async () =>{
    if(tasks.length>0){
      try {
        const jsonValue = JSON.stringify(tasks[this.state.taskIndex].name)
        await AsyncStorage.setItem('editName', jsonValue)
        this.props.navigation.navigate('AddTask')
      } catch (e) {
        Alert.alert('Error getting task edit info!','Failed to get task edit info! Please try again.')
        console.log(e)
      }
    }
  }

  editWorkTimes(){
    this.props.navigation.navigate('AddWorkTime')
  }

  //Find time left
  findavailableTime(){
    var timeLeft = this.availableTime/(60*1000)
    if(timeLeft>10){
      return <Text style={{fontSize:15, color:'black' }}>{timeLeft} minutes available to use</Text>
    }
    else if(timeLeft>=0){
      return <Text style={{fontSize:15,color: 'orange' }}>{timeLeft} minutes available to use</Text>
    }
    else{ 
      return <Text style={{fontSize:15,color: 'red' }}>{-timeLeft} more minutes needed to finish tasks!</Text>
    }
   
  }

  //Time vs no time task color
  numTasks(schedule,workTimeNum){
    if(schedule[workTimeNum].length==0){
      return '#F6F6F6'
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
        
        <View style={{flex:9}}>
        <View style={styles.top}> 
          {/* Adding Display */}
         <TouchableOpacity style={{flexDirection:'row', backgroundColor:'#152075', marginRight:7, padding:5, borderRadius:5}} onPress={() =>navigate('AddTask')}>   
          <Icon name="plus-circle" color='#fff' size={20} type="feather"/>
          <View style={{alignItems: 'center',marginHorizontal:5}}>
            <Text style={{ fontSize: 13, color: '#fff' }}>Add</Text>
            <Text style={{ fontSize: 13, color: '#fff' }}>Task</Text>
          </View>
          </TouchableOpacity>    
          <TouchableOpacity style={{flexDirection:'row', backgroundColor:'#152075', padding:5, borderRadius:5}} onPress={() =>navigate('AddWorkTime')}>
          <Icon name="clock" color='#fff' size={20} type="feather"/> 
          <View style={{alignItems: 'center',marginHorizontal:5}}>
            <Text style={{ fontSize: 13, color: '#fff' }}>Add</Text>
            <Text style={{ fontSize: 13, color: '#fff'}}>WorkTime</Text>
          </View>
          </TouchableOpacity>
        </View>
        <View style={{flex:8}}>
          <ScrollView style={{height: '100%'}}>
                {
                  workTimes.map((workTime, i) => {
                    
                    return (
                    // {/* Worktime display */}
                      <View key={i} style={{flexDirection: 'row',alignSelf:'stretch',padding:5}}>
                        
                          <TouchableOpacity
                          onPress={() => this.editWorkTimes()}
                          style={styles.workTimes}
                          >
                            <Text style={{ fontSize: 13, color: '#fff' }}>{this.displayTime(workTime.start)+' - '+this.displayTime(workTime.end)}</Text>
                          </TouchableOpacity>
                          <View style={{flex:4,flexDirection:'column',borderBottomWidth:2,borderBottomColor:this.numTasks(schedule,i)}}>
                            {
                              schedule[i].map((task, j) => {
                                return (
                                  // Task Display
                                <View  key={task.name}>
                                  <TouchableOpacity
                                  onPress={() => this.setState({taskIndex: tasks.findIndex((element)=>element.name==task.name)})}
                                  style={this.state.taskIndex==tasks.findIndex((element)=>element.name==task.name)?[styles.tasks,{backgroundColor:'#6163c7'}]:styles.tasks}
                                  > 
                                  <Text style={this.state.taskIndex==tasks.findIndex((element)=>element.name==task.name)?{ fontSize: 17, alignSelf: 'center',fontWeight: 'bold', color:'#fff' }:{ fontSize: 17, alignSelf: 'center', color:'#fff' }}>{task.name}</Text>
                                  <Text style={this.state.taskIndex==tasks.findIndex((element)=>element.name==task.name)?{ fontSize: 12, alignSelf: 'center',fontWeight: 'bold', color: '#fff' }:{ fontSize: 12, alignSelf: 'center', color: '#fff'}}>{this.displayTime(task.start)+' - '+this.displayTime(task.end)+' (Due: '+this.displayDate(task.date)+' '+this.displayTime(task.date)+')'}</Text>
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

                {/*Unable to fit display*/}
                <View style={{flexDirection: 'row',alignSelf:'stretch',padding:5}}>
                  {schedule[schedule.length-1].length>0?
                    <View style={[styles.workTimes,{backgroundColor:'#AAAFB4'}]}>
                      <Text style={{ fontSize: 13}}>Unable to Fit</Text>
                      </View>
                  :null}
                  {/*Unable to fit tasks display*/}
                  <View style={{flex: 4,borderBottomWidth:2,borderBottomColor:this.numTasks(schedule,schedule.length-1)}}>
                  {
                    schedule[schedule.length-1].map((task, i) => {
                      return (
                      <View  key={task.name} >
                        <TouchableOpacity
                        onPress={() => this.setState({taskIndex: tasks.findIndex((element)=>element.name==task.name)})}
                        style={this.state.taskIndex==tasks.findIndex((element)=>element.name==task.name)?[styles.overTasks,{backgroundColor:'#53e0fc'}]:styles.overTasks}
                        > 
                        <Text style={this.state.taskIndex==tasks.findIndex((element)=>element.name==task.name)?{ fontSize: 17, color:'#555555',alignSelf: 'center',fontWeight: 'bold'}:{ fontSize: 17, alignSelf: 'center', color:'#555555'}}>{task.name}</Text>
                        <Text style={this.state.taskIndex==tasks.findIndex((element)=>element.name==task.name)?{ fontSize: 12, color:'#555555', alignSelf: 'center',fontWeight: 'bold'}:{ fontSize: 12, alignSelf: 'center', color:'#555555'}}>{'Length: '+task.length+' min'+' (Due: '+this.displayDate(task.date)+' '+this.displayTime(task.date)+')'}</Text>
                        </TouchableOpacity>
                      </View>
                      );
                    })
                  }
                  </View>
                </View>
              
            {/* Reset order display */}
            <View style={{padding:8}}>
              {tasks.length>=2&&tasks[1].sortValue<tasks[0].sortValue?
              <TouchableOpacity onPress={() => this.sortTask()} style={[styles.button,{flex:1}]}>
              <Text style={{ fontSize: 20, color: '#fff' }}>Reset Order</Text>
            </TouchableOpacity>
            :null}
            </View>
            
          </ScrollView>
          
        </View>

        {/* Task in progress overlay */}
        {this.state.selectable==false? <View style={styles.grayOverlay}/>:null}
        </View>
        <Divider style={{ backgroundColor: 'gray' }} />

        {/* Task controls display */}
        <View style={styles.selectView}>
          <View style={styles.inSelection}>
            <Text style={{ fontSize: 20}}>{this.taskName()}</Text>
            <Icon color={this.state.selectable==false||tasks.length==0?'gray':'black'} name="pencil-alt" type='font-awesome-5' onPress={this.state.selectable==false||tasks.length==0?null:() => this.editTask()}/>
          </View>
          <View style={styles.inSelection}>
          {this.state.selectable==true?<Icon name="play" type='font-awesome-5' size={25} color={tasks.length>0?'limegreen':'gray'} onPress={tasks.length>0?() => this.start(): null}></Icon>:<Icon name="pause" size={30} type='font-awesome-5' color={'#FFCC00'} onPress={() => this.pause()}/>}
            
            <Icon name="stop" type='font-awesome-5'color={tasks.length>0?'red':'gray'} size={25} onPress={tasks.length>0?() => this.stop():null}/>
          </View>
          <View style={{flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around',padding:3}}>
            {this.findavailableTime()}
          </View>
        </View>
      </SafeAreaView>
    );
    
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },
  top: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    padding: 8
  },
  button: {
    backgroundColor: "#3C00BB",
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
    backgroundColor: "#3C00BB",
    padding: 8,
    borderRadius: 6,
  },
  tasks:{
    backgroundColor: "#152075",
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
    backgroundColor: "#152075",
    padding: 8,
    flexDirection: 'row',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  selectView: {
    flex: 2.3,
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
