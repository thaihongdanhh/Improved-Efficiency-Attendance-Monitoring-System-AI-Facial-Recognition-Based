import { current } from '@reduxjs/toolkit';
import axios from 'axios';
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
    ActivityIndicator, Platform
} from 'react-native';
import { Button as EButton, Input, Card } from 'react-native-elements';
import { Block, theme, Text as GText } from 'galio-framework';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import moment from 'moment';
import * as FileSystem from 'expo-file-system';
import { connect } from 'react-redux';
import {
    checkFaceOut,
    fetchTimesheetPerson
} from '../store/actions/aiface';
import * as Device from 'expo-device';
import * as Progress from 'react-native-progress';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { w3cwebsocket as W3CWebSocket } from "websocket";
// import * as Location from 'expo-location';

let camera = Camera
let parentRef = ''
let childRef = ''
const { width } = Dimensions.get('screen');
const height = Math.round((width * 16) / 9);

class CheckOut extends React.Component {
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
            dataFaceCheck: [],
            isLoading: true,
            // dataFaceCheck: [{ "check_in": "VQ9H+GJW, QL1A, Linh Xuân, Thủ Đức, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3510.3, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "35.066381443271894", "lat_out": "", "long_in": "129.0816877979185", "long_out": "", "snapshot_date": "2023-02-17", "time_enter": "2023-02-17 13:27:05", "time_enter_format": "13:27:05", "time_enter_late": "05:27:05", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-17" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.01, "distance_out": 0.01, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789579681839763", "lat_out": "10.789579681839763", "long_in": "106.71968133762259", "long_out": "106.71968133762259", "snapshot_date": "2023-02-09", "time_enter": "2023-02-09 13:38:16", "time_enter_format": "13:38:16", "time_enter_late": "05:38:16", "time_leave": "2023-02-09 13:38:30", "time_leave_early": "03:21:30", "time_leave_format": "13:38:30", "total_working_hour": 0, "working_date": "2023-02-09" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789540511555128", "lat_out": "", "long_in": "106.71977028823788", "long_out": "", "snapshot_date": "2023-02-08", "time_enter": "2023-02-08 14:50:04", "time_enter_format": "14:50:04", "time_enter_late": "06:50:04", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-08" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "bảy", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 8.36, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.797056", "lat_out": "", "long_in": "106.643456", "long_out": "", "snapshot_date": "2023-02-04", "time_enter": "2023-02-04 15:29:06", "time_enter_format": "15:29:06", "time_enter_late": "07:29:06", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-04" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "năm", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": 0.02, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7894894", "lat_out": "10.789491", "long_in": "106.7195971", "long_out": "106.719528", "snapshot_date": "2023-02-02", "time_enter": "2023-02-02 09:50:33", "time_enter_format": "09:50:33", "time_enter_late": "01:50:33", "time_leave": "2023-02-02 11:14:12", "time_leave_early": "05:45:48", "time_leave_format": "11:14:12", "total_working_hour": 1.4, "working_date": "2023-02-02" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3.35, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7974327", "lat_out": "", "long_in": "106.6900316", "long_out": "", "snapshot_date": "2023-01-25", "time_enter": "2023-01-25 17:47:09", "time_enter_format": "17:47:09", "time_enter_late": "09:47:09", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-01-25" }]
            EmpCode:"",
            department_name: "",
            employee_name: ""

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
        console.log(faces)
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
                        { compress: 0, format: "png", base64: true }
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
                                if (message.data.split('|')[0] === 'facecheck') {
                                    this.setState({
                                        isLoadingFaceCheck: true,
                                    }, () => {
                                        const device_name = message.data.split('|')[1]
                                        const employee_code = message.data.split('|')[2]
                                        const status = message.data.split('|')[3]
                                        const session_match = message.data.split('|')[8]
                                        // console.log(status)

                                        if (String(session_match) === String(this.state.session)) {
                                            if (status === "no_meet_conditions_person") {
                                                dataFaceCheckArr = {
                                                    device_name,
                                                    employee_code,
                                                    status,
                                                    name: "Không thể nhận dạng",
                                                    idcard: "Không thể nhận dạng",
                                                    status_check: '-1'
                                                }
                                                client.close()
                                                // this.error('Chưa đăng ký thông tin')

                                                this.setState({
                                                    iscaptcha: false,
                                                    isFaceDetect: true,
                                                    isStepScanQR: false,
                                                    isQuetLai: true,
                                                    modalVerify: !this.state.modalVerify,
                                                    modalProcess: !this.state.modalProcess,
                                                }, () => { })

                                            }

                                            else if (status === 'meet_conditions_person') {
                                                // if (message.data.split('|')[6] === 'valid') {
                                                const idcard = message.data.split('|')[4]
                                                const name = message.data.split('|')[5]
                                                const km = message.data.split('|')[7]
                                                const address_check = message.data.split('|')[9]
                                                // console.log(address_check)
                                                //const ma_doi_tuong = message.data.split('|')[2]

                                                this.setState({
                                                    // modalSuccess: !this.state.modalSuccess,
                                                    km,
                                                    address_check,
                                                    EmpCode: idcard,
                                                    name
                                                }, () => {
                                                    let status_check = '1'
                                                    if (this.state.EmpCode.toUpperCase() !== idcard.toUpperCase()) {
                                                        status_check = '0'
                                                    }

                                                    dataFaceCheckArr = {
                                                        device_name,
                                                        employee_code,
                                                        status,
                                                        name,
                                                        idcard,
                                                        status_check
                                                    }

                                                    // this.success()
                                                    client.close()
                                                    const day = new Date()
                                                    const endDate = moment().format('YYYY-MM-DD');
                                                    const startDate = moment(new Date(day.setDate(day.getDate() - 30))).format('YYYY-MM-DD');

                                                    this.props.onfetchTimesheetPerson(idcard, startDate, endDate, dataFaceCheck => {
                                                        // console.log(dataFaceCheck)
                                                        this.setState({
                                                            employee_name: dataFaceCheck[0]['employee_name'],
                                                            department_name: dataFaceCheck[0]['department_name'],
                                                            dataFaceCheck: dataFaceCheck,
                                                            avatar_path: dataFaceCheck[0]['avatar_path'],
                                                            //modal: !this.state.modal,
                                                            isLoadingFaceCheck: false,
                                                            iscaptcha: false,
                                                            isResult: true,
                                                            isQuetLai: true,
                                                            modalSuccess: true,
                                                            modalProcess: !this.state.modalProcess,
                                                        }, () => {
                                                            setTimeout(() => {
                                                                this.setState({
                                                                    modal: false,
                                                                    modalSuccess: false
                                                                })
                                                            }, 3000)
                                                        })
                                                    })
                                                })

                                            }
                                        }
                                    })
                                }
                            })
                        };

                        // const base64 = await FileSystem.readAsStringAsync(this.state.capturedImage.uri, { encoding: 'base64' });

                        new Promise(() => {
                            client.onopen = () => {
                                console.log('WebSocket Client Connected');
                            };

                            this.props.oncheckFaceOut(croppedPhoto['base64'], this.state.session, this.state.lat, this.state.lng, response => {
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
            avatar_path
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
                                            {/* <EButton
                                                title="Kiểm tra"
                                                onPress={() => {
                                                    this.setState({
                                                        modalVerify: !this.state.modalVerify,
                                                        modalRegister: !this.state.modalRegister
                                                    })
                                                }}
                                                buttonStyle={{
                                                    borderColor: '#3b5998',
                                                    backgroundColor: '#3b5998'
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
                                            <Text>{'  '}</Text> */}
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
                                                    //   marginBottom: theme.SIZES.BASE,
                                                    //   width: width - theme.SIZES.BASE * 2,
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
                                        <Text style={styles.modalText}>Xin chào {this.state.name} ! Bạn đã chấm công thành công !</Text>
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
                            {startCamera ? (
                                <SafeAreaView style={{ flex: 1 }}>                 
                                    <View
                                        style={{
                                            flex: 1,
                                            width: '100%',
                                        }}>
                                        {
                                            // previewVisible && capturedImage !== null ? 
                                            // (
                                            //     <CameraPreview
                                            //         capturedUri={capturedUri}
                                            //         photo={capturedImage}
                                            //         savePhoto={
                                            //             async () => {
                                            //                 this.setState({
                                            //                     modalProcess: !this.state.modalProcess
                                            //                 }, async () => {
                                            //                     const base64 = await FileSystem.readAsStringAsync(capturedImage.uri, { encoding: 'base64' });
                                            //                     this.props.onfaceDetect(base64, response => {
                                            //                         // console.log(response)
                                            //                         if (response.status === 'exists') {
                                            //                             this.setState({
                                            //                                 modalSuccess: !this.state.modalSuccess,
                                            //                                 modalProcess: !this.state.modalProcess,
                                            //                                 name: response.identity,
                                            //                             }, () => {
                                            //                                 setTimeout(() => {
                                            //                                     this.setState({
                                            //                                         modalSuccess: !this.state.modalSuccess
                                            //                                     })
                                            //                                 }, 2000)
                                            //                             })
                                            //                         }

                                            //                         else {
                                            //                             this.setState({
                                            //                                 modalVerify: !this.state.modalVerify,
                                            //                                 modalProcess: !this.state.modalProcess
                                            //                             }, () => { })
                                            //                         }
                                            //                     })
                                            //                 })
                                            //             }
                                            //         }
                                            //         retakePicture={this.__retakePicture}
                                            //     />
                                            // ) 
                                            isResult ? (<Fragment>
                                                <View
                                                    style={{
                                                        flex: 1,
                                                        width: '100%',
                                                    }}>
                                                        <Block row
                                                            style={{
                                                                width: width - theme.SIZES.BASE * 2,
                                                                padding: 10,
                                                                height: 180,
                                                            }}
                                                        >
                                                            <Block style={{flex: 0.7}}>
                                                                <Text
                                                                    style={{
                                                                        flexDirection: "row",
                                                                        color: "red",
                                                                        height: 50,
                                                                        alignContent: "center",
                                                                        justifyContent: "space-between",
                                                                        fontWeight: "400",                                                                        
                                                                    }}
                                                                    size={32}
                                                                >
                                                                    KẾT QUẢ CHẤM CÔNG
                                                                </Text>
                                                                <Image
                                                                    style={{ width: 100, height: 100 }}
                                                                    source={{uri: `https://hr.ailab.vn/api/employee/avatar?avatar_path=` + avatar_path }} 
                                                                    // source={{ uri: `https://hr.ailab.vn/api/employee/avatar?avatar_path=uploads/employee/AI004/avatar/2023-02-02-10-40-12.png` }}
                                                                />
                                                            </Block>                                                            
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
                                                                    fontSize: 18,
                                                                }}
                                                                containerStyle={{
                                                                    flex: 0.3,
                                                                    width: '15%',
                                                                    height: 42,                                                                    
                                                                    backgroundColor: "#20a8d8",
                                                                    justifyContent: "flex-end"                                                                    
                                                                }}
                                                            />                                                                                                              
                                                        </Block>        
                                                        <Block row>
                                                            
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

                                                        <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 12 }}>
                                                            <Block row style={styles.options}>
                                                                <Block flex row style={[styles.defaultStyle, {
                                                                }]}>
                                                                    <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 10, }}>
                                                                        <Block row flex>
                                                                            <View style={{ flex: 0.3 }}>
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
                                                                                    Mã:
                                                                                </Text>
                                                                            </View>
                                                                            <View style={{ flex: 0.3 }}>
                                                                                <Text
                                                                                    style={{
                                                                                        fontFamily: "montserrat-regular",
                                                                                        // textTransform: "uppercase",                          
                                                                                        fontWeight: "700",
                                                                                    }}
                                                                                    size={18}
                                                                                    bold={false}
                                                                                    color={"#006464"}
                                                                                >
                                                                                    {EmpCode.split('_')[0]}
                                                                                </Text>
                                                                            </View>
                                                                        </Block>
                                                                    </View>
                                                                </Block>
                                                            </Block>
                                                        </Block>
                                                        <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 12 }}>
                                                            <Block row style={styles.options}>
                                                                <Block flex row style={[styles.defaultStyle, {
                                                                }]}>
                                                                    <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 10, }}>
                                                                        <Block row flex>
                                                                            <View style={{ flex: 0.3 }}>
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
                                                                                    Tên:
                                                                                </Text>
                                                                            </View>
                                                                            <View style={{ flex: 0.3 }}>
                                                                                <Text
                                                                                    style={{
                                                                                        fontFamily: "montserrat-regular",
                                                                                        // textTransform: "uppercase",                          
                                                                                        fontWeight: "700",
                                                                                    }}
                                                                                    size={18}
                                                                                    bold={false}
                                                                                    color={"#006464"}
                                                                                >
                                                                                    {employee_name}
                                                                                </Text>
                                                                            </View>
                                                                        </Block>
                                                                    </View>
                                                                </Block>
                                                            </Block>
                                                        </Block>
                                                        <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 12 }}>
                                                            <Block row style={styles.options}>
                                                                <Block flex row style={[styles.defaultStyle, {
                                                                }]}>
                                                                    <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 10, }}>
                                                                        <Block row flex>
                                                                            <View style={{ flex: 0.3 }}>
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
                                                                                    Phòng ban:
                                                                                </Text>
                                                                            </View>
                                                                            <View style={{ flex: 0.3 }}>
                                                                                <Text
                                                                                    style={{
                                                                                        fontFamily: "montserrat-regular",
                                                                                        // textTransform: "uppercase",                          
                                                                                        fontWeight: "700",
                                                                                    }}
                                                                                    size={18}
                                                                                    bold={false}
                                                                                    color={"#006464"}
                                                                                >
                                                                                    {department_name}
                                                                                </Text>
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
                                                    <ScrollView
                                                        style={{
                                                            flex: 1
                                                        }}
                                                        contentContainerStyle={{
                                                            width: width * 1.5,
                                                            height: 500,
                                                            paddingHorizontal: 10,
                                                        }}
                                                        horizontal
                                                    >
                                                        <ScrollView
                                                            style={{
                                                                width: width * 1.5,
                                                                height: 500,
                                                            }}
                                                        >
                                                            <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 12 }}>
                                                                <Block row style={styles.options}>
                                                                    <Block flex row style={[styles.defaultStyle, {
                                                                    }]}>
                                                                        <View style={{ flex: 1, flexDirection: 'row' }}>
                                                                            <Block row flex>                                                                               
                                                                                <View style={{ flex: 0.5 }}>
                                                                                    <Text
                                                                                        style={{
                                                                                            fontFamily: "montserrat-regular",
                                                                                            // textTransform: "uppercase",                          
                                                                                            fontWeight: "700",
                                                                                        }}
                                                                                        size={18}
                                                                                        bold={false}
                                                                                        color={"#006464"}
                                                                                    >
                                                                                        Ngày
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={{ flex: 0.4 }}>
                                                                                    <Text
                                                                                        style={{
                                                                                            fontFamily: "montserrat-regular",
                                                                                            // textTransform: "uppercase",                          
                                                                                            fontWeight: "700",
                                                                                        }}
                                                                                        size={18}
                                                                                        bold={false}
                                                                                        color={"#006464"}
                                                                                    >
                                                                                        Vào ca
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={{ flex: 0.4 }}>
                                                                                    <Text
                                                                                        style={{
                                                                                            fontFamily: "montserrat-regular",
                                                                                            // textTransform: "uppercase",                          
                                                                                            fontWeight: "700",
                                                                                        }}
                                                                                        size={18}
                                                                                        bold={false}
                                                                                        color={"#006464"}
                                                                                    >
                                                                                        Ra ca
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={{ flex: 0.2 }}>
                                                                                    <Text
                                                                                        style={{
                                                                                            fontFamily: "montserrat-regular",
                                                                                            // textTransform: "uppercase",                          
                                                                                            fontWeight: "700",
                                                                                        }}
                                                                                        size={18}
                                                                                        bold={false}
                                                                                        color={"#006464"}
                                                                                    >
                                                                                        Số giờ
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={{ flex: 0.5 }}>
                                                                                    <Text
                                                                                        style={{
                                                                                            fontFamily: "montserrat-regular",
                                                                                            // textTransform: "uppercase",                          
                                                                                            fontWeight: "700",
                                                                                        }}
                                                                                        size={18}
                                                                                        bold={false}
                                                                                        color={"#006464"}
                                                                                    >
                                                                                        Giải trình
                                                                                    </Text>
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
                                                            {dataFaceCheck.map((data, index) => {
                                                                return <Block key={index} style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 18 }}>
                                                                    <Block row style={styles.options}>
                                                                        <Block flex row style={[styles.defaultStyle, {
                                                                        }]}>
                                                                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                                                                <Block row flex>                                                                     
                                                                                    <View style={{ flex: 0.5 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                fontFamily: "montserrat-regular",
                                                                                                // textTransform: "uppercase",                          
                                                                                                fontWeight: "500",
                                                                                            }}
                                                                                            size={18}
                                                                                            bold={false}
                                                                                            color={"#006464"}
                                                                                        >
                                                                                            {data.snapshot_date}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View style={{ flex: 0.4 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                fontFamily: "montserrat-regular",
                                                                                                // textTransform: "uppercase",                          
                                                                                                fontWeight: "500",
                                                                                            }}
                                                                                            size={18}
                                                                                            bold={false}
                                                                                            color={"#006464"}
                                                                                        >
                                                                                            {data.time_enter_format}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View style={{ flex: 0.4 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                fontFamily: "montserrat-regular",
                                                                                                // textTransform: "uppercase",                          
                                                                                                fontWeight: "500",
                                                                                            }}
                                                                                            size={18}
                                                                                            bold={false}
                                                                                            color={"#006464"}
                                                                                        >
                                                                                            {data.time_leave_format}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View style={{ flex: 0.2 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                fontFamily: "montserrat-regular",
                                                                                                // textTransform: "uppercase",                          
                                                                                                fontWeight: "500",
                                                                                            }}
                                                                                            size={18}
                                                                                            bold={false}
                                                                                            color={"#006464"}
                                                                                        >
                                                                                            {data.total_working_hour}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View style={{ flex: 0.5 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                fontFamily: "montserrat-regular",
                                                                                                // textTransform: "uppercase",                          
                                                                                                fontWeight: "500",
                                                                                            }}
                                                                                            size={18}
                                                                                            bold={false}
                                                                                            color={"#006464"}
                                                                                        >
                                                                                            {data.explan_text}
                                                                                        </Text>
                                                                                    </View>
                                                                                </Block>
                                                                            </View>
                                                                        </Block>
                                                                    </Block>
                                                                </Block>
                                                            })}
                                                        </ScrollView>
                                                    </ScrollView>
                                                </View>
                                            </Fragment>)
                                                : (
                                                    <Fragment>
                                                        <TouchableOpacity
                                                            style={{
                                                                flex: 0,
                                                                // height: '100%',
                                                                // borderColor: "green",
                                                                // borderWidth: 10,
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
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#fff',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    <TouchableOpacity
                                        onPress={this.__startCamera}
                                        style={{
                                            width: 300,
                                            borderRadius: 360,
                                            backgroundColor: '#3b5998',
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: 300,
                                        }}>
                                        <Text
                                            style={{
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                fontSize: 24
                                            }}>
                                            CHECK IN
                                        </Text>
                                    </TouchableOpacity>
                                </View>
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
                    permission: result.granted,
                }, async () => {
                    new Promise(async () => {
                        // let { status } = await Location.requestForegroundPermissionsAsync();
                        // if (status !== 'granted') {
                        //     console.log('Permission to access location was denied');
                        //     return;
                        // }

                        // else {                            
                            try {
                                axios.get("https://api-bdc.net/data/ip-geolocation-with-confidence?key=bdc_533a81b335a94b11afa578755b7f8970")
                                    .then(res => {
                                        console.log(res["data"]["location"])
                                        const location = res["data"]["location"]
                                        const now = new Date()
                                        // console.log(location)
                                        this.setState({
                                            session: timestamp,
                                            time: now.toLocaleTimeString(),
                                            lat: parseFloat(location.latitude),
                                            lng: parseFloat(location.longitude),
                                            isLoading: false
                                        }, () => {
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


                            //     let location = await Location.getCurrentPositionAsync({});
                            //     console.log(location)
                            //     this.setState({
                            //         lat: location.coords['latitude'],
                            //         lng: location.coords['longitude'],
                            //         isLoading: false
                            //     }, () => {
                            //         if (!this.state.isLoading && this.state.permission) {
                            //             setInterval(() => {
                            //                 // console.log(new Date().toLocaleString())
                            //                 this.setState({
                            //                     session: timestamp,
                            //                     time: new Date(Date.now()).toLocaleTimeString(),
                            //                     date_current: new Date(Date.now()).toLocaleDateString(),
                            //                 })
                            //             }, 1000)
                            //         }
                            //     })
                            } catch (e) {
                                console.log(e)
                            }   
                        // }
                    })
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
        // onuploadImages: (filename, project_name, device_id, file_path, file_path_cropped, callback) => {
        //     dispatch(uploadImages(filename, project_name, device_id, file_path, file_path_cropped, callback));
        // },
        // oncropImages: (image, filename, project_name, device_id, callback) => {
        //     dispatch(cropImages(image, filename, project_name, device_id, callback));
        // },
        // onfaceDetect: (image, callback) => {
        //     dispatch(faceDetect(image, callback))
        // },
        // onfaceRegister: (image, name ,callback) => {
        //     dispatch(faceRegister(image, name, callback))
        // }
        oncheckFaceOut: (face, EmpCode, lat, lng, callback) => {
            dispatch(checkFaceOut(face, EmpCode, lat, lng, callback))
        },
        onfetchTimesheetPerson: (EmpCode, start_date, end_date, callback) => {
            dispatch(fetchTimesheetPerson(EmpCode, start_date, end_date, callback))
        },
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CheckOut);