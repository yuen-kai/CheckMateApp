import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '83%'
  },
  labelContainer: {
    position: 'absolute',
    top: -8,
    left: 25,
    padding: 5,
    zIndex: 50
  },
  content: {
    flex: 1,
    borderWidth: 1,
    justifyContent: 'flex-end',
    borderRadius: 15,
    paddingHorizontal: 25,
    paddingLeft: 10,
    paddingVertical: 10,
    marginTop: 7
  }
})

const Section = (props) => (
  <View style={[styles.container, props.containerStyle]}>
    <View style={[styles.labelContainer, props.labelContainerStyle]}>
      <Text style={props.labelStyle}>{props.label}</Text>
    </View>
    <View style={[styles.content, props.contentStyle]}>{props.children}</View>
  </View>
)

export default Section
