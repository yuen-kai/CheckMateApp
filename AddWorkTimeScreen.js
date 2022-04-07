import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,Alert, ScrollView} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Icon,Tooltip,Avatar,CheckBox,Input} from 'react-native-elements'
import ThemedListItem from 'react-native-elements/dist/list/ListItem';

var workTimes


export default class AddWorkTimeScreen extends React.Component {
  editName
  selectedTask
  edit = false
  days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];
  state = {
    daysUsed:[false,false,false,false,false,false,false],
    startShow: false,
    endShow: false,
    ready: false,
    start: new Date(),
    end: new Date(),
    weekly:false,
    repeating: false,
    editMode: true,
  }

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
      const jsonValue = await AsyncStorage.getItem('setTasks')
      workTimes =  jsonValue != null ? JSON.parse(jsonValue) : null;
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
        this.selectedTask = workTimes[0][new Date().getDay()][workTimes[0][new Date().getDay()].findIndex((task) =>task.name == this.editName)]
        this.edit = true
        this.setState({name:this.editName,start:new Date(new Date(this.selectedTask.start).getTime()),end:new Date(new Date(this.selectedTask.end).getTime()),repeating:this.selectedTask.repeating})
        await AsyncStorage.removeItem('editName')
        for(var i=0;i<=this.state.daysUsed.length-1;i++){
          if(workTimes[0][i].findIndex((task) =>task.name == this.editName)!=-1)
          {
            change.splice(i, 1,true)
          }
        };
        if(workTimes[1][new Date().getDay()].findIndex((task) =>task.name == this.editName)!=-1){
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

  roundTime(time){
    return (Math.floor((new Date(time).getTime())/(60*1000)) * (60*1000))
  }

  onStartChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    this.setState({startShow: Platform.OS === 'ios'});
    this.setState({start:currentDate});
  };

  onEndChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    this.setState({endShow: Platform.OS === 'ios'});
    this.setState({end:currentDate});
  };
  
  showTimepicker(type) {
    if(this.state.startShow==true){
      this.setState({startShow: false});
    }
    else if(this.state.endShow==true){
      this.setState({endShow: false});
    }
    else if(type=='start'){
      this.setState({startShow:true});
    }
    else{
      this.setState({endShow:true});
    }
  };

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

  changeDay(i){
    let change = [...this.state.daysUsed]
    change.splice(i, 1,!this.state.daysUsed[i])
    this.setState({daysUsed:change})
  }

  handleSave = async () => {
    var sameName = false
    this.isRepeating();

    this.selectedTask = {name:this.state.name,start:this.state.start, end:this.state.end,repeating:this.state.repeating}

    if(this.edit == false){
      for (let i = 0; i < this.state.daysUsed.length; i++) {
        if(this.state.daysUsed[i])
        {
          workTimes[0][i].forEach(element => {
            if(element.name==this.selectedTask.name){
              sameName = true
            }
          });
          if(this.state.weekly)
          {
            workTimes[1][i].forEach(element => {
              if(element.name==this.selectedTask.name){
                sameName = true
              }
            });
          }
        }
      }
    }
    
    //Check if valid
    if(this.state.name==""){
      Alert.alert('Empty Name','Please enter a name.')
    }
    else if(!(this.selectedTask.start!=null&&this.selectedTask.end!=null&&this.roundTime(this.selectedTask.end) - this.roundTime(this.selectedTask.start)>=1)){
      Alert.alert("Invalid Time","The times that you have set for this task are invalid.")
    }
    else if(sameName==true){
      Alert.alert('Name Used','Name already used. Please select a new name.')
    }
    else{
      var overlap = false
      var accept = true
      workTimes.forEach(element => {
        if((new Date(element.start).getTime()>=new Date(this.selectedTask.start).getTime()&&new Date(element.start).getTime()<new Date(this.selectedTask.end).getTime())||(new Date(element.end).getTime()>new Date(this.selectedTask.start).getTime()&&new Date(element.end).getTime()<=new Date(this.selectedTask.end).getTime())){
          overlap = true
        }
      });
      if(overlap){
        Alert.alert(
          'Overlapping Task',
          "This task's times overlaps with the times of another task. If you do not do anything, the task that starts later will automatically be cut short or even removed.",
          [
            {
              text: "Cancel",
              onPress: () => accept = false,
              style: "cancel"
            },
            { text: "Continue", onPress: () => accept = true }
          ]
        );
      }
      if(accept){
        //Put in task for all the days used
        for(var i=0;i<=this.state.daysUsed.length-1;i++){
          if(this.state.daysUsed[i]==true){
            if(this.edit==true){
              workTimes[0][i].splice(workTimes[0][i].findIndex((task) =>task.name == this.editName),1)
            }
            if(this.state.editMode==true){
              workTimes[0][i].push(this.selectedTask)
            }
            if(this.state.weekly==true){
              if(this.edit==true){
                workTimes[1][i].splice(workTimes[1][i].findIndex((task) =>task.name == this.editName),1)
              }
              if(this.state.editMode==true)
              {
                workTimes[1][i].push(this.selectedTask)
              }
            }
          }
        };

        //save data
        try {
          const jsonValue = JSON.stringify(workTimes)
          await AsyncStorage.setItem('setTasks', jsonValue)
        } catch (e) {
          console.log(e)
        }

        //Go back to home page
        this.props.navigation.navigate('Home');
      }
    }
  };
  
  //Set repeating
  isRepeating() {
    var count = 0;

    this.state.daysUsed.forEach(element => {
      if (element) {
        count++;
      }
    });

    if(this.setState.weekly||count >= 2) {
      this.setState({ repeating: true, ready: true });
    }
    else{
      this.setState({ repeating: false, ready: true});
    }
  }

  render(){
    if(!this.state.ready){
      return null
    }
    return(
      
    <View style={styles.container}>
      <ScrollView style={{padding:10}}>      
        <Text style={{ fontSize: 20, padding:4}}>{this.days[new Date().getDay()]}, {this.monthNames[new Date().getMonth()]} {new Date().getDate()}</Text>
        <View style={{flexDirection: 'column'}}>
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
            <TouchableOpacity style={styles.workButton} onPress={() => this.showTimepicker('start')}>
              <Text style={{ fontSize: 17,  color: '#fff' }}>{this.state.start!=null?this.displayTime(this.state.start):"Start"}</Text>
            </TouchableOpacity>
            <Text style={{flex: 1,fontSize: 18,}}>to</Text>
            <TouchableOpacity style={styles.workButton} onPress={() => this.showTimepicker('end')}>
              <Text style={{ fontSize: 17, color: '#fff'}}>{this.state.end!=null?this.displayTime(this.state.end):'End'}</Text>
            </TouchableOpacity>
            <View style={{flex: 1}}/>
          </View>
          {/* start picker */}
          {this.state.startShow && (
          <DateTimePicker
            testID="startDateTimePicker"
            value={this.state.start}
            mode={"time"}
            display="default"
            onChange={this.onStartChange}
          />)}

          {/* end picker */}
          {this.state.endShow && (
          <DateTimePicker
            testID="endDateTimePicker"
            value={this.state.end}
            mode={"time"}
            display="default"
            onChange={this.onEndChange}
          />)}

          {this.state.start!=null&&this.state.end!=null&&this.roundTime(this.state.end) - this.roundTime(this.state.start)<=0?<Text style={{ fontSize: 15, color: 'red' }}>You need at least 1 minute of work time!</Text>
            :null
          }
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
},
section:{
  // backgroundColor:'blue',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginVertical: '3%'
},
});