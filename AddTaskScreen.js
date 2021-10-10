import { StatusBar } from 'expo-status-bar';
import React, {Component} from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Platform,Alert,KeyboardAvoidingView} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Slider,Input,CheckBox,Avatar} from 'react-native-elements'

var savedTasks


export default class AddTaskScreen extends React.Component {
  editName
  selectedTask
  edit = false
  days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  state = {
    daysUsed:[false,false,false,false,false,false,false],
    date: new Date().setHours(24,0,0,0),
    mode: 'date',
    show: false,
    ready: false,
    name: "",
    importance: 5,
    dueImportance: 1,
    length: 0,
    sortValue: 0,
    start: new Date(),
    end: new Date(),
    weekly:false,
    repeating: false,
  }

  //Get data
  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
			this.getData();
  
		});
  }

  getData = async () => {
    let change = [...this.state.daysUsed]
    change.splice(new Date().getDay(), 1,true)
    this.setState({daysUsed:change})
    try {
      const jsonValue = await AsyncStorage.getItem('tasks')
      savedTasks =  jsonValue != null ? JSON.parse(jsonValue) : null;
      this.editInfo()
      
    } catch(e) {
      Alert.alert('Failed to get data!','Failed to get data! Please try again.')
      console.log(e)
    }
  }

  editInfo = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('editName')
      this.editName = jsonValue != null ? JSON.parse(jsonValue) :null;
      if(this.editName != null){
        let change = [...this.state.daysUsed]
        this.selectedTask = savedTasks[0][new Date().getDay()][savedTasks[0][new Date().getDay()].findIndex((task) =>task.name == this.editName)]
        this.edit = true
        this.setState({date:new Date(new Date(this.selectedTask.date).getTime()),name:this.selectedTask.name,importance:this.selectedTask.importance,length:this.selectedTask.length,dueImportance:this.selectedTask.dueImportance,repeating:this.selectedTask.repeating})
        await AsyncStorage.removeItem('editName')
        for(var i=0;i<=this.state.daysUsed.length-1;i++){
          if(savedTasks[0][i].findIndex((task) =>task.name == this.editName)!=-1)
          {
            change.splice(i, 1,true)
          }
        };
        if(savedTasks[1][new Date().getDay()].findIndex((task) =>task.name == this.editName)!=-1){
          this.setState({weekly:true})
        }
        this.setState({daysUsed:change})
      }
    } catch(e) {
      Alert.alert('Failed to get edit info!','Failed to get edit info! Please try again.')
      console.log(e)
    }
    this.setState({ready:true})
 }

 //Date picker
  showDatepicker() {
    if(this.state.show==true){
      this.setState({show: false});
    }
    else{
      this.showMode('date');
    }
    
  };

  showTimepicker() {
    if(this.state.show==true){
      this.setState({show: false});
    }
    else{
    this.showMode('time');
    }
  };
  
  showMode(currentMode) {
    this.setState({show:true});
    this.setState({mode:currentMode});
  };

  onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    this.setState({show: Platform.OS === 'ios'});
    this.setState({date:currentDate});
  };

  //Sort task into optimal position
  sortTask(tasks){
    for(var i=tasks.length-1; i>=0; i--) {
      
      if(tasks[i].sortValue<=this.state.sortValue){
        return i+1
      }
    }
    return 0
  }

  //Display Time/Date
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

  //Update days used
  changeDay(i){
    let change = [...this.state.daysUsed]
    change.splice(i, 1,!this.state.daysUsed[i])
    this.setState({daysUsed:change})
  }

  // Saving/Processing
  handleSave = async () => {
    var sameName = false
    var count = 0

    //Set parameters of the task
    this.state.daysUsed.forEach(element => {
      if(element){
        count++
      }
    });
    if(count>=2){
      this.setState({repeating:true})
    }

    await this.setState({sortValue: new Date(this.state.date).getTime()-((((this.state.importance*8)/100)*(this.state.length))/((6-this.state.dueImportance)*30))*24*60*60*1000})
    var d = new Date().setHours(0,0,0,0)
    var dueIncrease  = new Date(this.state.date).getTime()-new Date(d).getTime();
    this.selectedTask = {name:this.state.name, sortValue:this.state.sortValue, length: this.state.length, date: this.state.date, start:this.state.start, end:this.state.end, importance:this.state.importance,dueImportance:this.state.dueImportance,repeating:this.state.repeating,dueIncrease:dueIncrease}

    if(this.edit == false){
      for (let i = 0; i < this.state.daysUsed.length; i++) {
        if(this.state.daysUsed[i])
        {
          savedTasks[0][i].forEach(element => {
            if(element.name==this.selectedTask.name){
              sameName = true
            }
          });
          if(this.state.weekly)
          {
            savedTasks[1][i].forEach(element => {
              if(element.name==this.selectedTask.name){
                sameName = true
              }
            });
          }
        }
      }
    }
    
    //Check if valid
    if(this.state.name==""||this.state.importance==0||this.state.length==0){
      Alert.alert('Invalid Task','Not all fields have been filled out!')
    }
    else if(sameName==true){
      Alert.alert('Name Used','Name already used. Please select a new name.')
    }
    else{
      //Put in task for all the days used
      for(var i=0;i<=this.state.daysUsed.length-1;i++){
        if(this.state.daysUsed[i]==true){
          if(this.edit==true){
            savedTasks[0][i].splice(savedTasks[0][i].findIndex((task) =>task.name == this.editName),1)
          }
          savedTasks[0][i].splice(this.sortTask(savedTasks[0][i]),0,this.selectedTask)
          if(this.state.weekly==true){
            if(this.edit==true){
              savedTasks[1][i].splice(savedTasks[1][i].findIndex((task) =>task.name == this.editName),1)
            }
            savedTasks[1][i].splice(this.sortTask(savedTasks[1][i]),0,this.selectedTask)
          }
        }
      };

      //save data
      try {
        const jsonValue = JSON.stringify(savedTasks)
        await AsyncStorage.setItem('tasks', jsonValue)
      } catch (e) {
        console.log(e)
      }

      //Go back to home page
      this.props.navigation.navigate('Home');
    }
  };


  render(){
    if(!this.state.ready){
      return null
    }
    return (
      <View style={styles.container}>
        <ScrollView style={{padding:20}} contentContainerStyle={{height:'100%'}}>
          <View style={{flex:1}} >
          <View style={styles.section}>
          <Text style={{ fontSize: 17, padding:3}}>Name:</Text>
          <Input
              placeholder='Practice Piano'
              renderErrorMessage={false}
              onChangeText={name => this.setState({name})}
              value = {this.state.name}
            />
          </View>
          <View style={styles.section}>        
            <Text style={{ fontSize: 17,padding:3}}>Importance:</Text>
            <View style={{flexGrow:1,marginLeft:20}}>
              <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={{ fontSize: 13}}>Least</Text>
              <Text style={{ fontSize: 13}}>Most</Text>
              </View>
            <Slider
            thumbStyle={{width:25,height:25}}
            trackStyle={{width:'100%'}}
              value={this.state.importance}
              onValueChange={(importance) => this.setState({ importance })}
              minimumValue={1}
              maximumValue={10}
              thumbTintColor='#152075'
              thumbProps={{
                children: (
                  <Text style={{ fontSize: 15,padding:3,alignSelf:'center',color: '#fff'}}>{this.state.importance}</Text>
                ),
              }}
              
              allowTouchTrack={true}
              step={1}
            />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={{ fontSize: 17,padding:3}}>Length (min):</Text>
            <Input
              placeholder='30'
              renderErrorMessage={false}
              keyboardType = "numeric"
              onChangeText={length => this.setState({length})}
              value = {this.state.length!=0?this.state.length.toString():null}
            />
          </View>
          <View style={styles.section}>
            <Text style={{ fontSize: 17,padding:3}}>Due Date:</Text>
            <View style={{flexDirection: 'row',pading:3}}>
              <View style={{padding:3}}>
              <TouchableOpacity
                onPress={() => this.showDatepicker()}
                style={styles.button}>
                <Text style={{ fontSize: 18, color: '#fff' }}>{this.displayDate(this.state.date)}</Text>
              </TouchableOpacity>
              </View>
              <View style={{padding:3}}>
              <TouchableOpacity
                onPress={() => this.showTimepicker()}
                style={styles.button}>
                <Text style={{ fontSize: 18, color: '#fff' }}>{this.displayTime(this.state.date)}</Text>
              </TouchableOpacity>
              </View>
            </View>
            
          </View>
          {this.state.show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={this.state.date}
              mode={this.state.mode}
              display="default"
              onChange={this.onChange}
              style={{width:'100%'}}
            />
            )}
          <View style={styles.section}>
            <Text style={{ fontSize: 17,padding:3}}>Due Date{'\n'}Importance:</Text>
            <View style={{flexGrow:1,marginLeft:20}}>
              <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={{ fontSize: 13}}>Least</Text>
              <Text style={{ fontSize: 13}}>Most</Text>
              </View>
            <Slider
              style={{flexGrow:1}}
              thumbStyle={{width:25,height:25}}
              value={this.state.dueImportance}
              onValueChange={(dueImportance) => this.setState({ dueImportance })}
              minimumValue={1}
              maximumValue={5}
              thumbTintColor='#152075'
              thumbProps={{
                children: (
                  <Text style={{ fontSize: 15,padding:3,alignSelf:'center',color: '#fff' }}>{this.state.dueImportance}</Text>
                ),
              }}
              trackStyle={{width:'100%'}}
              allowTouchTrack={true}
              step={1}
            />
            </View>
          </View>
          <Text style={{ fontSize: 17, padding:3 }}>Use for:</Text>
        <CheckBox
            title='Weekly'
            checked={this.state.weekly}
            onPress={() => this.setState({weekly: !this.state.weekly})}
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
      
          <TouchableOpacity
            onPress={() => this.handleSave()}
            style={[styles.button,{bottom:0,right:0,alignSelf:'flex-end',position:'absolute',paddingVertical:0}]}>
            <Text style={{ fontSize: 18, color: '#fff', padding:3 }}>Save</Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
        </View>
      
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 4,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: "#152075",
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical:5
  },
  section:{
    // backgroundColor:'blue',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '3%'
  },
});
