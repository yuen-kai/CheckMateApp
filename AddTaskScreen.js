import { StatusBar } from 'expo-status-bar';
import React, {Component} from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Platform,Alert} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Slider} from 'react-native-elements'



var tasks = []


export default class AddTaskScreen extends React.Component {
  editIndex
  selectedTask
  edit = false
  state = {
    date: new Date(),
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
  }

  componentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
			this.getData();
  
		});
  }

  onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    this.setState({show: Platform.OS === 'ios'});
    this.setState({date:currentDate});
  };

  showMode(currentMode) {
    this.setState({show:true});
    
    this.setState({mode:currentMode});
  };

  showDatepicker() {
    this.showMode('date');
  };

  showTimepicker() {
    this.showMode('time');
  };

  getData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('tasks')
        tasks =  jsonValue != null ? JSON.parse(jsonValue) : null;
        if(tasks == null){
          tasks=[]
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
      const jsonValue = await AsyncStorage.getItem('editIndex')
      
      this.editIndex =  jsonValue != null ? JSON.parse(jsonValue) : null;
      if(this.editIndex != null){
        this.selectedTask = tasks[this.editIndex]
        this.edit = true
        this.setState({date:new Date(new Date(this.selectedTask.date).getTime()),name:this.selectedTask.name,importance:this.selectedTask.importance,length:this.selectedTask.length,color:'#fff',dueImportance:this.selectedTask.dueImportance})
        await AsyncStorage.removeItem('editIndex')
      }
    } catch(e) {
      Alert.alert('Failed to get edit info!','Failed to get edit info! Please try again.')
      console.log(e)
    }
 }

  sortTask(){
    for(var i=tasks.length-1; i>=0; i--) {
      
      if(tasks[i].sortValue<=this.state.sortValue){
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

  displayDate(date) {
    var month = new Date(date).getMonth()+1
    var day = new Date(date).getDate()
    return month+"/"+day
  }

  handleSave = async () => {
    var sameName = false
    await this.setState({sortValue: new Date(this.state.date).getTime()-((((this.state.importance*8)/100)*(this.state.length))/((6-this.state.dueImportance)*30))*24*60*60*1000})
    this.selectedTask = {name:this.state.name, sortValue:this.state.sortValue, length: this.state.length, date: this.state.date, start:this.state.start, end:this.state.end, importance:this.state.importance,dueImportance:this.state.dueImportance}
    if(this.edit == false){
      tasks.forEach(element => {
        if(element.name==this.selectedTask.name){
          sameName = true
        }
      });
    }
    
    if(this.state.name==""||this.state.importance==0||this.state.length==0){
      Alert.alert('Invalid Task','Not all parameters have been filled out!')
    }
    else if(sameName==true){
      Alert.alert('Name Used','Name already used. Please select a new name.')
    }
    else{
      
      
      //add new task to list of existing tasks
      if(this.edit==true){
        
        tasks.splice(this.editIndex,1)
      }
      tasks.splice(this.sortTask(),0,this.selectedTask)
      
      //save data
      try {
        const jsonValue = JSON.stringify(tasks)
        await AsyncStorage.setItem('tasks', jsonValue)
      } catch (e) {
        console.log(e)
      }
      this.props.navigation.navigate('Home');
      }
  };


  render(){
    if(!this.state.ready){
      return null
    }
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{alignItems: 'center'}}>
          <View style={{padding:4,alignItems: 'center'}}>
          <Text style={{ fontSize: 20, padding:3}}>Name:</Text>
          <TextInput
            style={styles.textInput}
            placeholder = {"Complete project proposal"}
            onChangeText={name => this.setState({name})}
            value = {this.state.name}
          />
          </View>
          <View style={{ padding:4, alignItems: 'stretch', justifyContent: 'center' }}>        
            <Text style={{ fontSize: 20,padding:3}}>Importance: {this.state.importance}</Text>
            <Slider
            thumbStyle={{width:30,height:30}}
              value={this.state.importance}
              onValueChange={(importance) => this.setState({ importance })}
              minimumValue={1}
              maximumValue={10}
              allowTouchTrack={true}
              step={1}
            />
          </View>
          <View style={{padding:4,alignItems: 'center'}}>
            <Text style={{ fontSize: 20,padding:3}}>Length(min):</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder = {"30"}
              keyboardType = "numeric"
              onChangeText={length => this.setState({length:length})}
              value = {this.state.length}
            />
          </View>
          <View style={{padding:4,alignItems:'center'}}>
            <Text style={{ fontSize: 20,padding:3}}>{'Due Date: '+this.displayDate(this.state.date)+' '+this.displayTime(this.state.date)}</Text>
            <View style={{flexDirection: 'row',pading:3,alignSelf:'stretch',justifyContent:'space-around'}}>
              <View style={{padding:3}}>
              <TouchableOpacity
                onPress={() => this.showDatepicker()}
                style={styles.button}>
                <Text style={{ fontSize: 20, color: '#fff' }}>Select Day</Text>
              </TouchableOpacity>
              </View>
              <View style={{padding:3}}>
              <TouchableOpacity
                onPress={() => this.showTimepicker()}
                style={styles.button}>
                <Text style={{ fontSize: 20, color: '#fff' }}>Select Time</Text>
              </TouchableOpacity>
              </View>
            </View>
            {this.state.show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={this.state.date}
              mode={this.state.mode}
              // is24Hour={true}
              display="default"
              onChange={this.onChange}
            />
            )}
          </View>
          <View style={{padding:4, alignItems: 'stretch', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20,padding:3}}>Due Date Importance: {this.state.dueImportance}</Text>
            <Slider
            thumbStyle={{width:30,height:30}}
              value={this.state.dueImportance}
              onValueChange={(dueImportance) => this.setState({ dueImportance })}
              minimumValue={1}
              maximumValue={5}
              allowTouchTrack={true}
              step={1}
            />
          </View>
          <TouchableOpacity
            onPress={() => this.handleSave()}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Save Task</Text>
          </TouchableOpacity>
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
    justifyContent: 'flex-start',
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    position: 'absolute',
    top: 3,
  },
  textInput: {
    height: 40,
    width: 200, 
    padding:5,
    borderColor: 'gray', 
    borderWidth: 1,
    backgroundColor: '#ffffff',
  }
});