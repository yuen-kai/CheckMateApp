import { StatusBar } from 'expo-status-bar';
import React, {Component} from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Button, Platform} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    importance: 0,
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
        alert(e)
      }
      
   }

  editInfo = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('editIndex')
      
      this.editIndex =  jsonValue != null ? JSON.parse(jsonValue) : null;
      if(this.editIndex != null){
        this.selectedTask = tasks[this.editIndex]
        this.edit = true
        this.setState({date:new Date(new Date(this.selectedTask.date).getTime()),name:this.selectedTask.name,importance:this.selectedTask.importance,length:this.selectedTask.length,color:'#fff'})
        await AsyncStorage.removeItem('editIndex')
      }
    } catch(e) {
      alert(e)
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
    await this.setState({sortValue: new Date(this.state.date).getTime()-(((this.state.importance*8)/100)*(this.state.length*1000*60))})
    this.selectedTask = {name:this.state.name, sortValue:this.state.sortValue, length: this.state.length, date: this.state.date, start:this.state.start, end:this.state.end, importance:this.state.importance}
    if(this.edit == false){
      tasks.forEach(element => {
        if(element.name==this.selectedTask.name){
          sameName = true
        }
      });
    }
    
    if(this.state.name==""||this.state.importance==0||this.state.length==0){
      alert('Not all parameters have been filled out!')}
    else if(sameName==true){
      alert('Name already used. Please select a new name.')
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
        alert(e)
      }
      this.props.navigation.navigate('Home');
      }
  };


  render(){
    if(!this.state.ready){
      return null
    }
    return (
      <SafeAreaView style={styles.container}>
        
        <Text style={{ fontSize: 20, color: '#fff'}}>Name:</Text>
        <TextInput
          style={styles.textInput}
          placeholder = {"Complete project proposal"}
          onChangeText={name => this.setState({name})}
          value = {this.state.name}
        />
        <Text style={{ fontSize: 20, color: '#fff'}}>Importance:</Text>
        <RNPickerSelect
            placeholder={{ label: "Select the importance...", value: null }}
            
            style={pickerSelectStyles}
            items={[
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
                { label: '5', value: 5 },
                { label: '6', value: 6 },
                { label: '7', value: 7 },
                { label: '8', value: 8 },
                { label: '9', value: 9 },
                { label: '10', value: 10 }
            ]}
            onValueChange={importance=>this.setState({importance:importance})}
            value = {this.state.importance}
        />
        <View style={{flex: 1,alignItems: 'center'}}>
          <Text style={{ fontSize: 20, color: '#fff'}}>Length(min):</Text>
          <TextInput
            style={styles.textInput}
            placeholder = {"30"}
            keyboardType = "numeric"
            onChangeText={length => this.setState({length:length})}
            value = {this.state.length}
            
          />
        </View>
        <View style={{flex: 1,alignItems: 'center'}}>
          <Text style={{ fontSize: 20, color: '#fff'}}>{'Due Date: '+this.displayDate(this.state.date)+' '+this.displayTime(this.state.date)}</Text>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              onPress={() => this.showDatepicker()}
              style={styles.button}>
              <Text style={{ fontSize: 20, color: '#fff' }}>Select Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.showTimepicker()}
              style={styles.button}>
              <Text style={{ fontSize: 20, color: '#fff' }}>Select Time</Text>
            </TouchableOpacity>
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
        <View style={{flex: 1}}>
          <TouchableOpacity
            onPress={() => this.handleSave()}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Save Task</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 4,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: "blue",
    padding: 20,
    borderRadius: 5,
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
    borderColor: 'gray', 
    borderWidth: 1,
    backgroundColor: '#ffffff',
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'black',
    borderRadius: 8,
    backgroundColor: 'white',
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'black',
    borderRadius: 8,
    backgroundColor: 'white',
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});