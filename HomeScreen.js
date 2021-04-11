import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity, ScrollView} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

var tasks = [];
var workTimes = [];


export default class HomeScreen extends React.Component {
 selectable = true

  state = {
    ready: false,
    taskIndex: 0,
    rerender: false
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

  sortWorkTimes() {
    for(var i=0; i<=workTimes.length-1;i++){
      if(new Date(workTimes[i].end).getTime()<new Date()){
        workTimes.splice(i, 1)
      }
      else if(new Date(workTimes[i].start).getTime()<new Date()){
        workTimes[i].start=new Date()
        
      }
      
    }
  }

  async removeKey(key) {
    try {
      await AsyncStorage.removeItem(key)
      if(key=='tasks'){
        tasks = []
      }
      else{
        workTimes = []
      }
      this.setState({ready:true})
    } catch (e) {
      alert(e)
    }
  }

  combineTasks(){
    for(var i=0;i<tasks.length-1;i++) {
      if(tasks[i].name==tasks[i+1].name){
        tasks[i].end = tasks[i+1].end
        tasks[i].length = (new Date(tasks[i].end).getTime()-new Date(tasks[i].start).getTime())/(1000*60)
        tasks.splice(i+1, 1)
      }
      
    };
  }

  makeSchedule(){
    this.combineTasks()
    var workIndex = 0;
    if(tasks.length > 0){
      var time = new Date(Date.now())
      var newIndex = false
      this.sortWorkTimes()
      if(workTimes.length>0){
        time = new Date(workTimes[workIndex].start);
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
            }
            else if(new Date(workTimes[workIndex].end).getTime()-new Date(time).getTime()<3)
            {
              time=workTimes.get[workIndex].end;
            }
            else
            {
              
              tasks[i].start = time
              tasks[i].end = workTimes[workIndex].end
              tasks.splice(i+1,0,{...tasks[i]})
              tasks[i+1].length = Math.round((new Date(workTimes[workIndex].end).getTime()-new Date(time).getTime())/(1000*60))
              time = tasks[i].end
            }
            tasks[i].color='#fff'
          }
          else{
            
          tasks[i].start = time
              
            tasks[i].end = new Date (new Date(time).getTime()+tasks[i].length*1000*60)
            tasks[i].length = (new Date(tasks[i].end).getTime()-new Date(tasks[i].start).getTime())/(1000*60)

            tasks[i].color='#FF0000'

            time=tasks[i].end;
            
         }
        }
      
    }
    return tasks
  }

  selected(index){
    this.setState({taskIndex: index})
  }

  start(){
    selectable = false
    tasks[this.state.taskIndex].start = new Date()
  }

  pause(){
    if(new Date () - (tasks[this.state.taskIndex].start).getTime()>0){
      tasks[this.state.taskIndex].length = ((new Date ()).getTime - new Date(tasks[this.state.taskIndex]).start)/(60*1000)
    }
    else{
      tasks[this.state.taskIndex].length = 10
    }
    selectable = true
  }

  stop = async () =>{
    tasks.splice(this.state.taskIndex,1)
    try {
      const jsonValue = JSON.stringify(tasks)
      await AsyncStorage.setItem('tasks', jsonValue)
    } catch (e) {
      alert(e)
    }
    this.setState({taskIndex:0})
    selectable = true
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

  editTask = async (index) =>{
    try {
      const jsonValue = JSON.stringify(index)
      await AsyncStorage.setItem('editIndex', jsonValue)
      this.props.navigation.navigate('AddTask')
    } catch (e) {
      alert(e)
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

  render(){
    const { navigate } = this.props.navigation;

    if(!this.state.ready){
      return null
    }
    var schedule=this.makeSchedule()
    return (
      <View style={styles.container}>
        <View style={styles.top}> 
          <View>
            <TouchableOpacity
              onPress={() =>navigate('AddTask')}
              style={styles.button}>
              <Text style={{ fontSize: 20, color: '#fff' }}>T</Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity
              onPress={() =>navigate('AddWorkTime')}
              style={styles.button}>
              <Text style={{ fontSize: 20, color: '#fff' }}>W</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flex:4}}>
          <ScrollView>
            <View style={{alignSelf: 'stretch',flexDirection:'row'}}>   
              <View style={{flex:1,flexDirection:'column'}}>
                {
                  workTimes.map((workTime, i) => {
                    
                    return (
                    <View key={i}>
                    <TouchableOpacity
                      onPress={() => this.editWorkTimes(i)}
                      style={styles.button}
                      > 
                      
                      <Text style={{ fontSize: 15, color: '#fff' }}>{this.displayTime(workTime.start)+' - '+this.displayTime(workTime.end)}</Text>
                    </TouchableOpacity>
                    </View>
                    );
                  })
                }
              </View>
              <View style={{flex:1, flexDirection:'column',}}>
                {
                  schedule.map((task, i) => {
                    
                    return (
                    <View  key={i}>
                    <TouchableOpacity
                    onPress={() => this.editTask(i)}
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
                onPress={() => this.removeKey('workTimes')}
                style={styles.button}>
                <Text style={{ fontSize: 20, color: '#fff' }}>Clear WorkTimes</Text>
              </TouchableOpacity>
              </View>

              <View>
              <TouchableOpacity
                onPress={() => this.removeKey('tasks')}
                style={styles.button}>
                <Text style={{ fontSize: 20, color: '#fff' }}>Clear Tasks</Text>
              </TouchableOpacity>
            </View>
            
          </ScrollView>
        </View>
        <View style={styles.selectView}>
          <View style={styles.inSelection}>
            <Text style={{ fontSize: 20}}>Name</Text>
            <Text style={{ fontSize: 20}}>Edit</Text>
            <Text style={{ fontSize: 20}}>Delete</Text>
          </View>
          <View style={styles.inSelection}>
            <Text style={{ fontSize: 20}}>S</Text>
            <Text style={{ fontSize: 20}}>P</Text>
            <Text style={{ fontSize: 20}}>F</Text>
          </View>
        </View>
      </View>
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
    borderRadius: 5,
    // position: 'absolute',
    // top:0,
    // right:0,
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