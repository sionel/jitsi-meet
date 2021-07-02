import React, {PureComponent} from 'react';
import SplashScreen from 'react-native-splash-screen';
import {AppRegistry, NativeEventEmitter, NativeModules} from 'react-native';

// import JitsiMeetJS, {JitsiConnectionEvents} from './lib-jitsi-meet';
import JitsiMeetJS, {JitsiConnectionEvents} from '../../base/lib-jitsi-meet';

import {Text, View, Button, TextInput, SafeAreaView} from 'react-native';
import {RTCView} from 'react-native-webrtc';

const {ExternalAPI} = NativeModules;
// debugger
const eventEmitter = new NativeEventEmitter(ExternalAPI);

const config = {
  hosts: {
    domain: 'meet.jit.si',
    focus: 'focus.meet.jit.si',
    muc: 'conference.meet.jit.si'
  },

  bosh: 'https://meet.jit.si/http-bind',
  openBridgeChannel: 'datachannel',
  channelLastN: -1,
  resolution: 720,
  constraints: {
    video: {
      aspectRatio: 1.3,
      height: {
        ideal: 320,
        max: 720,
        min: 240
      },
      width: {min: 640, max: 1280}
    }
  },
  disableSuspendVideo: true,
  disableSimulcast: false,
  minHDHeight: 240,
  p2p: {
    enabled: true,

    stunServers: [{urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443'}]
  },

  stereo: true,
  e2eping: {pingInterval: 10000, analyticsInterval: 60000},
  desktopSharing: 'ext',
  desktopSharingSources: ['screen', 'window'],

  enableNoAudioDetection: true,
  enableNoisyMicDetection: true,

  channelLastN: -1,
  enableWelcomePage: true
};

export class App extends PureComponent {
  constructor(props) {
    super(props);
    this._jitsiConference;
    this._jitsiConnection;
    this.state = {
      tracks: [],
      roomName: 'test_choidkanehahtdhrpwjrdma',
      num: 0,
      localTracks: null
    };
    this.externalAPIScope = props.externalAPIScope;
    SplashScreen.hide();
  }

  componentWillUnmount() {
    this._jitsiConnection?.disconnect();
    this._jitsiConference?.leave();
  }

  _joinUser = () => {};
  _addRemoteTrack = track => {
    if (track.getType() === 'video') {
      let exist = false;
      let newTrack = [];

      this.state.tracks.forEach(e => {
        if (e.user === track.ownerEndpointId) {
          e.video = track;
          exist = true;
        }
        newTrack.push(e);
      });

      if (exist) {
        this.setState({
          ...this.state,
          tracks: [...newTrack]
        });
      } else {
        this.setState({
          ...this.state,
          tracks: [
            ...this.state.tracks,
            {video: track, user: track.ownerEndpointId}
          ]
        });
      }
    }
  };
  _changeRoomName = text => {
    this.setState({
      ...this.state,
      roomName: text
    });
  };
  _disconnMeet = async () => {
    this._jitsiConference?.getConnectionState()
      ? await this._jitsiConference?.leave()
      : null;
    this._jitsiConference = null;
    await this._jitsiConnection?.disconnect();
    this._jitsiConnection = null;
    this.setState({
      ...this.state,
      tracks: []
    });
  };
  _connMeet = async () => {
    const options = config;

    JitsiMeetJS.init({
      ...options
    });
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
    const roomName = this.state.roomName;

    options.bosh = `${options.bosh}?room=${roomName}`;
    this._jitsiConnection = new JitsiMeetJS.JitsiConnection(
      null,
      null,
      options
    );
    const conferenceEvents = JitsiMeetJS.events.conference;
    debugger;
    await new Promise((res, rej) => {
      this._jitsiConnection.addEventListener(
        JitsiConnectionEvents.CONNECTION_ESTABLISHED,
        a => {
          res(a);
        }
      );
      this._jitsiConnection.addEventListener(
        JitsiConnectionEvents.CONNECTION_FAILED,
        a => {}
      );
      this._jitsiConnection.addEventListener(
        JitsiConnectionEvents.CONNECTION_DISCONNECTED,
        a => {}
      );
      this._jitsiConnection.connect({});
    });
    debugger;
    this._jitsiConference = this._jitsiConnection.initJitsiConference(
      roomName,
      options
    );
    debugger;
    this._jitsiConference.on(conferenceEvents.CONFERENCE_JOINED, () => {
      // const { ExternalAPI } = NativeModules;
      // debugger
      // ExternalAPI.sendEvent(
      //   'CONFERENCE_JOINED',
      //   'url: "https://meet.jit.si/test_choi"',
      //   this.externalAPIScope
      // );
    });
    this._jitsiConference.on(conferenceEvents.CONFERENCE_FAILED, () => {});
    this._jitsiConference.on(conferenceEvents.USER_JOINED, (id, user) => {
      this._joinUser(user);
    });
    this._jitsiConference.on(conferenceEvents.TRACK_ADDED, (track, asd) => {
      if (!track.isLocal()) {
        this._addRemoteTrack(track);
      }
    });
    debugger;
    // let video = (
    //   await JitsiMeetJS.createLocalTracks({
    //     devices: ['video'],
    //     resolution: 320
    //   })
    // )[0];

    // @@@ change this!
    let video = (
      await JitsiMeetJS.createLocalTracks({
        devices: ['desktop']
      })
    )[0];

    let audio = (
      await JitsiMeetJS.createLocalTracks({
        devices: ['audio'],
        resolution: 320
      })
    )[0];
    debugger;
    this._jitsiConference.addTrack(video);
    this._jitsiConference.addTrack(audio);
    debugger;
    this._jitsiConference.join();
    this.setState({
      ...this.state,
      tracks: [{video, user: 'local'}]
    });
    debugger;
  };

  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <Button
          title={'disconn'}
          onPress={() => {
            this._disconnMeet();
          }}
        />
        <Button
          title={'conn'}
          onPress={() => {
            this._connMeet();
          }}
        />
        {this.state.tracks?.length ? (
          this.state.tracks.map(track => {
            return (
              <RTCView
                style={{
                  zIndex: 99,
                  flex: 1,
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                }}
                objectFit={'contain'}
                streamURL={track.video.getOriginalStream().toURL()}
                zOrder={1}
              />
            );
          })
        ) : (
          <TextInput
            style={{backgroundColor: '#fff'}}
            onChangeText={() => {
              this._changeRoomName();
            }}
          >
            {this.state.roomName}
          </TextInput>
        )}
      </SafeAreaView>
    );
  }
}

AppRegistry.registerComponent('App', () => App);
