import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

var tasks = [];
var workTimes = [];

export default class HomeScreen extends React.Component {

  state = {
    ready: false,
  };


  onComponentDidMount(){
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
			this.getData();  
		});
  }

  getData = async () => {
    try {
      const taskJsonValue = await AsyncStorage.getItem('tasks')
      if(taskJsonValue != null){
        tasks = JSON.parse(taskJsonValue)
      }
      const workTimeJsonValue = await AsyncStorage.getItem('workTimes')
      if(workTimeJsonValue != null){
        workTimes = JSON.parse(workTimeJsonValue)
      }
      this.setState({ready:true})
    } catch(e) {
      alert(e)
    }
  } 

  // sortTasks(){
  //   for(var i=1; i<tasks.length; i++) {
  //     tasks.splice(i, 1)
  //     for(var j=i-1; j>=0; j--) {
  //       // if(tasks[j].)
  //     }
  //   }
  // }

  sortWorkTimes(){

  }

  async removeKey(key) {
    try {
      await AsyncStorage.setItem(key,null)
      if(key=='tasks'){
        tasks = []
      }
      else{
        workTimes = []
      }
    } catch (e) {
      console.log(e)
    }
  }


  render(){
    const { navigate } = this.props.navigation;
    if(!this.state.ready==false){
      return null
    }
    return (
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() =>navigate('AddWorkTime')}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Add WorkTime</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>navigate('AddTask')}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => this.removeKey('workTimes')}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Clear WorkTimes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => this.removeKey('tasks')}
            style={styles.button}>
            <Text style={{ fontSize: 20, color: '#fff' }}>Clear Tasks</Text>
          </TouchableOpacity>

          {/* <View style={styles.container}>
            <ScrollView style={styles.view} ref={ref => this.scrollRef = ref}>
              {
                events.map((task, i) => {
                  return <TouchableOpacity
                  onPress={() => this.removeKey('tasks')}
                  style={styles.button}> 
                  <Text style={{ fontSize: 20, color: '#fff' }}>{}</Text>
                  </TouchableOpacity>;
                })
              }
            </ScrollView>
          </View> */}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: "blue",
    padding: 20,
    borderRadius: 5,
    // position: 'absolute',
    // top:0,
    // right:0,
  }
});