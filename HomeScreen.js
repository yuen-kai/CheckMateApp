import React, { useEffect } from 'react';
import { StyleSheet, View,TouchableOpacity, ScrollView, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon,Divider,Overlay,Button,SpeedDial,ListItem,Tooltip,Text,Badge} from 'react-native-elements';
// import { SpeedDial } from "@rneui/themed";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import * as Calendar from 'expo-calendar';
import ConfettiCannon from 'react-native-confetti-cannon';
// import Confetti from 'react-confetti'
import Confetti from 'react-native-confetti';

var tasks = [];
var setTasks = [];
var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
// var combined = []

export default class HomeScreen extends React.Component {
  explosion
  intervalID

  state = {
    avalibleTime: 0,
    open:false,
    ready: false,
    taskIndex: 0,
    selectable: true,
    firstTime: false,
    sTask: null,
    combined: [],
    // renderConfetti: false,
  };
  
  // useEffect(() => {
  //   (async () => {
  //     const { status } = await Calendar.requestCalendarPermissionsAsync();
  //     if (status === 'granted') {
  //       const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  //       console.log('Here are all your calendars:');
  //       console.log({ calendars });
  //     }
  //   })();
  // }, []);
  //get data
  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getData();  
    });
    this.getData()
    this.getSelectable()
    var timeToMinute = new Date(new Date().setMinutes(new Date().getMinutes() + 1,0,0)).getTime()-new Date().getTime()


    this.intervalID=setInterval(
      () => {this.makeCombined()},
      timeToMinute
    );
  }
  
  getData = async () => {
    try {
      await this.savedTasks()
      await this.savedSetTasks()
      await this.firstTime()
      await this.changeDay()
      var newCombined = this.makeCombined()
      if(this.state.taskIndex>=newCombined.length){
        this.setState({taskIndex:0})
      }
      else{
        const JsonValue = await AsyncStorage.getItem('editName')
        if(JsonValue != null){
          this.setState({taskIndex:newCombined.findIndex((task)=>task.name==JSON.parse(JsonValue))})
        }
        await AsyncStorage.removeItem('editName')
      }
      
      this.setState({ready:true})
    } catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  } 

  async getSyncEvents(edit){
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map(calendar => calendar.id);
      const events = await Calendar.getEventsAsync(calendarIds, new Date(new Date().setHours(0,0,0,0)), new Date(new Date().setHours(23,59,59,999)))
      let newEvents = events.filter(event => this.time(event.endDate).getTime()>this.time(new Date()).getTime())
      this.manageSyncEvents(newEvents,edit)
    }
  }

  async reviewEvents(events){
    this.setState({error:false})
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map(calendar => calendar.id);
      events = await Calendar.getEventsAsync(calendarIds, new Date(new Date().setHours(0,0,0,0)), new Date(new Date().setHours(23,59,59,999)))
      events = events.filter(event => this.time(event.endDate).getTime()>this.time(new Date()).getTime())
    }
    const eventsJson = JSON.stringify(events)
    await AsyncStorage.setItem('events', eventsJson)
    // console.log(this.checkEvents(events))
    var a = [...this.checkEvents(events)]
    const checkEventJson = JSON.stringify(a)
    await AsyncStorage.setItem('checkEvents', checkEventJson)

    this.props.navigation.navigate('SyncEvents')
  }

  async setSyncPreferences(syncEvents,events){
    try {
      const jsonValue = JSON.stringify(syncEvents)
      await AsyncStorage.setItem('syncEvents5', jsonValue)
      if(syncEvents=="always"){
        this.syncEvents(events)
      }
      else if(syncEvents=="review"){
        this.reviewEvents(events)
      }
    } catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }

  editSyncPrefernces(events){
    Alert.alert(
      'Sync Events?',
      'How do you want to sync your events with your calendar?',
      [
        { text: 'Never', onPress: () => this.setSyncPreferences("never",events) },
        { text: 'Review First', onPress: () => this.setSyncPreferences("review",events)},
        { text: 'Always', onPress:  () => this.setSyncPreferences("always",events)}
      ]
    )
  }

  async manageSyncEvents(events,edit){
    const JsonValue = await AsyncStorage.getItem('syncEvents5')
    var syncEvents = JsonValue != null ? JSON.parse(JsonValue):null
    if(syncEvents==null||edit){
      syncEvents = this.editSyncPrefernces(events)
    }
    else{
      await this.setSyncPreferences(syncEvents,events)
    }
    
  }
  
  checkEvents(events){
    // console.log(events)
    var newEvents = events.filter((event)=>{
      var a = setTasks.findIndex((setTask)=>event.title == setTask.name);
      return !(setTasks.some((element) => element.name==event.title))
          && !(setTasks.some((element) => (this.time(element.start)<=this.time(event.startDate)&&this.time(element.end)>this.time(event.startDate)&&setTasks.indexOf(element)!=a))
          ||setTasks.some((element) => (this.time(element.start)<this.time(event.endDate)&&this.time(element.end)>=this.time(event.endDate)&&setTasks.indexOf(element)!=a))
          ||setTasks.some((element) => (this.time(element.start)>=this.time(event.startDate)&&this.time(element.end)<=this.time(event.endDate)&&setTasks.indexOf(element)!=a))
          ||setTasks.some((element) => (this.time(element.start)<=this.time(event.startDate)&&this.time(element.end)>=this.time(event.endDate)&&setTasks.indexOf(element)!=a)))
    })
    return newEvents
  }

  syncEvents(events){
    var newEvents = this.checkEvents(events)
    var originalNewEvents = []
    for(let i=0;i<newEvents.length;i++){
      let event = newEvents[i]
      originalNewEvents.push(event)
      setTasks.push({
        name: event.title,
        pStart: this.time(event.startDate),
        pEnd: this.time(event.endDate),
        start: this.time(event.startDate),
        end: this.time(event.endDate),
        length: (this.time(event.endDate).getTime() - this.time(event.startDate).getTime())/(1000*60),
      })
      i--
      newEvents = this.checkEvents(events)
    }
    //add events in Events but not in newEvents to reviewEvents
    var reviewEvents = events.filter((event)=>{
      return !(originalNewEvents.some((element) => element.title==event.title))
    })
    if(reviewEvents.length>0){
      this.setState({error:true})
    }
    this.sortTimes()
    this.saveTasks()
    this.makeCombined()
  }

  async firstTime(){
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      var first = JsonValue != null ? JSON.parse(JsonValue): null;
      if(first==null){
        await this.getSyncEvents(true)
        this.setState({firstTime: true})
        const jsonValue = JSON.stringify(false)
        await AsyncStorage.setItem('firsty', jsonValue)
      }
      
    }catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }
  async savedTasks(){
    try {
      const JsonValue = await AsyncStorage.getItem('firsty')
      var first = JsonValue != null ? JSON.parse(JsonValue) :true;
      const dayJsonValue = await AsyncStorage.getItem('day')
      var day = dayJsonValue != null ? JSON.parse(dayJsonValue) :null;
      var oldTasks=[]
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      var savedTask = savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;

      if(first){
        day = null;
        savedTask = null;
      }
      
      var needUpdate = false;
      //Set up savedTask
      if(savedTask == null){
        needUpdate = true
        savedTask = [new Array(7),new Array(7)]
        savedTask.forEach(element => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        });
      }
      //If it is a new day
      if (day != null&&new Date(new Date().setHours(0,0,0,0)).getTime()!=new Date(day).getTime()) {
        oldTasks = [...savedTask[0][new Date(day).getDay()]]
        //If it is a new week, set the week's tasks to the weekly ones
        if(new Date(new Date().setHours(0,0,0,0)).getTime()-new Date(day).getTime()>(new Date().getDay()-new Date(day).getDay())*1000*60*60*24){
          savedTask[0]=[...savedTask[1]]
        }

        //Shift due dates
        savedTask[0][new Date().getDay()].forEach(e => {
          if(e.repeating = true) 
          {
            var d = new Date().setHours(0,0,0,0)
            e.date = new Date(new Date(d).getTime()+e.dueIncrease)
            e.sortValue =this.updateSortValue(e)
          }
        });
        //Remove or edit recuring tasks
        for(let i=0;i<oldTasks.length;i++){
          var newIndex = savedTask[0][new Date().getDay()].findIndex((element)=>element.name==oldTasks[i].name)
          if(newIndex!=-1){
            if(savedTask[0][new Date().getDay()][newIndex].overridable){
              oldTasks.splice(i,1)
              i--
            }
            else{
              savedTask[0][new Date().getDay()][newIndex].length=parseInt(savedTask[0][new Date().getDay()][newIndex].length)
              oldTasks[i].length = parseInt(oldTasks[i].length)
              savedTask[0][new Date().getDay()][newIndex].length+=oldTasks[i].length
              savedTask[0][new Date().getDay()][newIndex].sortValue = this.updateSortValue(savedTask[0][new Date().getDay()][newIndex])
              oldTasks.splice(i,1)
              i--
              savedTask[0][new Date().getDay()][newIndex].repeating = false
            }
          }
        }
        tasks=oldTasks.concat(savedTask[0][new Date().getDay()])
        savedTask[0][new Date().getDay()] = [...tasks]
      }
      else{
        // console.log(savedTask[0][new Date().getDay()])
        tasks = savedTask[0][new Date().getDay()]
      }
      
      if(first&&!needUpdate){
        tasks.forEach(element => {
          element.sortValue = this.updateSortValue(element)
          element.repeating = false;
        });
      }
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('tasks', jsonValue)
      // console.log("task:")
      // console.log(tasks)
    }catch(e) {
      
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }

  async savedSetTasks(){
    try {
      // await AsyncStorage.removeItem('setTasks', jsonValue)
      const JsonValue = await AsyncStorage.getItem('firsty')
      var first = JsonValue != null ? JSON.parse(JsonValue) :true;
      const dayJsonValue = await AsyncStorage.getItem('day')
      var day = dayJsonValue != null ? JSON.parse(dayJsonValue) :null;
      var oldTasks=[]
      const savedTaskJsonValue = await AsyncStorage.getItem('setTasks')
      var savedTask = savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;

      if(first){
        day = null;
        savedTask = null;
      }
      
      var needUpdate = false;
      //Set up savedTask
      if(savedTask == null){
        needUpdate = true
        savedTask = [new Array(7),new Array(7)]
        savedTask.forEach(element => {
          for (let i = 0; i < element.length; i++) {
            element[i] = []
          }
        });
      }
      //If it is a new day
      if (day != null&&new Date(new Date().setHours(0,0,0,0)).getTime()!=new Date(day).getTime()) {
        //If it is a new week, set the week's tasks to the weekly ones
        if(new Date(new Date().setHours(0,0,0,0)).getTime()-new Date(day).getTime()>(new Date().getDay()-new Date(day).getDay())*1000*60*60*24){
          savedTask[0]=[...savedTask[1]]
        }

        //Shift times
        savedTask[0][new Date().getDay()].forEach(e => {
          if(e.repeating = true) 
          {
            e.start = new Date().setHours(new Date(e.start).getHours(),new Date(e.start).getMinutes())
            e.end = new Date().setHours(new Date(e.end).getHours(),new Date(e.end).getMinutes())
          }
        });
        setTasks=[...savedTask[0][new Date().getDay()]]
      }
      else{
        // if(this.state.taskIndex>=savedTask[0][new Date().getDay()].length){
        //   console.log(this.state.taskIndex+" "+savedTask[0][new Date().getDay()].length)
        //   this.setState({taskIndex:0})
        // }
        setTasks = savedTask[0][new Date().getDay()]
      }
      
      if(first&&!needUpdate){
        setTasks.forEach(element => {
          element.repeating = false;
        });
      }
      this.sortTimes()
      // this.selectTasks()
      // this.setState({ready:true})
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('setTasks', jsonValue)
      // console.log("setTasks:")
      // console.log(setTasks)
    }catch(e) {
      
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }

  updateSortValue(element){
    return parseInt(((new Date(element.date).getTime())/(1000*60*60))+(6-element.dueImportance)*2*(11-element.importance))+parseInt(element.length)/10
  }
  
  async changeDay(){
    try {
      const dayJsonValue = await AsyncStorage.getItem('day')
      var day = dayJsonValue != null ? JSON.parse(dayJsonValue) :null;
      if (day == null||new Date(new Date().setHours(0,0,0,0)).getTime()!=new Date(day).getTime()){
        day = new Date().setHours(0,0,0,0)
        // this.setState({ready:true})
        const jsonValue = JSON.stringify(day)
        await AsyncStorage.setItem('day', jsonValue)
        const JsonValue = await AsyncStorage.getItem('firsty')
        var first = JsonValue != null ? JSON.parse(JsonValue): null;
        if(first!=null){
          await this.getSyncEvents(false)
        }
      }
    }catch(e) {
      console.log(e)
    }
  }

  async getSelectable() {
    const JsonValue = await AsyncStorage.getItem('selectable')
    const JsonValueT = await AsyncStorage.getItem('sTask')
    selectable =  JsonValue != null ? JSON.parse(JsonValue) : true;
    if(!selectable){
      var test = JsonValueT != null ? JSON.parse(JsonValueT) : null;
    }
    this.setState({selectable:selectable})
    this.setState({sTask:test})
  }

  //Find day and time
  day(time){
    return Math.floor(new Date()/(60*1000*60*24))-Math.floor(new Date(time)/(60*1000*60*24))
  }
  
  time(t){
    return new Date(Math.floor(new Date(t)/(60*1000))*60*1000)
  }
  
  //Update setTasks based on current time
  sortSetTasks() {
    for(var i=0; i<=setTasks.length-1;i++){
      if(this.time(new Date(setTasks[i].end).getTime())<=this.time(Date.now())){
        setTasks.splice(i, 1)
        i--
      }
      else if(this.time(new Date(setTasks[i].start).getTime())<this.time(Date.now())){
        setTasks[i].start=this.time(Date.now())
      }
    }
  }

  //Combine tasks and setTasks
  makeCombined(){
    // console.log("start")
    // console.log(tasks)
    var setIndex = 0;
    var tempAvaliable = 0
    // var splitTask = false
    var tempC = []
    this.sortSetTasks()
    if(tasks.length > 0||setTasks.length>0){
      var time = this.time(Date.now())
      if(this.state.combined.length>0&&this.state.combined[0].sortValue == null&&setTasks.length>0){
        setTasks[0].length = (this.time(setTasks[0].end)-this.time(setTasks[0].start))/(1000*60)
      }
      if(this.state.selectable==false&&tasks.length>0){
        tasks[0].length -= (this.time(new Date())-(this.time(tasks[0].start)))/(1000*60)
        if(tasks[0].length<=0){
          tasks[0].length = 10
        }
      }
      for (var i = 0; i <=tasks.length-1; i++){
        // console.log(this.displayTime(time))
        // console.log(setIndex)
        if (setIndex<setTasks.length-1||(setIndex<setTasks.length&&this.time(time).getTime()<this.time(setTasks[setIndex].start).getTime()))
        { 
          if(this.time(time).getTime()==this.time(setTasks[setIndex].start).getTime())
          {
            //Add set task
            // console.log("Add set task")
            time=setTasks[setIndex].end;
            tempC.push({...setTasks[setIndex]})
            
            setIndex++;
            tempAvaliable += setTasks[setIndex].length
            // console.log(this.displayTime(time))
          }
          if (tasks[i].length<=Math.round((this.time(setTasks[setIndex].start).getTime()-this.time(time).getTime())/(1000*60)))
          {
            //Task length <= time until set task -> add task
            // console.log("Task length <= time until set task -> add task")
            tasks[i].start = time
            tasks[i].end = this.time(new Date(time).getTime()+tasks[i].length*1000*60)
            tempC.push({...tasks[i]})
            tempAvaliable += parseInt(tasks[i].length)
          }
          else if(Math.round((this.time(setTasks[setIndex].start).getTime()-this.time(time).getTime())/(1000*60))>0)
          {
            //Split Task
            // console.log("Split Task")
            tasks[i].start = time
            tasks[i].end = this.time(setTasks[setIndex].start)
            time = tasks[i].end
            tempC.push({...tasks[i]})
            tasks.splice(i+1,0,{...tasks[i]})
            tasks[i+1].length -= (this.time(tasks[i].end)-this.time(tasks[i].start))/(1000*60)
            if(!(tasks[i].name.substring(tasks[i].name.length-8)==" (cont.)")){
              tasks[i+1].name = tasks[i].name + " (cont.)"
            }
            tempAvaliable += (this.time(tasks[i].end)-this.time(tasks[i].start))/(1000*60)
          }
        }
        else if(setTasks.length>0&&setIndex==setTasks.length-1){
          if(this.time(time).getTime()!=this.time(setTasks[setIndex].start).getTime()){
            tempC.push({break:true})
          }
          // console.log("last setTask")
          time=setTasks[setIndex].end;
          tempC.push({...setTasks[setIndex]})
          tempAvaliable += parseInt(setTasks[setIndex].length)
          setIndex++
          
        }
        if(setIndex==setTasks.length){
          //no more set tasks -> Add task
          // console.log("no more set tasks -> Add task")
          tasks[i].start = time
          tasks[i].end = this.time(this.time(time).getTime()+tasks[i].length*1000*60)
          tempC.push({...tasks[i]})
          tempAvaliable += parseInt(tasks[i].length)
        }
        time = tasks[i].end
        if(i>0&&tasks[i].name.substring(tasks[i].name.length-8)==" (cont.)"){
          tasks.splice(i, 1)
          i-=1
        }
      }
      //Add remaining setTasks
      for(setIndex;setIndex<setTasks.length;setIndex++){
        if(this.time(time).getTime()!=this.time(setTasks[setIndex].start).getTime()){
          tempC.push({break:true})
        }
        tempC.push({...setTasks[setIndex]})
        time=setTasks[setIndex].end;
        tempAvaliable += parseInt(setTasks[setIndex].length)
      }
    }
    //Round avaliable time to the nearest whole number
    this.setState({avaliableTime:Math.round(tempAvaliable)})
    // console.log(this.avaliableTime)

    this.setState({combined:tempC})

    return tempC
  }

  renderItem(item){
    var index = item.index
    var drag = item.drag
    var isActive = item.isActive
    item = item.item
    
    if(item.break==null){
      return (
        <ScaleDecorator>
          <TouchableOpacity
            onLongPress={item.sortValue!=null&&item.name.substring(item.name.length-8)!=" (cont.)"?drag:null}
            disabled={isActive}
            onPress={() => item.name.substring(item.name.length-8)!=" (cont.)"?this.setState({taskIndex:index}):this.setState({taskIndex:this.state.combined.findIndex((task)=>task.name==item.name.substring(0,item.name.length-8))})}
          >
            <ListItem bottomDivider containerStyle={this.state.taskIndex==index?{backgroundColor:'#6a99e6'}:null}>
              <ListItem.Content>
                <ListItem.Title style={this.state.taskIndex!=index?{fontWeight: 'bold'}:{fontWeight: 'bold',color:"white"}}>{item.name}</ListItem.Title>
                <ListItem.Subtitle style={this.state.taskIndex==index?{color:"white"}:null}>{this.displayTime(item.start)+' - '+this.displayTime(item.end)}</ListItem.Subtitle>
                {item.sortValue!=null?
                  <ListItem.Subtitle style={this.state.taskIndex==index?{color:"white"}:null}>
                    {'(Due: '+days[new Date(item.date).getDay()]+' '+this.displayDate(item.date)+' '+this.displayTime(item.date)+')'}
                  </ListItem.Subtitle>
                  :null}
              </ListItem.Content>
            </ListItem>
          </TouchableOpacity>
        </ScaleDecorator>
      )
    }
    return(
      <View style={{backgroundColor:'#b5b3b3',height: 30}}/>
    );
  };

  setData(data){
    tasks = data.data.filter((task) => task.sortValue!=null && task.name.substring(task.name.length-8)!= " (cont.)")
    // console.log("setData "+tasks[0].name)
    this.makeCombined()
  }

  //Task controls
  start(){
    if(this.state.combined[this.state.taskIndex].sortValue==null){
      Alert.alert("Events can't be started","They will automatically start once it is the starting time.")
    }
    else if(setTasks.length>0&&this.time(new Date()).getTime()>=this.time(setTasks[0].start).getTime()){
      Alert.alert("Event in progress","You can start this task when the event has finished.")
    }
    else{
      // console.log("in")
      this.setState({selectable:false})
      var selectedTask = this.state.combined[this.state.taskIndex]
      //remove selectedTask from tasks
      tasks.splice(tasks.findIndex((task)=>task.name==selectedTask.name),1)
      this.setState({taskIndex: 0})
      tasks.splice(0, 0, selectedTask)
      tasks[0].start=Date.now()
      this.saveTasks()
      this.saveSelectable()
      this.setState({ready:true, selectable:false})
      // console.log("start"+ tasks[0].name)
      this.makeCombined()
    }
  }

  pause(){
    this.setState({ready:true,selectable:true})
    tasks[0].sortValue=this.updateSortValue(tasks[0])
    this.saveTasks()
    this.removeSelectable()
    this.makeCombined()
  }

  stop(){
    Alert.alert(
      'Are you sure?',
      "This task/event will be removed permanently.",
      [
        { text: 'Cancel',style:"cancel"},
        {text:'Continue',onPress: ()=>this.remove()}
      ],
      { cancelable: true }
      
    )
  }

  renderConfetti(){
    this._confettiView.startConfetti()

    // setTimeout(()=>{
    //   this._confettiView.stopConfetti()
    // },1000)
  }

  remove(){
    this.renderConfetti()
    this.removeSelectable()
    // console.log(this.state.combined[this.state.taskIndex])
    if(this.state.combined[this.state.taskIndex].sortValue!=null){
      //remove this.state.combined[this.state.taskIndex] from tasks
      tasks.splice(tasks.findIndex((task)=>task.name==this.state.combined[this.state.taskIndex].name),1)
    }
    else{
      //remove this.state.combined[this.state.taskIndex] from setTasks
      setTasks.splice(setTasks.findIndex((task)=>task.name==this.state.combined[this.state.taskIndex].name),1)
    }
    this.saveTasks()
    // this.explosion && this.explosion.start()
    this.setState({taskIndex:0,selectable:true, ready:true})
    this.makeCombined()
  }

  //Store selectable(working on task) status
  async saveSelectable(){
    try {
      const jsonValue = JSON.stringify(false)
      await AsyncStorage.setItem('selectable',jsonValue)
      const sTjsonValue = JSON.stringify(tasks[this.state.taskIndex])
      await AsyncStorage.setItem('sTask',sTjsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  async removeSelectable(){
    try {
      const jsonValue = JSON.stringify(true)
      await AsyncStorage.setItem('selectable',jsonValue)
      const sTjsonValue = JSON.stringify(null)
      await AsyncStorage.setItem('sTask',sTjsonValue)
    } catch (e) {
      console.log(e)
    }
  }

  //Save tasks
  async saveTasks(){
    try {
      // console.log("saveTasks1 "+tasks[0].name)
      const savedTaskJsonValue = await AsyncStorage.getItem('tasks')
      var savedTask =  savedTaskJsonValue != null ? JSON.parse(savedTaskJsonValue) :null;
      savedTask[0][new Date().getDay()]= [...tasks]
      const jsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('tasks', jsonValue)

      const savedSetTaskJsonValue = await AsyncStorage.getItem('setTasks')
      var savedTask =  savedSetTaskJsonValue != null ? JSON.parse(savedSetTaskJsonValue) :null;
      savedTask[0][new Date().getDay()]=[...setTasks]
      const setJsonValue = JSON.stringify(savedTask)
      await AsyncStorage.setItem('setTasks', setJsonValue)
      // console.log("saveTasks2 "+tasks[0].name)
      // this.makeCombined()
    } catch (e) {
      console.log(e)
    }
  }

  //Sort tasks
  sortTask(){
    // console.log("hmmmmm")
    // console.log("sortTask "+tasks[0].name)
    var beforeTask = this.state.combined[this.state.taskIndex]

    tasks.sort(function(a, b){return a.sortValue - b.sortValue});
    
    this.saveTasks()
    var newCombined = this.makeCombined()
    
    this.setState({taskIndex: newCombined.findIndex((task)=>task.name==beforeTask.name)})
  }

  sortTimes(){
    setTasks.sort(function(a, b){return new Date(a.start).getTime() - new Date(b.start).getTime()});
    // console.log("sortTimes "+tasks[0].name)
    this.makeCombined()
  }


  // selectTasks(){
  //   if(this.state.sTask!=null){
  //     tasks.splice(tasks.findIndex((element)=>element.name==this.state.sTask.name),1)
  //     tasks.splice(0,0,this.state.sTask);
  //     this.setState({sTask:null});
  //   }
  // }

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
    if(this.state.combined.length > 0){
      return this.state.combined[this.state.taskIndex].name
    }
    return 'Add a Task'
  }

  //Editing
  async editTask(){
    try {
      this.saveTasks()
      const jsonValue = JSON.stringify(this.state.combined[this.state.taskIndex].name)
      await AsyncStorage.setItem('editName', jsonValue)
      // console.log(this.state.combined[this.state.taskIndex])
      if(this.state.combined[this.state.taskIndex].sortValue!=undefined&&this.state.combined[this.state.taskIndex].sortValue!=null){
        this.props.navigation.navigate('AddTask')
      }
      else{
        this.props.navigation.navigate('AddWorkTime')
      }
    } catch (e) {
      Alert.alert('Error getting task edit info!','Failed to get task edit info! Please try again.')
      console.log(e)
    }
  }


  //Find time left
  findavailableTime(){
    return <Text>{Math.floor(this.state.avaliableTime/60)} hours and {this.state.avaliableTime%60} minutes of work left</Text>
   
  }

  resetOrder(){
    var original = [...tasks]
    var temp = tasks.sort(function(a, b){return a.sortValue - b.sortValue});
    tasks = [...original]
    // this.saveTasks()
    //Check if tasks and temp are identical arrays
    return JSON.stringify(tasks)!=JSON.stringify(temp)
  }

  render(){
    const { navigate } = this.props.navigation;
    if(!this.state.ready){
      return null
    }
    return (
      
      <SafeAreaView style={styles.container}>
        {/* {this.state.renderConfetti?
          // <ConfettiCannon
          //   count={200}
          //   origin={{x: -20, y: 0}}
          //   autoStart={false}
          //   ref={ref => (this.explosion = ref)}/>
          // <Confetti width height recycle={false} onConfettiComplete={() => this.setState({renderConfetti: false})}/>
        :null} */}
        <Overlay isVisible={this.state.firstTime} onBackdropPress={()=>this.setState({firstTime:false})}>
          <SafeAreaView style = {styles.container}>
        
            <ScrollView style={{height:'100%'}}>
              {/* <View style={{flex:1,justifyContent:'center'}}> */}
            <Text style={{ fontSize: 28, alignSelf: 'center' }}>Welcome to CheckMate!</Text>
            <Text style={{fontSize:23, alignSelf: 'center'}}>Instructions:{"\n"}</Text>
            <Text style={{fontSize:17,padding:5}}>
  1. Add tasks and events. Tasks can be done at any time. Events can only be done at a preset time.{"\n\n"}
  2. Fill in the parameters for your task or event. {"\n\n"}
  3. Repeat steps 1 and 2.{"\n\n"}
  4. Start, pause, finish, or edit the selected task or event using the buttons on the bottom of the page.{"\n\n"}
  5. Be productive!{"\n\n"}</Text>
            <Button
              containerStyle = {{justifyContent:"flex-end"}}
              title = "Close"
              raised = {true}
              onPress={()=>this.setState({firstTime:false,ready:true})}
            />
            {/* </View> */}
            </ScrollView>
          </SafeAreaView>
        </Overlay>

        <View style={{flex:9}}>
        <View style={styles.top}> 
          {/* Adding Display */}
          <View>
            <Icon 
              name="question-circle" 
              type='font-awesome-5' 
              size = {25}
              onPress={()=>this.setState({firstTime:true})}
              solid={true}
            />
          </View>
          <View>
            {!this.state.error?
              <Icon 
                name="sync" 
                type='material' 
                size = {30}
                // color='red'
                onPress={()=>this.reviewEvents()}
                onLongPress={()=>this.getSyncEvents(true)}
              />
            :<Icon 
                name="sync-problem" 
                type='material' 
                size = {30}
                // color='red'
                onPress={()=>{this.reviewEvents()}}
                onLongPress={()=>this.getSyncEvents(true)}
              />
      }
            {/* <Badge
              status="warning"
              containerStyle={{ position: 'absolute', top: 0, right: 0 }}
            /> */}
          </View>
        </View>
        {/* <View style={{flex:10, marginHorizontal:20}}> */}
          <DraggableFlatList
            containerStyle = {{flex:10, marginHorizontal:20}}
            // debug={true}
            data={this.state.combined}
            onDragEnd={(data) => this.setData(data)}
            keyExtractor={(item,index) => {item.name!=null?item.name+index:index}}
            renderItem={(item)=>this.renderItem(item)}
          /> 
        {/* </View> */}
        {this.resetOrder()?
          <View style={{marginHorizontal:20}}>
            {/* Reset order display */}
            
              <View style={{padding:8}}>
                {/* <TouchableOpacity onPress={() => this.sortTask()} style={[styles.button]}>
                  <Text style={{ fontSize: 20, color: '#fff' }}>Reset Order</Text>
                </TouchableOpacity> */}
                <Button
                  title='Optimize Order'
                  buttonStyle={{backgroundColor: '#1c247a'}}
                  onPress={() => this.sortTask()}
                />
              </View>
          </View>
        :null}
        <SpeedDial
          isOpen={this.state.open}
          icon={{ name: 'add', color: '#fff' }}
          openIcon={{ name: 'close', color: '#fff' }}
          onOpen={() => this.setState({ open: !this.state.open })}
          onClose={() => this.setState({ open: !this.state.open })}
          color='#6a99e6'
          //make overlay transparent
          overlayColor='rgba(0,0,0,0)'
          transitionDuration={40}

        >
          <Tooltip  
            toggleAction="onLongPress" 
            onOpen = {()=>console.log("opened")} 
            height = {60}
            popover={<Text>Tasks can be done at any time</Text>}
          >
            <SpeedDial.Action
              icon={{ name: 'check-square', color: '#fff', type: "feather" }}
              title="Task"
              onPress={() => {this.setState({ open: false });navigate('AddTask')}}
              color='#6a99e6'
            />
          </Tooltip>
          <Tooltip  
            toggleAction="onLongPress" 
            onOpen = {()=>console.log("opened")} 
            height = {60}
            popover={<Text>Events are done at a preset time</Text>}
          >
            <SpeedDial.Action
              icon={{ name: 'clock', color: '#fff', type: "feather" }}
              title="Event"
              onPress={() => {this.setState({ open: false });navigate('AddWorkTime')}}
              color='#6a99e6'
            />
          </Tooltip>
        </SpeedDial>


        {/* Task in progress overlay */}
        {this.state.selectable==false? <View style={styles.grayOverlay}/>:null}
        </View>
        <Divider style={{ backgroundColor: 'gray' }} />

        {/* Task controls display */}
        <View style={styles.selectView}>
          {/* <View style={styles.inSelection}>
            <Text style={{ fontSize: 20}}>{this.taskName()}</Text>
            <Icon color={this.state.selectable==false||combined.length==0?'gray':'black'} name="pencil-alt" type='font-awesome-5' onPress={this.state.selectable==false||combined.length==0?null:() => this.editTask()}/>
          </View> */}
          <View style={styles.inSelection}>
            {this.state.selectable==true?
              <Icon name="play-circle" 
                type='font-awesome' 
                size={30} 
                // color={'white'} 
                onPress={() => this.start()}
                disabled={this.state.combined.length<0}
              />
             :<Icon name="pause-circle" 
                size={30} 
                type='font-awesome' 
                // color={"white"} 
                onPress={() => this.pause()}
              />
            }
            <Icon name="stop-circle" type='font-awesome' size={30} onPress={this.state.combined.length>0?() => this.stop():null}/>
            <Icon  name="pencil-circle" type='material-community' size={30} onPress={this.state.selectable==false||this.state.combined.length==0?null:() => this.editTask()}/>
          </View>
          <View style={{flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around',padding:3}}>
            {this.findavailableTime()}
          </View>
        </View>
        <Confetti confettiCount={20} size={2} timeout={0} duration={1200} ref={(node) => this._confettiView = node}/>
      </SafeAreaView>
    );
    
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#3A3B3C',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },
  top: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    flex: 0.5,
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
    margin: 5,
    borderRadius: 10,
    backgroundColor: "#152075",
    padding: 5,
    borderColor:'#a6a6a6',
    borderWidth: 2,
  },
  selectView: {
    flex: 1,
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
