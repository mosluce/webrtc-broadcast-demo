/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions
} from 'react-native';
import Button from 'react-native-button';
import TextField from 'react-native-md-textinput';

window.navigator.userAgent = "react-native";
var io = require('socket.io-client/socket.io');
var socket, pc, instance;

var WebRTC = require('react-native-webrtc');
var {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStreamTrack,
  getUserMedia,
} = WebRTC;

var Win = Dimensions.get('window');

socket = io.connect('http://localhost:3000/', {transports: ['websocket']});

socket.on('offer', function(data) {
  pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function() {
    pc.createAnswer(function(desc) {
      pc.setLocalDescription(desc, function() {
        socket.emit('answer', {sdp: pc.localDescription});
      });
    });
  });
});

socket.on('ice', function(data) {
  if(data.candidate)
    pc.addIceCandidate(new RTCIceCandidate(data.candidate));
});

class HelloRTC extends Component {
  constructor(props) {
    super(props);

    this.state = {
      videoURL: null,
      controlDisabled: false
    };
  }
  componentDidMount() {
    instance = this;
  }
  render() {
    const self = this;

    return (
      <View style={styles.container}>

        <TextField onChangeText={(text) => {
          this.setState({
            channel: text
          });
        }} value={this.state.channel} editable={!this.state.controlDisabled} label={'Channel'} highlightColor={'#00BCD4'} />

        <Button disabled={this.state.controlDisabled} onPress={() => {
          this.setState({
            controlDisabled: true
          });

          pc = new RTCPeerConnection();
          pc.onaddstream = function(e) {
            console.log(e.stream.toURL()); //
            instance.setState({
              videoURL: e.stream.toURL()
            });
          };

          socket.emit('start watch', {channel: this.state.channel});
        }}>Watch</Button>

        <View>
          <RTCView streamURL={this.state.videoURL} />
        </View>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
  },
});

AppRegistry.registerComponent('HelloRTC', () => HelloRTC);
