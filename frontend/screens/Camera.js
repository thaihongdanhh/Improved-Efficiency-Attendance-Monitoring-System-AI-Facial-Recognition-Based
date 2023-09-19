'use strict';
import React, { PureComponent } from 'react';
import { AppRegistry, Alert, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Button as EButton, Input, Card } from 'react-native-elements';
import { Camera as  RNCamera } from 'expo-camera';
import { connect } from 'react-redux';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import * as FaceDetector from 'expo-face-detector';
const { width } = Dimensions.get('screen');
const height = Math.round((width * 16) / 9);

let camera = RNCamera
let parentRef = ''

class Camera extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            permission: false
        }
    }

    handleFacesDetected = ({ faces }) => {
        console.log('OK Faces')
        if (faces.length === 1) {
            // console.log(faces[0].rollAngle.toFixed(0) <= 10)
            if ((faces[0].rollAngle.toFixed(0) <= 10 || faces[0].rollAngle.toFixed(0) >= 350) &&
                (faces[0].yawAngle.toFixed(0) <= 10 || faces[0].yawAngle.toFixed(0) >= 350)) {
                this.setState({
                    faceDetected: true,
                    faceValid: true,
                    borderColor: 'green',
                    inValidText: "",
                    countDownStarted: true,
                    isPlaying: true,
                    faces
                }, () => { });
            }

            else if (
                (faces[0].rollAngle.toFixed(0) <= 10 || faces[0].rollAngle.toFixed(0) >= 350) &&
                (10 < faces[0].yawAngle.toFixed(0) < 350)
            ) {
                this.setState({
                    faceDetected: true,
                    faceValid: false,
                    borderColor: 'red',
                    isPlaying: false,
                    inValidText: "Vui lòng nhìn thẳng !",
                    faceDetected: false,
                    faces
                }, () => { });
                this.cancelCountDown();
            }

            else if ((10 < faces[0].rollAngle.toFixed(0) < 350) &&
                (faces[0].yawAngle.toFixed(0) <= 10 || faces[0].yawAngle.toFixed(0) >= 350)) {
                this.setState({
                    faceDetected: true,
                    faceValid: false,
                    borderColor: 'red',
                    isPlaying: false,
                    inValidText: "Vui lòng nhìn thẳng !",
                    faceDetected: false,
                    faces
                }, () => { });
                this.cancelCountDown();
            }

            else {
                this.setState({
                    faceDetected: true,
                    faceValid: false,
                    borderColor: 'red',
                    isPlaying: false,
                    inValidText: "Vui lòng nhìn thẳng !",
                    faceDetected: false,
                    faces
                }, () => { });
                this.cancelCountDown();
            }

            if (!this.state.faceDetected && !this.state.countDownStarted && !this.state.faceValid) {
                this.initCountDown();
            }

        } else {
            this.setState({
                faceDetected: false,
                isPlaying: false,
            });
            this.cancelCountDown();
        }
    }


  render() {
    const { navigation, route } = this.props

    return (
      <View style={styles.container}>        
        {!this.state.permission && Alert.alert('Cấp quyền', `Cấp quyền truy cập Camera !`, [
                            {
                                text: 'Cấp quyền',
                                onPress: () => {
                                    Promise.all(RNCamera.requestCameraPermissionsAsync()
                                        .then(result => {
                                            console.log('Camera Permission', result)
                                            this.setState({
                                                permission: result,
                                            })
                                        })
                                    )
                                },
                            },
                            {
                                text: 'Hủy bỏ',
                                onPress: () => { },
                                style: 'cancel',
                            },
                        ])}
        {/* <RNCamera            
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
        /> */}
        {/* <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity onPress={this.takePicture.bind(this)} style={styles.capture}>
            <Text style={{ fontSize: 14 }}> SNAP </Text>
          </TouchableOpacity>
        </View> */}
        <RNCamera
            // style={styles.camera}                                                                                                                        
            style={{
                flex: 1,
                // width: 360,
                // height: 360,
            }}
            type={RNCamera.Constants.Type.front}
            zoom={Platform.OS === 'ios' ? 0.0005 : 0}
            // zoom={0.0005}
            flashMode={RNCamera.Constants.FlashMode.on}            
            // ratio="4:3"
            
            // onFaceDetectionError={this.handleFaceDetectionError}
            // pictureSize
            {...this.state.propsFace}
            onCameraReady={() => {
                console.log('OK')
                this.setState({
                    propsFace: {
                        onFacesDetected: this.state.faceDetecting ? this.handleFacesDetected : undefined
                    },
                    faceDetectorSettings: {
                        mode: FaceDetector.FaceDetectorMode.fast,
                        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                        runClassifications: FaceDetector.FaceDetectorClassifications.none,
                        minDetectionInterval: 100,
                        tracking: true,
                    }
                })
            }}
            ref={r => {
                camera = r;
                parentRef = r
            }}
        >
            <View style={{
                // flex:1,
                // padding: 20,                                                                            
                overflow: "hidden"
            }}>
                {/* <CountdownCircleTimer
                    isPlaying={true}
                    strokeWidth={18}
                    duration={1}
                    // colors={['#A30000', '#F7B801', '#004777', 'green']}
                    // colorsTime={[3, 2, 1, 0]}
                    colors={['#F7B801', 'green']}
                    colorsTime={[1, 0]}
                    size={360}
                    key={this.state.key} /> */}
            </View>
            {this.state.faceDetected && (
                                                            <View
                                                                style={{
                                                                    flex: 1,
                                                                    backgroundColor: 'lightgreen',
                                                                    flexDirection: 'row',
                                                                    position: 'absolute',
                                                                    bottom: 100,
                                                                    width: width,
                                                                    height: 50,
                                                                    alignContent: "center",
                                                                    justifyContent: "center",
                                                                    marginBottom: 220
                                                                }}>
                                                                <Text
                                                                    // style={styles.textStandard}
                                                                    style={{
                                                                        color: "red",
                                                                        fontSize: 32
                                                                    }}
                                                                >
                                                                    {'Khuôn mặt chưa hợp lệ !'}
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {this.state.inValidText !== '' && (
                                                            <View
                                                                style={{
                                                                    flex: 1,
                                                                    backgroundColor: 'lightgreen',
                                                                    flexDirection: 'row',
                                                                    position: 'absolute',
                                                                    bottom: 100,
                                                                    width: width,
                                                                    height: 50,
                                                                    alignContent: "center",
                                                                    justifyContent: "center",
                                                                    marginBottom: 220
                                                                }}>
                                                                <Text
                                                                    // style={styles.textStandard}
                                                                    style={{
                                                                        color: "red",
                                                                        fontSize: 32
                                                                    }}
                                                                >
                                                                    {this.state.inValidText}
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {this.state.faceValid && (
                                                            <View
                                                                style={{
                                                                    flex: 1,
                                                                    backgroundColor: 'lightgreen',
                                                                    flexDirection: 'row',
                                                                    position: 'absolute',
                                                                    bottom: 100,
                                                                    width: width,
                                                                    height: 100,
                                                                    alignContent: "center",
                                                                    justifyContent: "center",
                                                                    marginBottom: 180
                                                                }}>
                                                                <Text
                                                                    style={{
                                                                        color: "blue",
                                                                        fontSize: 64
                                                                    }} >
                                                                    {String(this.state.countDownSeconds)}
                                                                </Text>
                                                            </View>
                                                        )}
                                                        <View
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: 50,
                                                                flexDirection: 'row',
                                                                flex: 1,
                                                                width: '100%',
                                                                padding: 23,
                                                                justifyContent: 'flex-end',
                                                                backgroundColor: 'white'
                                                            }}>                                                            
                                                            <EButton
                                                                title="Trở về"
                                                                onPress={() => {
                                                                    navigation.navigate('Onboarding', {
                                                                    })
                                                                }}
                                                                buttonStyle={{
                                                                    borderColor: '#20a8d8',
                                                                    backgroundColor: "#20a8d8"
                                                                }}
                                                                type="outline"
                                                                raised
                                                                titleStyle={{
                                                                    color: 'white',
                                                                    fontSize: 24,
                                                                }}
                                                                containerStyle={{
                                                                    width: '35%',
                                                                    height: 50,
                                                                    marginTop: 20,
                                                                    backgroundColor: "#20a8d8",
                                                                    //   marginBottom: theme.SIZES.BASE,
                                                                    //   width: width - theme.SIZES.BASE * 2,
                                                                }}
                                                            />
                                                        </View>
        </RNCamera>
        
      </View>
    );
  }

  componentDidMount() {
    RNCamera.getCameraPermissionsAsync()
            .then(result => {
                console.log(result)
                this.setState({
                    permission: result.granted,
                }, async () => {                 
                })
            })
  }

  takePicture = async () => {
    if (this.camera) {
      const options = { quality: 0.5, base64: true };
      const data = await this.camera.takePictureAsync(options);
      console.log(data.uri);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
});


const mapStateToProps = state => {
    return {
        // user: state.user,
        // errors: state.errors,
    };
};

const mapDispatchToProps = dispatch => {
    return {   
        oncheckFace: (face, EmpCode, lat, lng, callback) => {
            dispatch(checkFace(face, EmpCode, lat, lng, callback))
        },
        onfetchTimesheetPerson: (EmpCode, start_date, end_date, callback) => {
            dispatch(fetchTimesheetPerson(EmpCode, start_date, end_date, callback))
        },
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Camera);