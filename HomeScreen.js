import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity, ScrollView, Alert} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

var tasks = [];
var workTimes = [];


export default class HomeScreen extends React.Component {

  loaded = false
  state = {
    ready: false,
    taskIndex: 0, 
    selectable: true
  };


  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
			this.getData();  
		});
    this.getData();
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
      alert(e)
    }
  } 

  setWorkTimes(savedTime){
    workTimes = savedTime[new Date().getDay()]
    this.setState({ready:true})
  }

  getWorkTimes = async () => {
    try {
      
      if(workTimes.length==0&&this.loaded==false){
        const savedTimeJsonValue = await AsyncStorage.getItem('savedWorkTimes')
        var savedTime =  savedTimeJsonValue != null ? JSON.parse(savedTimeJsonValue) : null;
        if(savedTime != null&&savedTime[new Date().getDay()]!=null&&savedTime[new Date().getDay()].length>0){
          this.loaded = true
          
          Alert.alert(
            'Load WorkTimes',
            "Load today's preset work times?",
            [
              {
                text: 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel'
              },
              { text: 'OK', onPress: () => this.setWorkTimes(savedTime)}
            ],
            { cancelable: false }
            
          );
        } 
      }
      else if(this.loaded==true){
        this.loaded = false
      }
      
    } catch(e) {
      alert(e)
    }
  } 

  presetTimes = async () => {
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
      alert(e)
    }
  }

  sortWorkTimes() {
    
    for(var i=0; i<=workTimes.length-1;i++){
      if(new Date(workTimes[i].end).getTime()<new Date()){
        workTimes.splice(i, 1)
        this.saveWorkTimes()
        return
      }
      else if(new Date(workTimes[i].start).getTime()<new Date()){
        workTimes[i].start=new Date()
        this.saveWorkTimes()
        return
      }
      
    }
   
    
  }

  saveWorkTimes = async () =>{
    try { 
      
      const jsonValue = JSON.stringify(workTimes)
      await AsyncStorage.setItem('workTimes', jsonValue)
    } catch (e) {
      alert(e)
    }
  }

  async clear(key) {
    try {
      await AsyncStorage.removeItem('tasks')
      await AsyncStorage.removeItem('workTimes')
      tasks = []
      workTimes = []
      this.setState({ready:true})
    } catch (e) {
      alert(e)
    }
  }

  makeSchedule(){
    var workIndex = 0;
    this.sortWorkTimes()
    this.getWorkTimes()
    if(tasks.length > 0){
      var time = new Date(Date.now())
      var newIndex = false
      var schedule = []
      for(var i = 0; i <= workTimes.length+1;i++){
        schedule.push([])
      }
      if(this.state.selectable==true&&workTimes.length>0){
        time = new Date(workTimes[workIndex].start);
      }
      else if(this.state.selectable==false){
        tasks[0].length -= Math.round(((new Date ()).getTime()-new Date(tasks[0].start).getTime())/(1000*60))
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
            if (tasks[i].length<=(new Date(workTimes[workIndex].end).getTime()-new Date(time).getTime())/(1000*60))
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
                tasks[i+1].length -= Math.round(((new Date ()).getTime()-new Date(tasks[0].start).getTime())/(1000*60))
              }
              time = tasks[i].end
            }
            schedule[workIndex][schedule[workIndex].length-1].color='#fff'
          }
          else{
            tasks[i].start = time
            tasks[i].end = new Date (new Date(time).getTime()+tasks[i].length*1000*60)
            // tasks[i].length = (new Date(tasks[i].end).getTime()-new Date(tasks[i].start).getTime())/(1000*60)
            tasks[i].color='#FF0000'
            schedule[workIndex].push({...tasks[i]})
            time=tasks[i].end;
            if(i>0&&tasks[i].name==tasks[i-1].name){
              tasks.splice(i, 1)
            }
            
            
         }
        }
      
    }
    return schedule
  }

  selected(index){
    this.setState({taskIndex: index})
  }

  start(){
    if(tasks.length>0){
      this.setState({selectable:false})
      var selectedTask = tasks[this.state.taskIndex]
      tasks.splice(this.state.taskIndex, 1)
      this.sortTask()
      tasks.splice(0, 0, selectedTask)
      this.setState({taskIndex: 0}) 
    }
    
  }

  pause(){
    if(tasks.length > 0){
      if(tasks[0].length-Math.round(((new Date ()).getTime()-new Date(tasks[0].start).getTime())/(1000*60))>0){
        tasks[0].length -= Math.round(((new Date ()).getTime()-new Date(tasks[0].start).getTime())/(1000*60))
      }
      else{
        tasks[0].length = 10
      }
      this.setState({selectable:true})
    } 
  }

  stop = async () =>{
    if(tasks.length> 0){
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
    
  }

  sortTask(){
    for(var i=tasks.length-1; i>=0; i--) {
      if(tasks[i].sortValue<=tasks[0].sortValue){
        var sortTask = tasks[0]
        tasks.splice(0,1)
        tasks.splice(i+1, 0, sortTask)
      }
    }
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
        alert(e)
      }
    }
  }

  editWorkTimes = async (index) =>{
    try {
      const jsonValue = JSON.stringify(index)
      await AsyncStorage.setItem('workIndex', jsonValue)
      this.props.navigation.navigate('AddWorkTime')
    } catch (e) {
      alert(e)
    }
  }

  taskName(){
    if(tasks.length > 0){
      return tasks[this.state.taskIndex].name
    }
    return 'Select a Task'
  }

  render(){
    const { navigate } = this.props.navigation;

    if(!this.state.ready){
      return null
    }
    var schedule=this.makeSchedule()
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.top}> 
          <TouchableOpacity
            onPress={() =>this.presetTimes()}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Set preset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!this.state.selectable}
            onPress={() =>navigate('AddTask')}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>T</Text>
          </TouchableOpacity>
          <TouchableOpacity
          disabled={!this.state.selectable}
            onPress={() =>navigate('AddWorkTime')}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>W</Text>
          </TouchableOpacity>

        </View>
        <View style={{flex:4}}>
          <ScrollView>
              
              <View style={{flex:1}}>
                {
                  workTimes.map((workTime, i) => {
                    
                    return (
                    
                      <View key={i}>
                        <TouchableOpacity
                        disabled={!this.state.selectable}
                        onPress={() => this.editWorkTimes(i)}
                        style={styles.workTimes}
                        > 
                          <View style={{flex:1}}/>
                          <View style={{flex:3, flexDirection:'column',}}>
                            {
                              schedule[i].map((task, i) => {
                                
                                return (
                                <View  key={i}>
                                <TouchableOpacity
                                disabled={!this.state.selectable}
                                onPress={() => this.selected(tasks.indexOf(task))}
                                style={styles.button}
                                > 
                                
                                <Text style={{ fontSize: 25, color: task.color }}>{task.name}</Text>
                                <Text style={{ fontSize: 13, color: '#fff' }}>{this.displayTime(task.start)+' - '+this.displayTime(task.end)}</Text>
                                <Text style={{ fontSize: 13, color: '#fff' }}>{'Due: '+this.displayDate(task.date)+' '+this.displayTime(task.date)}</Text>
                                </TouchableOpacity>
                                </View>
                                );
                              })
                            }
                          </View>
                          {/* <Text style={{ fontSize: 15, color: '#fff' }}>{this.displayTime(workTime.start)+' - '+this.displayTime(workTime.end)}</Text> */}
                        </TouchableOpacity>
                      </View>
                    );
                  })
                }
                <View style={{borderColor:'#fff',borderWidth: 3,}}>
                  {
                    schedule[schedule.length-1].map((task, i) => {
                      
                      return (
                      <View  key={i}>
                      <TouchableOpacity
                      disabled={!this.state.selectable}
                      onPress={() => this.selected(tasks.indexOf(i))}
                      style={styles.button}
                      > 
                      
                      <Text style={{ fontSize: 25, color: task.color }}>{task.name}</Text>
                      <Text style={{ fontSize: 13, color: '#fff' }}>{this.displayTime(task.start)+' - '+this.displayTime(task.end)}</Text>
                      <Text style={{ fontSize: 13, color: '#fff' }}>{'Due: '+this.displayDate(task.date)+' '+this.displayTime(task.date)}</Text>
                      </TouchableOpacity>
                      </View>
                      );
                    })
                  }
                </View>
              </View>
              
            <View>
              <TouchableOpacity
                onPress={() => this.clear()}
                style={styles.button}>
                <Text style={{ fontSize: 20, color: '#fff' }}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
          </ScrollView>
        </View>
        <View style={styles.selectView}>
          <View style={styles.inSelection}>
            <Text style={{ fontSize: 20}}>{this.taskName()}</Text>
            <TouchableOpacity disabled={!this.state.selectable} onPress={() => this.editTask()} style={{padding: 20, borderRadius: 5}}>
              <Text style={{ fontSize: 20}}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inSelection}>
            <TouchableOpacity onPress={() => this.start()} style={{padding: 20, borderRadius: 5}}>
              <Text style={{ fontSize: 20}}>S</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={this.state.selectable} onPress={() => this.pause()} style={{padding: 20, borderRadius: 5}}>
              <Text style={{ fontSize: 20}}>P</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.stop()} style={{padding: 20, borderRadius: 5}}>
              <Text style={{ fontSize: 20}}>F</Text>
            </TouchableOpacity>
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
    flexDirection: 'row'
  },
  button: {
    backgroundColor: "blue",
    padding: 20,
    borderRadius: 3,
    borderColor:'#fff',
    borderWidth: 3,
  },
  workTimes: {
    backgroundColor: "#66ff00",
    padding: 20,
    flexDirection: 'row',
    borderRadius: 3,
    borderColor:'#fff',
    borderWidth: 3,
  },
  selectView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  inSelection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  }
});