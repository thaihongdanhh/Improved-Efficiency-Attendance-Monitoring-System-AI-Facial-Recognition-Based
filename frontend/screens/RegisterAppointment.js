import { current } from '@reduxjs/toolkit';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import Constants from 'expo-constants';
import { DeviceMotion } from 'expo-sensors';
import React, { Fragment, useState } from 'react';
import ReactNative, {
    BackHandler,
    Image,
    SafeAreaView,
    ScrollView,
    LogBox, Pressable,
    Modal, Alert, Button, StyleSheet, Text, TouchableOpacity,
    View, Dimensions, ImageBackground, RefreshControl,
    ActivityIndicator, Platform, TextInput
} from 'react-native';
import { Button as EButton, Input, Card } from 'react-native-elements';
import { Block, theme, Text as GText } from 'galio-framework';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import moment from 'moment';
import * as FileSystem from 'expo-file-system';
import { connect } from 'react-redux';
import { uploadImages, fetchImages, cropImages } from '../store/actions/aicoffee';
import {
    checkFaceLogin,
    fetchEmployeeDetail,
    updateFaceRegister,
    checkAppointmentCode,
    fetchVisitorDetail,
    updateFaceRegisterVisitor
} from '../store/actions/aiface';
import { faceDetect, faceRegister } from '../store/actions/aiface';
import * as Device from 'expo-device';
import * as Progress from 'react-native-progress';
// import { SuccessAnimation } from "react-native-success-animation";
// import DocumentScanner from "react-native-document-scanner";
// import Scanner from "react-native-rectangle-scanner"
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { w3cwebsocket as W3CWebSocket } from "websocket";
// import DateTimePicker from '@react-native-community/datetimepicker';
// import DatePicker from 'react-native-date-picker'
import DatePicker from 'react-native-modern-datepicker';

// import * as Location from 'expo-location';

let camera = Camera
let parentRef = ''
let childRef = ''
const { width } = Dimensions.get('screen');
const height = Math.round((width * 16) / 9);

const CameraPreview = ({ photo, retakePicture, savePhoto, capturedUri }) => {
    // console.log('sdsfds', photo)
    // console.log(capturedUri)
    return (
        <Fragment>
            <View
                style={{
                    backgroundColor: 'white',
                    flex: 1,
                    height: '100%',
                }}>
                <Image
                    // resizeMethod='auto'
                    resizeMode='stretch'
                    source={{ uri: photo && photo.uri }}
                    // source={{ uri: capturedUri }}
                    style={[styles.camera,
                    {
                        // flex:1,
                        // height: '97%'
                    }]}
                >
                </Image>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        // flex: 1,
                        backgroundColor: 'white'
                    }}>
                    <EButton
                        title="Quét lại"
                        onPress={retakePicture}
                        buttonStyle={{
                            borderColor: '#F19D1A',
                            backgroundColor: '#F19D1A'
                        }}
                        type="outline"
                        raised
                        titleStyle={{ color: 'white', fontSize: 20 }}
                        containerStyle={{
                            width: '45%',
                            marginHorizontal: 5,
                            borderRadius: 20,
                            marginVertical: 20,
                            //   marginBottom: theme.SIZES.BASE,
                            //   width: width - theme.SIZES.BASE * 2,
                        }}
                    />
                    <EButton
                        title="Chấm công vào"
                        onPress={savePhoto}
                        buttonStyle={{
                            borderColor: '#00B991',
                            backgroundColor: '#00B991'
                        }}
                        type="outline"
                        raised
                        titleStyle={{ color: 'white', fontSize: 20 }}
                        containerStyle={{
                            width: '45%',
                            marginHorizontal: 5,
                            borderRadius: 20,
                            marginVertical: 20,
                            //   marginBottom: theme.SIZES.BASE,
                            //   width: width - theme.SIZES.BASE * 2,
                        }}
                    />
                </View>
            </View>
            {/* <View
                    style={{
                        // flex: 1,
                        flexDirection: 'column',
                        // padding: 15,
                        justifyContent: 'flex-end',
                        backgroundColor: 'black',
                        // height: '10%'
                    }}>

                </View> */}
        </Fragment>
    );
}

class CheckIn extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            type: CameraType.front,
            typeFlash: FlashMode.off,
            startCamera: true,
            previewVisible: false,
            modalProcess: false,
            modalSuccess: false,
            modalRegister: false,
            modalVerify: false,
            modalRegisterSuccess: false,
            modalError: false,
            modalDateTime: false,
            capturedImage: null,
            capturedUri: null,
            modalSave: false,
            image: null,
            weight: 0,
            person: '',
            childRef: null,
            parentRef: null,
            faceDetecting: true, //when true, we look for faces
            faceDetected: false, //when true, we've found a face
            faceValid: false,
            countDownSeconds: 1, //current available seconds before photo is taken
            countDownStarted: false, //starts when face detected
            pictureTaken: false, //true when photo has been taken
            motion: null, //captures the device motion object 
            detectMotion: false, //when true we attempt to determine if device is still
            motionInterval: 500, //ms between each device motion reading
            motionTolerance: 1, //allowed variance in acceleration         
            faces: [],
            inValidText: "",
            borderColor: "red",
            isPlaying: false,
            key: 0,
            time: new Date(Date.now()).toLocaleTimeString(),
            date_current: new Date(Date.now()).toLocaleDateString(),
            timestamp: "",
            avatar_path: "",
            isResult: false,
            isCheckSubmit: false,
            dataFaceCheck: [],
            isLoading: true,
            // dataFaceCheck: [{ "check_in": "VQ9H+GJW, QL1A, Linh Xuân, Thủ Đức, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3510.3, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "35.066381443271894", "lat_out": "", "long_in": "129.0816877979185", "long_out": "", "snapshot_date": "2023-02-17", "time_enter": "2023-02-17 13:27:05", "time_enter_format": "13:27:05", "time_enter_late": "05:27:05", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-17" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.01, "distance_out": 0.01, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789579681839763", "lat_out": "10.789579681839763", "long_in": "106.71968133762259", "long_out": "106.71968133762259", "snapshot_date": "2023-02-09", "time_enter": "2023-02-09 13:38:16", "time_enter_format": "13:38:16", "time_enter_late": "05:38:16", "time_leave": "2023-02-09 13:38:30", "time_leave_early": "03:21:30", "time_leave_format": "13:38:30", "total_working_hour": 0, "working_date": "2023-02-09" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789540511555128", "lat_out": "", "long_in": "106.71977028823788", "long_out": "", "snapshot_date": "2023-02-08", "time_enter": "2023-02-08 14:50:04", "time_enter_format": "14:50:04", "time_enter_late": "06:50:04", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-08" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "bảy", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 8.36, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.797056", "lat_out": "", "long_in": "106.643456", "long_out": "", "snapshot_date": "2023-02-04", "time_enter": "2023-02-04 15:29:06", "time_enter_format": "15:29:06", "time_enter_late": "07:29:06", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-04" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "năm", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": 0.02, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7894894", "lat_out": "10.789491", "long_in": "106.7195971", "long_out": "106.719528", "snapshot_date": "2023-02-02", "time_enter": "2023-02-02 09:50:33", "time_enter_format": "09:50:33", "time_enter_late": "01:50:33", "time_leave": "2023-02-02 11:14:12", "time_leave_early": "05:45:48", "time_leave_format": "11:14:12", "total_working_hour": 1.4, "working_date": "2023-02-02" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3.35, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7974327", "lat_out": "", "long_in": "106.6900316", "long_out": "", "snapshot_date": "2023-01-25", "time_enter": "2023-01-25 17:47:09", "time_enter_format": "17:47:09", "time_enter_late": "09:47:09", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-01-25" }]
            EmpCode: "",
            EmpName: "",
            DeptValue: "",
            department_name: "",
            employee_name: "",
            isExists: false,
            isLoadingEmployee: true,
            isAppointmentCode: true,
            AppointmentCode: "",
            VisitorName: "",
            Company: "",
            TimePlan: "",
            ReasonPlan: "",
            CompanyCode: "",
            date: new Date(1598051730000),
        };
    }

    static defaultProps = {
        countDownSeconds: 1,
        motionInterval: 500, //ms between each device motion reading
        motionTolerance: 1, //allowed variance in acceleration
        cameraType: Camera.Constants.Type.front, //front vs rear facing camera
    }

    countDownTimer = null;

    backAction = () => {
        const { navigation, route } = this.props
        // navigation.navigate('WeightFolder', {
        //     isBack: true,
        //     labelName: route.params['labelName'],
        //     username: route.params['username'],
        //     weightName: route.params['weightName']
        //   })
        return true;
    };
    __retakePicture = () => {
        clearInterval(this.countDownTimer);
        this.setState({
            countDownSeconds: this.props.countDownSeconds,
            countDownStarted: false,
            capturedImage: null,
            previewVisible: false,
            faceDetected: false,
            faceValid: false,
            faceDetecting: true,
        });
    };

    __startCamera = async () => {
        this.setState({
            startCamera: !this.state.startCamera
        })
    };

    toggleCameraType = () => {
        this.setState({
            type: this.state.type === CameraType.back ? CameraType.front : CameraType.back
        });
    }

    toggleFlashMode = () => {
        this.setState({
            typeFlash: this.state.typeFlash === FlashMode.off ? FlashMode.torch : FlashMode.off
        });
    }

    __takePicture = async () => {
        const options = { base64: true, quality: 0.5 };
        const photo = await camera.takePictureAsync(options);
        const { route } = this.props

        this.setState({
            modalProcess: !this.state.modalProcess
        }, () => {
            console.log(Device.deviceName)
        })
    }

    __register = async () => {
        const {
            name,
            capturedImage
        } = this.state

        if (name === '') {
            Alert.alert('Error', `Please enter your name !`, [
                {
                    text: 'Back',
                    style: 'cancel',
                },
            ]);
        }
        else {
            const base64 = await FileSystem.readAsStringAsync(capturedImage.uri, { encoding: 'base64' });
            await this.props.onfaceRegister(base64, name, response => {
                if (response.status === 'exists') {
                    Alert.alert('Error', `Name existed ! Enter another name, please !`, [
                        {
                            text: 'Back',
                            style: 'cancel',
                        },
                    ]);
                }

                else if (response.status === 'success') {
                    this.setState({
                        modalRegisterSuccess: !this.state.modalRegisterSuccess
                    }, () => {
                        setTimeout(() => {
                            this.setState({
                                modalRegisterSuccess: !this.state.modalRegisterSuccess,
                                modalRegister: !this.state.modalRegister
                            })
                        }, 2000)
                    })
                }
            })
        }

    }


    __savePhoto = async () => {
        const {
            weight,
            person,
            capturedImage,
            file_path,
            file_path_cropped
        } = this.state;

        const { navigation, optionLeft, optionRight, route } = this.props;

        // console.log(weight)
        // const username = route.params['username']
        // const label = route.params['labelName']
        // const weightName = route.params['weightName']
        const today = moment().utcOffset('+07:00').format('YYYYMMDD')
        const dateid = moment().unix()
        // console.log(dateid)


        if (
            weight === '' ||
            label === ''
        ) {
            if (weight === '') {
                Alert.alert('Lỗi', `Vui lòng nhập khối lượng !`, [
                    {
                        text: 'Quay về',
                        style: 'cancel',
                    },
                ]);
            } else if (username === '') {
                Alert.alert('Lỗi', `Vui lòng nhập người chụp !`, [
                    {
                        text: 'Quay về',
                        style: 'cancel',
                    },
                ]);
            } else if (label === '') {
                Alert.alert('Lỗi', `Vui lòng nhập mã của mẫu !`, [
                    {
                        text: 'Quay về',
                        style: 'cancel',
                    },
                ]);
            }
        } else {
            const options = {
                encoding: FileSystem.EncodingType.Base64
            }
            const image =
                label + '_' + today + '_' + dateid + '_' + weightName + '_' + weight + '.png';
            const to = FileSystem.documentDirectory + '/DetectCoffee/' + label + '/' + weightName + '/' + image;
            // console.log(image)

            await FileSystem.writeAsStringAsync(
                to,
                capturedImage,
                options
            ).then(
                this.props.onuploadImages(image, username, Device.deviceName, file_path, file_path_cropped, response => {
                    // console.log(response)
                    this.setState({
                        modalSave: !this.state.modalSave,
                        capturedImage: null,
                        previewVisible: false,
                        image: null,
                        file_path: null,
                        file_path_cropped: null
                    })
                })
            )
        }
    };

    getParentRef = (parentRef) => {
        this.setState({
            parentRef
        })
    }

    detectMotion = (doDetect) => {
        this.setState({
            detectMotion: doDetect,
        });
        if (doDetect) {
            DeviceMotion.setUpdateInterval(this.props.motionInterval);
        } else if (!doDetect && this.state.faceDetecting) {
            this.motionListener.remove();
        }

    }

    onDeviceMotion = (rotation) => {
        this.setState({
            motion: rotation.accelerationIncludingGravity
        });
    }


    detectFaces(doDetect) {
        this.setState({
            faceDetecting: doDetect,
        });
    }

    handleFaceDetectionError = () => {
        //
    }
    handleFacesDetected = ({ faces }) => {
        // console.log(faces)
        if (faces.length === 1) {
            // console.log(faces[0].rollAngle.toFixed(0) <= 10)
            if ((faces[0].rollAngle.toFixed(0) <= 10 || faces[0].rollAngle.toFixed(0) >= 350) &&
                (faces[0].yawAngle.toFixed(0) <= 10 || faces[0].yawAngle.toFixed(0) >= 350)) {
                this.setState({
                    faceDetected: true,
                    faceValid: true,
                    isPlaying: true,
                    borderColor: 'green',
                    inValidText: "",
                    countDownStarted: true,
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

    initCountDown = () => {
        this.setState({
            countDownStarted: true,
        });
        this.countDownTimer = setInterval(this.handleCountDownTime, 1000);
    }
    cancelCountDown = () => {
        clearInterval(this.countDownTimer);
        this.setState({
            countDownSeconds: this.props.countDownSeconds,
            countDownStarted: false,
            key: this.state.key + 1
        });
    }
    handleCountDownTime = () => {
        if (this.state.countDownSeconds > 0) {
            let newSeconds = this.state.countDownSeconds - 1;
            this.setState({
                countDownSeconds: newSeconds,
            });
        } else {
            this.setState({
                modalProcess: !this.state.modalProcess,
                faceDetecting: false,
                isPlaying: false,
                countDownStarted: false,
                propsFace: {
                    onFacesDetected: undefined
                },
            }, () => {
                if (camera) {
                    console.log('take picture');
                    // const options = {base64:true, quality: 0.5, onPictureSaved: this.onPictureSaved};
                    const options = { onPictureSaved: this.onPictureSaved };
                    camera.takePictureAsync(options);
                }

                this.cancelCountDown();
            })

        }
    }

    getImageDimensions = ({ width, height } = FaceDetector.Image) => {
        if (width > height) {
            const scaledHeight = (pictureSize * height) / width;
            return {
                width: pictureSize,
                height: scaledHeight,

                scaleX: pictureSize / width,
                scaleY: scaledHeight / height,

                offsetX: 0,
                offsetY: (pictureSize - scaledHeight) / 2,
            };
        } else {
            const scaledWidth = (pictureSize * width) / height;
            return {
                width: scaledWidth,
                height: pictureSize,

                scaleX: scaledWidth / width,
                scaleY: pictureSize / height,

                offsetX: (pictureSize - scaledWidth) / 2,
                offsetY: 0,
            };
        }
    }

    onPictureSaved = async (photo) => {
        const {
            faces
        } = this.state

        const windowWidth = Dimensions.get('screen').width;
        const windowHeight = Dimensions.get('screen').height;

        FaceDetector.detectFacesAsync(photo.uri, {
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
        })
            .then(async ({ image, faces }) => {
                // console.log(image)
                const cropData = {
                    originX: faces[0]["bounds"]['origin']["x"],
                    originY: faces[0]["bounds"]['origin']["y"],
                    width: faces[0]["bounds"]['size']["width"],
                    height: faces[0]["bounds"]['size']["height"]
                }

                if (cropData['originX'] < 50) {
                    this.setState({
                        // faceDetecting: true,
                        faceValid: false,
                        isPlaying: false,
                        modalProcess: !this.state.modalProcess,
                    }, () => {
                        this.cancelCountDown();
                        setTimeout(() => {
                            this.setState({
                                faceDetecting: true,
                            })
                        }, 2000)
                    })
                } else {

                    let croppedPhoto = await manipulateAsync(
                        image.uri,
                        [{ crop: cropData }, { resize: { width: 336 } }],
                        { compress: 0, format: "png", base64: false }
                    );

                    this.setState({
                        previewVisible: !this.state.previewVisible,
                        capturedImage: croppedPhoto,
                    }, async () => {

                        let dataFaceCheckArr = []

                        const client = new W3CWebSocket('wss://hr.ailab.vn:5020/ws/facecheck')
                        client.onmessage = (message) => {
                            console.log('tới đây rồi')
                            this.setState({
                                isQuetLai: false
                            }, () => {
                                if (message.data.split('|')[0] === 'login') {
                                    this.setState({
                                        isLoadingFaceCheck: true,
                                    }, () => {
                                        const device_name = message.data.split('|')[1]
                                        const employee_code = message.data.split('|')[2]
                                        const company_code = message.data.split('|')[4].split('_')[message.data.split('|')[4].split('_').length - 1]
                                        const employee_name = message.data.split('|')[5]
                                        const status = message.data.split('|')[3]
                                        const session_match = message.data.split('|')[8]
                                        // console.log(status)

                                        if (String(session_match) === String(this.state.session)) {
                                            if (status === "no_meet_conditions_person") {
                                                this.setState({
                                                    modalVerify: !this.state.modalVerify
                                                }, () => {
                                                    setTimeout(() => {
                                                        this.setState({
                                                            modalVerify: false
                                                        })                                                        
                                                    }, 2000)                                                    
                                                })

                                            }

                                            else if (status === 'meet_conditions_person') {
                                                const idcard = message.data.split('|')[4]
                                                const name = message.data.split('|')[5]
                                                this.props.onfetchVisitorDetail(this.state.CompanyCode, idcard.split('_')[0], dataVisitor => {
                                                    this.setState({
                                                        isExists: true,
                                                        VisitorName: name,
                                                        VisitorCode: idcard.split('_')[0],
                                                        Company: dataVisitor[0]['company'],
                                                        modalProcess: false,
                                                        isResult: true
                                                    }, () => {                                                        
                                                    })
                                                })
                                            }
                                            client.close = () => {
                                                console.log('WebSocket Client Closed');                
                                            }
                                        }
                                    })
                                }
                            })
                        };

                        const base64 = await FileSystem.readAsStringAsync(this.state.capturedImage.uri, { encoding: 'base64' });

                        new Promise(() => {
                            client.onopen = () => {
                                console.log('WebSocket Client Connected');
                            };


                            this.props.oncheckFaceLogin(base64, this.state.session, response => {
                                // console.log(response)
                                this.setState({
                                    //isRefresh: true,
                                }, () => {
                                    this.setState({
                                        // isResult: true,
                                    }, () => {
                                        // update khoảng cách và địa điểm chấm công
                                        setTimeout(() => {
                                            this.setState({
                                                // Image:'',
                                                // EmpCode:'',
                                                // preview: "",
                                                // isFaceDetect: true,
                                                // isResult: false,
                                                // isLoadingEmployee: false
                                                modalProcess: false,
                                                faceDetecting: true,
                                                previewVisible: false,
                                                propsFace: {
                                                    onFacesDetected: this.handleFacesDetected
                                                },
                                            })
                                        }, 10000)
                                        //this.run();
                                    })

                                })

                            });

                        })


                    });
                    this.detectFaces(false);
                }
            })
            .catch(this.handleFaceDetectionError)

        // console.log(await camera.getSupportedRatiosAsync())

        // console.log(photo)
        // console.log(Dimensions.get('screen'))
        // console.log(Dimensions.get('screen'))
        // console.log(faces[0])

        // const heightScalePercent = (photo.height / (Dimensions.get('screen').height * Dimensions.get('screen').scale))
        // const widthScalePercent = (photo.width / (Dimensions.get('screen').width * Dimensions.get('screen').scale))

        // console.log(heightScalePercent)
        // console.log(widthScalePercent)

        // const growthFactor = {
        //     w: faces[0]["bounds"]['size']["width"] / windowWidth,
        //     h: faces[0]["bounds"]['size']["height"] / windowHeight,
        //   };

        // // const { width } = Dimensions.get('screen');
        // // const height = Math.round((width * 16) / 9);

        // const cropData = {
        //     originX: faces[0]["bounds"]['origin']["x"],
        //     originY: faces[0]["bounds"]['origin']["y"],
        //     width: faces[0]["bounds"]['size']["width"],
        //     height: faces[0]["bounds"]['size']["height"]
        //   }                

        // let resizedPhoto = await manipulateAsync(
        //     photo.uri,
        //     [{
        //         resize: {
        //             height: windowHeight,
        //             width: windowWidth
        //         },
        //     }],
        //     { compress: 0, format: "png", base64: false }
        // );

        // let croppedPhoto = await manipulateAsync(
        //     resizedPhoto.uri,
        //     [{crop: cropData}],
        //     { compress: 0, format: "png", base64: false }
        // );      

        // this.setState({
        //     previewVisible: !this.state.previewVisible,
        //     modalProcess: !this.state.modalProcess,
        //     capturedImage: croppedPhoto,            
        // });                
        // this.detectFaces(false);

    }

    onRegisterClick = () => {
        this.setState({
            isCheckSubmit: true
        }, async () => {
            const {
                VisitorName,
                VisitorCode,
                CompanyCode,
                company_name,
                TimePlan,
                ReasonPlan,
                AppointmentCode,
                capturedImage
            } = this.state

            const base64 = await FileSystem.readAsStringAsync(capturedImage.uri, { encoding: 'base64' });
            //console.log(Image)
            let err = 0

            if (VisitorName === "") {
                err = 1
                this.setState({
                    modalVerify: !this.state.modalVerify
                })
            }

            if (err === 0) {
                this.props.onupdateFaceRegisterVisitor(base64, VisitorName, VisitorCode, company_name, CompanyCode, TimePlan, ReasonPlan, AppointmentCode , response => {
                    if (response.status !== "fail") {
                        this.setState({          
                            modalSuccess: !this.state.modalSuccess
                        }, () => {
                            setTimeout(() => {
                                this.setState({
                                    modalSuccess: false
                                })
                            }, 3000)
                        })
                    } else {
                        this.setState({
                            modalVerify: !this.state.modalVerify
                        })
                    }
                })
            }
        })
    }

    onSubmitCode = () => {
        const {
            AppointmentCode
        } = this.state
        console.log(AppointmentCode)
        if (AppointmentCode === "") {
            this.setState({
                errorMessage: 'Vui lòng nhập Mã công ty !',
                modalError: !this.state.modalError
            }, () => {
                setTimeout(() => {
                    this.setState({
                        modalError: false
                    })
                }, 1500)
            })
        }
        else {
            this.props.oncheckAppointmentCode(AppointmentCode, response => {
                if (response.status === 'not_exists') {
                    this.setState({
                        errorMessage: 'Mã công ty không đúng !\n Vui lòng liên hệ công ty để xác nhận.',
                        modalError: !this.state.modalError
                    }, () => {
                        setTimeout(() => {
                            this.setState({
                                modalError: false
                            })
                        }, 1500)
                    })
                }
                else if (response.status === 'exists') {
                    this.setState({
                        CompanyCode: response.company_code,
                        isAppointmentCode: false,
                        modalSuccess: !this.state.modalSuccess,
                        company_name: response.company_name
                    }, () => {
                        setTimeout(() => {
                            this.setState({
                                modalSuccess: false
                            })
                        }, 1500)
                    })
                }
            })
        }
    }

    onChange = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShow(false);
        setDate(currentDate);
    };

    renderFaces = () =>
        <View style={styles.facesContainer} pointerEvents="none">
            {this.state.faces.map(this.renderFace)}
        </View>

    renderFace({ bounds, faceID, rollAngle, yawAngle }) {
        return (
            <Fragment key={faceID}>
                {/* <Text style={styles.faceText}>rollAngle: {rollAngle.toFixed(0)}</Text> */}
                {/* <Text style={styles.faceText}>yawAngle: {yawAngle.toFixed(0)}</Text> */}
                <View
                    key={faceID}
                    transform={[
                        // { perspective: 600 },
                        { perspective: 0 },
                        { rotateZ: `${rollAngle.toFixed(0)}deg` },
                        { rotateY: `${yawAngle.toFixed(0)}deg` },
                    ]}
                    style={[
                        styles.face,
                        {
                            ...bounds.size,
                            left: bounds.origin.x,
                            top: bounds.origin.y,
                        },
                    ]}>
                </View>
            </Fragment>
        );
    }


    render() {
        const {
            startCamera,
            modalSave,
            previewVisible,
            capturedImage,
            type,
            typeFlash,
            weight,
            person,
            permission,
            isLoading,
            capturedUri,
            modalProcess,
            modalSuccess,
            modalRegister,
            modalVerify,
            modalRegisterSuccess,
            modalError,
            borderColor,
            isPlaying,
            key,
            time,
            date_current,
            session,
            dataFaceCheck,
            isResult,
            EmpCode,
            department_name,
            employee_name,
            avatar_path,
            EmpName,
            DeptValue,
            isExists,
            isCheckSubmit,
            isAppointmentCode,
            AppointmentCode,
            VisitorName,
            Company,
            TimePlan,
            ReasonPlan,
            CompanyCode,
            date,
            modalDateTime
        } = this.state

        const { navigation, route } = this.props

        if (isLoading) {
            // return <View />
            return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator style={{ width: 300, height: 300 }} color={"black"} />
            </View>
        }

        else if (!isLoading) {
            return (
                <View style={styles.container}>
                    {!permission ? (
                        Alert.alert('Cấp quyền', `Cấp quyền truy cập Camera !`, [
                            {
                                text: 'Cấp quyền',
                                onPress: () => {
                                    Promise.all(Camera.requestCameraPermissionsAsync()
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
                        ])
                    ) : (
                        <Fragment>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalProcess}
                                // key={this.state.data2['index']}
                                onRequestClose={() => {
                                    // Alert.alert('Modal has been closed.');
                                    // this.setModalVisible(!modalProcess);
                                    // this.setState({
                                    //     modalProcess: !this.state.modalProcess
                                    // })
                                }}>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <Text style={styles.modalText}>Processing ... ! Please wait </Text>
                                        <Block row center space="between">
                                            <Progress.CircleSnail color={['red', 'green', 'blue']} />
                                        </Block>
                                    </View>
                                </View>
                            </Modal>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalDateTime}
                                onRequestClose={() => {
                                }}>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <Text style={styles.modalText}>Thời gian đăng ký lịch hẹn</Text>
                                        <Block row center space="between">
                                            <DatePicker
                                                onSelectedChange={date => this.setState({ TimePlan: date, modalDateTime: false })}
                                            />
                                        </Block>
                                    </View>
                                </View>
                            </Modal>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalError}
                                onRequestClose={() => {
                                    this.setState({
                                        modalError: !this.state.modalError
                                    })
                                }}>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <Text style={styles.modalText}> {this.state.errorMessage} </Text>
                                        <Block row center space="between">
                                            <View>
                                                <Image
                                                    source={require('../assets/iconerror.png')}
                                                    style={{ height: 50, width: 50 }}
                                                />
                                            </View>
                                        </Block>
                                    </View>
                                </View>
                            </Modal>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalVerify}
                                // key={this.state.data2['index']}
                                onRequestClose={() => {
                                    // Alert.alert('Modal has been closed.');
                                    // this.setModalVisible(!modalSuccess);
                                    this.setState({
                                        modalVerify: !this.state.modalVerify
                                    })
                                }}>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <Text style={styles.modalText}>Chưa đăng ký thông tin !</Text>
                                        <Block row center space="between" style={{ marginTop: 20 }}>
                                            <EButton
                                                title="Cancel"
                                                onPress={() => {
                                                    this.setState({
                                                        modalVerify: !this.state.modalVerify
                                                    })
                                                }}
                                                buttonStyle={{
                                                    borderColor: '#8B8B8B',
                                                    backgroundColor: '#8B8B8B'
                                                }}
                                                type="outline"
                                                raised
                                                titleStyle={{ color: 'white', fontSize: 20 }}
                                                containerStyle={{
                                                    width: '45%',
                                                    marginHorizontal: 5,
                                                    borderRadius: 20,
                                                    marginVertical: 20,
                                                }}
                                            />
                                        </Block>
                                    </View>
                                </View>
                            </Modal>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalSuccess}
                                // key={this.state.data2['index']}
                                onRequestClose={() => {
                                    // Alert.alert('Modal has been closed.');
                                    // this.setModalVisible(!modalSuccess);
                                    this.setState({
                                        modalSuccess: !this.state.modalSuccess
                                    })
                                }}>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <Text style={styles.modalText}>{'Mã công ty hợp lệ ! \nChào mừng bạn đến website công ty ' + this.state.company_name}</Text>
                                        <Block row center space="between">
                                            <View>
                                                <Image
                                                    source={require('../assets/iconsuccess.png')}
                                                    style={{ height: 50, width: 50 }}
                                                />
                                            </View>
                                        </Block>
                                    </View>
                                </View>
                            </Modal>
                            {!isAppointmentCode ? (
                                <SafeAreaView style={{ flex: 1 }}>
                                    <View
                                        style={{
                                            flex: 1,
                                            width: '100%',
                                        }}>
                                        {
                                            isResult ? (<Fragment>
                                                <View
                                                    style={{
                                                        width: '100%',
                                                    }}>
                                                    <Block row
                                                        style={{
                                                            // width: width - theme.SIZES.BASE * 2,
                                                            height: 350,
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            alignSelf: 'center',
                                                        }}
                                                    >
                                                        <Image
                                                            // resizeMethod='auto'
                                                            resizeMode='stretch'
                                                            source={{ uri: this.state.capturedImage && this.state.capturedImage.uri }}
                                                            // source={{ uri: capturedUri }}
                                                            style={[styles.camera,
                                                            {
                                                                // flex:1,
                                                                width: 330,
                                                                height: 330
                                                            }]}
                                                        >
                                                        </Image>
                                                    </Block>
                                                    <Block row style={{ justifyContent: "center" }}>
                                                        <EButton
                                                            title="Quét lại"
                                                            onPress={() => {
                                                                this.setState({
                                                                    isResult: false
                                                                })
                                                            }}
                                                            buttonStyle={{
                                                                borderColor: '#ecf0f1',
                                                                backgroundColor: "#ecf0f1",
                                                                padding: 5,
                                                            }}
                                                            type="outline"
                                                            raised
                                                            titleStyle={{
                                                                color: 'black',
                                                                fontSize: 18,
                                                            }}
                                                            containerStyle={{
                                                                width: '35%',
                                                                // height: 50,
                                                                marginTop: 5,
                                                                backgroundColor: "#ecf0f1",
                                                                flex: 0.3
                                                                //   marginBottom: theme.SIZES.BASE,
                                                                //   width: width - theme.SIZES.BASE * 2,
                                                            }}
                                                        />
                                                    </Block>

                                                    <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 8, paddingTop: 12 }}>
                                                        <Block style={styles.options}>
                                                            <Block style={[styles.defaultStyle, {
                                                            }]}>
                                                                <View
                                                                    style={{
                                                                        borderBottomColor: 'black',
                                                                        borderBottomWidth: 2,
                                                                    }}
                                                                />
                                                            </Block>
                                                        </Block>
                                                    </Block>

                                                    <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 0 }}>
                                                        <Block row style={styles.options}>
                                                            <Block flex row style={[styles.defaultStyle, {
                                                            }]}>
                                                                <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 10 }}>
                                                                    <Block row flex style={{ justifyContent: "center" }}>
                                                                        <View style={{ flex: 0.2, paddingTop: 8 }}>
                                                                            <Text
                                                                                style={{
                                                                                    fontFamily: "montserrat-regular",
                                                                                    // textTransform: "uppercase",
                                                                                    // marginRight: 100,
                                                                                    fontWeight: "700",
                                                                                }}
                                                                                size={18}
                                                                                bold={false}
                                                                                color={"#006464"}
                                                                            >
                                                                                Họ tên:
                                                                            </Text>
                                                                        </View>
                                                                        <View style={{ flex: 0.5 }}>
                                                                            <TextInput
                                                                                style={{
                                                                                    height: 40,
                                                                                    margin: 12,
                                                                                    borderWidth: 1,
                                                                                    padding: 10,
                                                                                }}
                                                                                placeholder="Họ và Tên"
                                                                                // label="Tên mẫu"
                                                                                // editable={!isExists}
                                                                                value={VisitorName}
                                                                                onChangeText={VisitorName => this.setState({ VisitorName })}
                                                                            />
                                                                        </View>
                                                                    </Block>
                                                                </View>
                                                            </Block>
                                                        </Block>
                                                    </Block>
                                                    <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 0 }}>
                                                        <Block row style={styles.options}>
                                                            <Block flex row style={[styles.defaultStyle, {
                                                            }]}>
                                                                <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 10, }}>
                                                                    <Block row flex style={{ justifyContent: "center" }}>
                                                                        <View style={{ flex: 0.2, paddingTop: 8 }}>
                                                                            <Text
                                                                                style={{
                                                                                    fontFamily: "montserrat-regular",
                                                                                    // textTransform: "uppercase",
                                                                                    // marginRight: 100,
                                                                                    fontWeight: "700",
                                                                                }}
                                                                                size={18}
                                                                                bold={false}
                                                                                color={"#006464"}
                                                                            >
                                                                                Đơn vị:
                                                                            </Text>
                                                                        </View>
                                                                        <View style={{ flex: 0.5 }}>
                                                                            <TextInput
                                                                                style={{
                                                                                    height: 40,
                                                                                    margin: 12,
                                                                                    borderWidth: 1,
                                                                                    padding: 10,
                                                                                }}
                                                                                placeholder="Tên đơn vị"
                                                                                // label="Tên mẫu"
                                                                                value={Company}
                                                                                onChangeText={Company => this.setState({ Company })}
                                                                            />
                                                                        </View>
                                                                    </Block>
                                                                </View>
                                                            </Block>
                                                        </Block>
                                                    </Block>
                                                    <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 0 }}>
                                                        <Block row style={styles.options}>
                                                            <Block flex row style={[styles.defaultStyle, {
                                                            }]}>
                                                                <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 10, }}>
                                                                    <Block row flex style={{ justifyContent: "center" }}>
                                                                        <View style={{ flex: 0.2, paddingTop: 8 }}>
                                                                            <Text
                                                                                style={{
                                                                                    fontFamily: "montserrat-regular",
                                                                                    // textTransform: "uppercase",
                                                                                    // marginRight: 100,
                                                                                    fontWeight: "700",
                                                                                }}
                                                                                size={18}
                                                                                bold={false}
                                                                                color={"#006464"}
                                                                            >
                                                                                Thời gian:
                                                                            </Text>
                                                                        </View>
                                                                        <View style={{ flex: 0.5 }}>
                                                                            <TouchableOpacity
                                                                                style={{
                                                                                }}
                                                                                onPress={() => {
                                                                                    this.setState({
                                                                                        modalDateTime: !this.state.modalDateTime
                                                                                    })
                                                                                }}>
                                                                                <TextInput
                                                                                    style={{
                                                                                        height: 40,
                                                                                        margin: 12,
                                                                                        borderWidth: 1,
                                                                                        padding: 10,
                                                                                        zIndex: 10
                                                                                    }}
                                                                                    placeholder="Thời gian"
                                                                                    value={TimePlan}
                                                                                    editable={false}
                                                                                    onTouchStart={() => {
                                                                                        this.setState({
                                                                                            modalDateTime: !this.state.modalDateTime
                                                                                        })
                                                                                    }}
                                                                                />
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    </Block>
                                                                </View>
                                                            </Block>
                                                        </Block>
                                                    </Block>
                                                    <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 0 }}>
                                                        <Block row style={styles.options}>
                                                            <Block flex row style={[styles.defaultStyle, {
                                                            }]}>
                                                                <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 10, }}>
                                                                    <Block row flex style={{ justifyContent: "center" }}>
                                                                        <View style={{ flex: 0.2, paddingTop: 8 }}>
                                                                            <Text
                                                                                style={{
                                                                                    fontFamily: "montserrat-regular",
                                                                                    // textTransform: "uppercase",
                                                                                    // marginRight: 100,
                                                                                    fontWeight: "700",
                                                                                }}
                                                                                size={18}
                                                                                bold={false}
                                                                                color={"#006464"}
                                                                            >
                                                                                Lý do:
                                                                            </Text>
                                                                        </View>
                                                                        <View style={{ flex: 0.5 }}>
                                                                            <TextInput
                                                                                style={{
                                                                                    height: 40,
                                                                                    margin: 12,
                                                                                    borderWidth: 1,
                                                                                    padding: 10,
                                                                                }}
                                                                                placeholder="Lý do hẹn"
                                                                                value={ReasonPlan}
                                                                                onChangeText={ReasonPlan => this.setState({ ReasonPlan })}
                                                                            />
                                                                        </View>
                                                                    </Block>
                                                                </View>
                                                            </Block>
                                                        </Block>
                                                    </Block>


                                                    <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 8 }}>
                                                        <Block style={styles.options}>
                                                            <Block style={[styles.defaultStyle, {
                                                            }]}>
                                                                <View
                                                                    style={{
                                                                        borderBottomColor: 'black',
                                                                        borderBottomWidth: 2,
                                                                    }}
                                                                />
                                                            </Block>
                                                        </Block>
                                                    </Block>
                                                    <View
                                                        style={{
                                                            bottom: 5,
                                                            flexDirection: 'row',
                                                            width: '100%',
                                                            padding: 4,
                                                            backgroundColor: 'white'
                                                        }}>
                                                        <EButton
                                                            disabled={isCheckSubmit}
                                                            title="Đăng ký lịch hẹn"
                                                            onPress={this.onRegisterClick}
                                                            buttonStyle={{
                                                                borderColor: '#20a8d8',
                                                                backgroundColor: "#20a8d8",
                                                                padding: 10,
                                                            }}
                                                            type="outline"
                                                            raised
                                                            titleStyle={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                            containerStyle={{
                                                                width: '35%',
                                                                marginTop: 10,
                                                                // height: 50,
                                                                backgroundColor: "#20a8d8",
                                                                flex: 0.7
                                                                //   marginBottom: theme.SIZES.BASE,
                                                                //   width: width - theme.SIZES.BASE * 2,
                                                            }}
                                                        />
                                                        <Text>{"  "}</Text>
                                                        <EButton
                                                            title="Trở về"
                                                            onPress={() => {
                                                                navigation.navigate('Onboarding', {
                                                                })
                                                            }}
                                                            buttonStyle={{
                                                                borderColor: '#20a8d8',
                                                                backgroundColor: "#20a8d8",
                                                                padding: 10,
                                                            }}
                                                            type="outline"
                                                            raised
                                                            titleStyle={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                            containerStyle={{
                                                                width: '35%',
                                                                // height: 50,
                                                                marginTop: 10,
                                                                backgroundColor: "#20a8d8",
                                                                flex: 0.3
                                                                //   marginBottom: theme.SIZES.BASE,
                                                                //   width: width - theme.SIZES.BASE * 2,
                                                            }}
                                                        />
                                                    </View>
                                                </View>

                                            </Fragment>)
                                                : (
                                                    <Fragment>
                                                        <TouchableOpacity
                                                            style={{
                                                                flex: 0,
                                                                width: 360,
                                                                borderRadius: 360,                                                                
                                                                backgroundColor: 'transparent',
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                alignSelf: 'center',
                                                                height: 360,                                                                                                                                
                                                                overflow: 'hidden'
                                                            }}
                                                            onPress={(event) => {
                                                                // console.log(event.nativeEvent)
                                                            }}
                                                        >
                                                            {previewVisible ? (<>
                                                                    <Image
                                                                        // resizeMethod='auto'
                                                                        resizeMode='stretch'
                                                                        source={{ uri: capturedImage && capturedImage.uri }}
                                                                        // source={{ uri: capturedUri }}
                                                                        style={[styles.camera,
                                                                        {
                                                                            // flex:1,
                                                                            // height: '97%'
                                                                        }]}
                                                                    >
                                                                    </Image>
                                                            </>): (
                                                            <Camera
                                                                // style={styles.camera}                                                        
                                                                style={{
                                                                    flex: 1,
                                                                    width: 360,
                                                                    height: 360,
                                                                }}
                                                                type={type}
                                                                zoom={Platform.OS === 'ios' ? 0.0005 : 0 }
                                                                // zoom={0.0005}
                                                                flashMode={typeFlash}
                                                                ratio="4:3"
                                                                {...this.state.propsFace}
                                                                onCameraReady={() => {
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
                                                                        <CountdownCircleTimer
                                                                            isPlaying={isPlaying}
                                                                            duration={3}
                                                                            strokeWidth={18}
                                                                            // colors={['#A30000', '#F7B801', '#004777', 'green']}
                                                                            // colorsTime={[3, 2, 1, 0]}
                                                                            colors={['#F7B801', 'green']}
                                                                            colorsTime={[1, 0]}
                                                                            size={360}
                                                                            key={this.state.key} />
                                                                    </View>    
                                                            </Camera>)}
                                                            {/* {this.state.faces.length ? this.renderFaces() : undefined} */}
                                                        </TouchableOpacity>
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
                                                            <Text style={styles.paragraph}>
                                                                {time} - {date_current}
                                                            </Text>
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
                                                    </Fragment>
                                                )}
                                    </View>
                                </SafeAreaView>
                            ) : (
                                <Fragment>
                                    <Block flex>
                                        <Block row>
                                            <View
                                                style={{
                                                    paddingLeft: 12
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: "montserrat-regular",
                                                        fontWeight: "700",
                                                    }}
                                                    size={18}
                                                    bold={false}
                                                    color={"#006464"}
                                                >
                                                    Mã Công Ty:
                                                </Text>
                                            </View>
                                        </Block>
                                        <Block row>
                                            <View>
                                                <TextInput
                                                    style={{
                                                        height: 80,
                                                        width: width - theme.SIZES.BASE * 2,
                                                        margin: 12,
                                                        borderWidth: 1,
                                                        padding: 10,
                                                    }}
                                                    placeholder="Vui lòng nhập mã công ty"
                                                    // label="Tên mẫu"
                                                    value={AppointmentCode}
                                                    onChangeText={AppointmentCode => this.setState({ AppointmentCode })}
                                                />
                                            </View>
                                        </Block>
                                        <Block row>
                                            <View style={{
                                                paddingLeft: 12,
                                                width: 400
                                            }}>
                                                <EButton
                                                    title="Gửi"
                                                    onPress={this.onSubmitCode}
                                                    buttonStyle={{
                                                        borderColor: '#3ea662',
                                                        backgroundColor: "#3ea662",
                                                    }}
                                                    type="outline"
                                                    raised
                                                    titleStyle={{
                                                        color: 'white',
                                                        fontSize: 18,
                                                    }}
                                                    containerStyle={{
                                                        width: '35%',
                                                        // height: 50,
                                                        backgroundColor: "#3ea662",
                                                    }}
                                                />
                                            </View>
                                        </Block>
                                    </Block>
                                </Fragment>
                            )}
                        </Fragment>
                    )}

                </View>
            )
        }
    }

    componentWillUnmount() {
        // EventRegister.removeEventListener(this.listener);
        // this._unsubscribe();
        // this.BackHandler = BackHandler.removeEventListener(
        //     "hardwareBackPress",
        //     this.backAction
        // )
    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {
        if (this.state.detectMotion && nextState.motion && this.state.motion) {
            if (
                Math.abs(nextState.motion.x - this.state.motion.x) < this.props.motionTolerance
                && Math.abs(nextState.motion.y - this.state.motion.y) < this.props.motionTolerance
                && Math.abs(nextState.motion.z - this.state.motion.z) < this.props.motionTolerance
            ) {
                //still
                this.detectFaces(true);
                this.detectMotion(false);
            } else {
                //moving
            }
        }

    }

    componentDidMount() {
        const timestamp = Date.now();
        Camera.getCameraPermissionsAsync()
            .then(result => {
                // console.log(result)
                this.setState({
                    session: timestamp,
                    permission: result.granted,
                    isLoading: false
                }, async () => {
                    if (!this.state.isLoading && this.state.permission) {
                        setInterval(() => {
                            // console.log(new Date().toLocaleString())
                            this.setState({                                
                                time: new Date(Date.now()).toLocaleTimeString(),
                                date_current: new Date(Date.now()).toLocaleDateString(),
                            })
                        }, 1000)
                    }
                })
            })
    }

    componentWillUnmount() {
        clearInterval(this.time, this.date_current)
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    paragraph: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'red',
        textAlignVertical: "center",
        justifyContent: "flex-start"
    },
    camera: {
        // flex: 1,
        // height: '85%',
        // width: "100%",
        flex: 0,
        // height: '100%',
        borderColor: "green",
        borderWidth: 10,
        width: 400,
        borderRadius: 360,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        height: 400,
        overflow: 'hidden'
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        // padding: 35,

        width: width - theme.SIZES.BASE * 1.2,
        paddingVertical: theme.SIZES.BASE * 0.5,
        paddingHorizontal: 2,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        color: 'red'
    },
    button: {
        borderRadius: 20,
        padding: 5,
        elevation: 2,
        width: 100,
    },
    buttonSubmit: {
        backgroundColor: 'rgba(24,206,15, 0.8)',
    },
    buttonClose: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonDelete: {
        backgroundColor: '#FF3636',
    },
    topBar: {
        flex: 0.2,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: Constants.statusBarHeight + 1,
    },
    bottomBar: {
        flex: 0.2,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    face: {
        padding: 10,
        borderWidth: 2,
        borderRadius: 1,
        position: 'absolute',
        borderColor: '#3b5998',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    faceText: {
        color: '#32CD32',
        fontWeight: 'bold',
        textAlign: 'left',
        margin: 2,
        backgroundColor: 'transparent',
    },
    facesContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        top: 0,
    },
    textcolor: {
        color: '#008080',
    },
    textStandard: {
        fontSize: 18,
        marginBottom: 20,
        color: 'white'
    },
    countdown: {
        fontSize: 40,
        color: 'white'
    },
    options: {
        // marginBottom: 24,
        // marginTop: 10,
        elevation: 4,
    },
    defaultStyle: {
        // paddingVertical: 15,
        paddingHorizontal: 8,
        color: "white"
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
        onupdateFaceRegisterVisitor: (Avatar, VisitorName, VisitorID, Company, CompanyCode, TimePlan, ReasonPlan, AppointmentCode, callback) => {
            dispatch(updateFaceRegisterVisitor(Avatar, VisitorName, VisitorID, Company, CompanyCode, TimePlan, ReasonPlan, AppointmentCode, callback))
        },
        oncheckAppointmentCode: (appointment_code, callback) => {
            dispatch(checkAppointmentCode(appointment_code, callback))
        },
        oncheckFaceLogin: (face, session, callback) => {
            dispatch(checkFaceLogin(face, session, callback))
        },
        onfetchVisitorDetail: (CompanyCode, VisitorCode, callback) => {
            dispatch(fetchVisitorDetail(CompanyCode, VisitorCode, callback))
        }
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CheckIn);