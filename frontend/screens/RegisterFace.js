import { current } from '@reduxjs/toolkit'
import { Camera, CameraType, FlashMode } from 'expo-camera'
import * as FaceDetector from 'expo-face-detector'
import Constants from 'expo-constants'
import { DeviceMotion } from 'expo-sensors'
import React, { Fragment, useState } from 'react'
import ReactNative, {
  BackHandler,
  Image,
  SafeAreaView,
  ScrollView,
  LogBox,
  Pressable,
  Modal,
  Alert,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native'
import { Button as EButton, Input, Card } from 'react-native-elements'
import { Block, theme, Text as GText } from 'galio-framework'
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator'
import moment from 'moment'
import * as FileSystem from 'expo-file-system'
import { connect } from 'react-redux'
import {
  checkFaceLogin,
  fetchEmployeeDetail,
  updateFaceRegister,
  checkAppointmentCode
} from '../store/actions/aiface'
import * as Device from 'expo-device'
import * as Progress from 'react-native-progress'
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { w3cwebsocket as W3CWebSocket } from 'websocket'
// import * as Location from 'expo-location';

import * as tf from '@tensorflow/tfjs'
// import * as posedetection from '@tensorflow-models/pose-detection'
// import * as faceDetection from '@tensorflow-models/face-landmarks-detection'
import * as faceDetection from '@tensorflow-models/face-detection'
import * as ScreenOrientation from 'expo-screen-orientation'
import {
  bundleResourceIO,
  cameraWithTensors
} from '@tensorflow/tfjs-react-native'
import Svg, { Circle, Rect } from 'react-native-svg'
import { ExpoWebGLRenderingContext } from 'expo-gl'
import base64 from 'react-native-base64'
import { Buffer } from 'buffer'
import * as MediaLibrary from 'expo-media-library'
import * as jpeg from 'jpeg-js'

import { Amplify, Auth, Storage } from 'aws-amplify'
import awsconfig from './aws-exports'

Amplify.configure(awsconfig)

// tslint:disable-next-line: variable-name
const TensorCamera = cameraWithTensors(Camera)

const IS_ANDROID = Platform.OS === 'android'
const IS_IOS = Platform.OS === 'ios'

// const model = faceDetection.SupportedModels.MediaPipeFaceMesh;
// const detectorConfig = {
//   runtime: 'mediapipe', // or 'tfjs'
// }
// const detector = await faceDetection.createDetector(model, detectorConfig);

// Camera preview size.
//
// From experiments, to render camera feed without distortion, 16:9 ratio
// should be used fo iOS devices and 4:3 ratio should be used for android
// devices.
//
// This might not cover all cases.
const CAM_PREVIEW_WIDTH = Dimensions.get('window').width
const CAM_PREVIEW_HEIGHT = CAM_PREVIEW_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4)

// The score threshold for pose detection results.
const MIN_KEYPOINT_SCORE = 0.3

// The size of the resized output from TensorCamera.
//
// For movenet, the size here doesn't matter too much because the model will
// preprocess the input (crop, resize, etc). For best result, use the size that
// doesn't distort the image.
const OUTPUT_TENSOR_WIDTH = 360
const OUTPUT_TENSOR_HEIGHT = OUTPUT_TENSOR_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4)

// Whether to auto-render TensorCamera preview.
const AUTO_RENDER = false

// Whether to load model from app bundle (true) or through network (false).
const LOAD_MODEL_FROM_BUNDLE = false

let camera = Camera
let parentRef = ''
let childRef = ''
const { width } = Dimensions.get('screen')
const height = Math.round((width * 16) / 9)

class CheckIn extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      type: CameraType.front,
      typeFlash: FlashMode.off,
      startCamera: true,
      modalInvalid: false,
      isInvalid: false,
      previewVisible: false,
      modalProcess: false,
      modalSuccess: false,
      modalRegister: false,
      modalVerify: false,
      modalRegisterSuccess: false,
      modalError: false,
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
      inValidText: '',
      successMessage: '',
      borderColor: 'red',
      isPlaying: false,
      key: 0,
      time: new Date(Date.now()).toLocaleTimeString(),
      date_current: new Date(Date.now()).toLocaleDateString(),
      timestamp: '',
      avatar_path: '',
      isResult: false,
      isCheckSubmit: false,
      dataFaceCheck: [],
      isLoading: true,
      // dataFaceCheck: [{ "check_in": "VQ9H+GJW, QL1A, Linh Xuân, Thủ Đức, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3510.3, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "35.066381443271894", "lat_out": "", "long_in": "129.0816877979185", "long_out": "", "snapshot_date": "2023-02-17", "time_enter": "2023-02-17 13:27:05", "time_enter_format": "13:27:05", "time_enter_late": "05:27:05", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-17" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.01, "distance_out": 0.01, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789579681839763", "lat_out": "10.789579681839763", "long_in": "106.71968133762259", "long_out": "106.71968133762259", "snapshot_date": "2023-02-09", "time_enter": "2023-02-09 13:38:16", "time_enter_format": "13:38:16", "time_enter_late": "05:38:16", "time_leave": "2023-02-09 13:38:30", "time_leave_early": "03:21:30", "time_leave_format": "13:38:30", "total_working_hour": 0, "working_date": "2023-02-09" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789540511555128", "lat_out": "", "long_in": "106.71977028823788", "long_out": "", "snapshot_date": "2023-02-08", "time_enter": "2023-02-08 14:50:04", "time_enter_format": "14:50:04", "time_enter_late": "06:50:04", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-08" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "bảy", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 8.36, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.797056", "lat_out": "", "long_in": "106.643456", "long_out": "", "snapshot_date": "2023-02-04", "time_enter": "2023-02-04 15:29:06", "time_enter_format": "15:29:06", "time_enter_late": "07:29:06", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-04" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "năm", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": 0.02, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7894894", "lat_out": "10.789491", "long_in": "106.7195971", "long_out": "106.719528", "snapshot_date": "2023-02-02", "time_enter": "2023-02-02 09:50:33", "time_enter_format": "09:50:33", "time_enter_late": "01:50:33", "time_leave": "2023-02-02 11:14:12", "time_leave_early": "05:45:48", "time_leave_format": "11:14:12", "total_working_hour": 1.4, "working_date": "2023-02-02" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3.35, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7974327", "lat_out": "", "long_in": "106.6900316", "long_out": "", "snapshot_date": "2023-01-25", "time_enter": "2023-01-25 17:47:09", "time_enter_format": "17:47:09", "time_enter_late": "09:47:09", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-01-25" }]
      EmpCode: '',
      EmpName: '',
      DeptValue: '',
      department_name: '',
      employee_name: '',
      isExists: false,
      isLoadingEmployee: true,
      isAppointmentCode: false,
      AppointmentCode: ''
    }
  }

  static defaultProps = {
    countDownSeconds: 1,
    motionInterval: 500, //ms between each device motion reading
    motionTolerance: 1, //allowed variance in acceleration
    cameraType: Camera.Constants.Type.front //front vs rear facing camera
  }

  countDownTimer = null

  backAction = () => {
    const { navigation, route } = this.props
    // navigation.navigate('WeightFolder', {
    //     isBack: true,
    //     labelName: route.params['labelName'],
    //     username: route.params['username'],
    //     weightName: route.params['weightName']
    //   })
    return true
  }

  detectMotion = doDetect => {
    this.setState({
      detectMotion: doDetect
    })
    if (doDetect) {
      DeviceMotion.setUpdateInterval(this.props.motionInterval)
    } else if (!doDetect && this.state.faceDetecting) {
      this.motionListener.remove()
    }
  }

  onDeviceMotion = rotation => {
    this.setState({
      motion: rotation.accelerationIncludingGravity
    })
  }

  detectFaces (doDetect) {
    this.setState({
      faceDetecting: doDetect
    })
  }

  handleFaceDetectionError = () => {
    //
  }
  handleFacesDetected = ({ faces }) => {
    // console.log(faces)
    if (faces.length === 1) {
      // console.log(faces[0].rollAngle.toFixed(0) <= 10)
      if (
        (faces[0].rollAngle.toFixed(0) <= 10 ||
          faces[0].rollAngle.toFixed(0) >= 350) &&
        (faces[0].yawAngle.toFixed(0) <= 10 ||
          faces[0].yawAngle.toFixed(0) >= 350)
      ) {
        this.setState(
          {
            faceDetected: true,
            faceValid: true,
            isPlaying: true,
            borderColor: 'green',
            inValidText: '',
            countDownStarted: true,
            faces
          },
          () => {}
        )
      } else if (
        (faces[0].rollAngle.toFixed(0) <= 10 ||
          faces[0].rollAngle.toFixed(0) >= 350) &&
        10 < faces[0].yawAngle.toFixed(0) < 350
      ) {
        this.setState(
          {
            faceDetected: true,
            faceValid: false,
            borderColor: 'red',
            isPlaying: false,
            inValidText: 'Vui lòng nhìn thẳng !',
            faceDetected: false,
            faces
          },
          () => {}
        )
        this.cancelCountDown()
      } else if (
        10 < faces[0].rollAngle.toFixed(0) < 350 &&
        (faces[0].yawAngle.toFixed(0) <= 10 ||
          faces[0].yawAngle.toFixed(0) >= 350)
      ) {
        this.setState(
          {
            faceDetected: true,
            faceValid: false,
            borderColor: 'red',
            isPlaying: false,
            inValidText: 'Vui lòng nhìn thẳng !',
            faceDetected: false,
            faces
          },
          () => {}
        )
        this.cancelCountDown()
      } else {
        this.setState(
          {
            faceDetected: true,
            faceValid: false,
            borderColor: 'red',
            isPlaying: false,
            inValidText: 'Vui lòng nhìn thẳng !',
            faceDetected: false,
            faces
          },
          () => {}
        )
        this.cancelCountDown()
      }

      if (
        !this.state.faceDetected &&
        !this.state.countDownStarted &&
        !this.state.faceValid
      ) {
        this.initCountDown()
      }
    } else {
      this.setState({
        faceDetected: false,
        isPlaying: false
      })
      this.cancelCountDown()
    }
  }

  initCountDown = () => {
    this.setState({
      countDownStarted: true
    })
    this.countDownTimer = setInterval(this.handleCountDownTime, 1000)
  }
  cancelCountDown = () => {
    clearInterval(this.countDownTimer)
    this.setState({
      countDownSeconds: this.props.countDownSeconds,
      countDownStarted: false,
      key: this.state.key + 1
    })
  }
  handleCountDownTime = () => {
    if (this.state.countDownSeconds > 0) {
      let newSeconds = this.state.countDownSeconds - 1
      this.setState({
        countDownSeconds: newSeconds
      })
    } else {
      this.setState(
        {
          modalProcess: !this.state.modalProcess,
          faceDetecting: false,
          isPlaying: false,
          countDownStarted: false,
          propsFace: {
            onFacesDetected: undefined
          }
        },
        () => {
          if (camera) {
            console.log('take picture')
            this.onPictureSaved()
            // const options = {base64:true, quality: 0.5, onPictureSaved: this.onPictureSaved};
            // const options = { onPictureSaved: this.onPictureSaved }
            // camera.takePictureAsync(options)
          }

          this.cancelCountDown()
        }
      )
    }
  }

  getImageDimensions = ({ width, height } = FaceDetector.Image) => {
    if (width > height) {
      const scaledHeight = (pictureSize * height) / width
      return {
        width: pictureSize,
        height: scaledHeight,

        scaleX: pictureSize / width,
        scaleY: scaledHeight / height,

        offsetX: 0,
        offsetY: (pictureSize - scaledHeight) / 2
      }
    } else {
      const scaledWidth = (pictureSize * width) / height
      return {
        width: scaledWidth,
        height: pictureSize,

        scaleX: scaledWidth / width,
        scaleY: pictureSize / height,

        offsetX: (pictureSize - scaledWidth) / 2,
        offsetY: 0
      }
    }
  }

  isPortrait = () => {
    return (
      this.state.orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
      this.state.orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
    )
  }

  getOutputTensorWidth = () => {
    // On iOS landscape mode, switch width and height of the output tensor to
    // get better result. Without this, the image stored in the output tensor
    // would be stretched too much.
    //
    // Same for getOutputTensorHeight below.
    return this.isPortrait() || IS_ANDROID
      ? OUTPUT_TENSOR_WIDTH
      : OUTPUT_TENSOR_HEIGHT
  }

  getOutputTensorHeight = () => {
    return this.isPortrait() || IS_ANDROID
      ? OUTPUT_TENSOR_HEIGHT
      : OUTPUT_TENSOR_WIDTH
  }

  //   if (this.state.rafId.current != null && this.state.rafId.current !== 0) {
  //     cancelAnimationFrame(this.state.rafId.current)
  //     this.setState({
  //         rafId: {
  //             current: 0
  //         }
  //     })
  //   }

  sleep = ms => new Promise(
    resolve => setTimeout(resolve, ms)
  );

  handleCameraStream = async (images, updatePreview, gl) => {
    let faces = []
    // console.log(this.state.faceDetecting)
    try {
      const loop = async () => {
        if (!this.state.faceDetected) {
          const detectorConfig = {
            runtime: 'tfjs' // or 'tfjs'
            // solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            // refineLandmarks: false
          }

          const detector = await faceDetection.createDetector(
            faceDetection.SupportedModels.MediaPipeFaceDetector,
            detectorConfig
          )

          //   Get the tensor and run pose detection.
          // console.log('Vô vòng loop')          
          const nextImageTensor = images.next().value
          //   console.log(nextImageTensor)
          await this.sleep(500)
          faces = await detector.estimateFaces(nextImageTensor)
          //   console.log(faces)
          if (faces && faces.length !== 0) {
            this.setState({
              faceDetected: true,
              faceDetecting: false,
              nextImageTensor,
              faces
            })
          }
          //   if(faces && faces.length !== 0){
          //     this.handleFacesDetected(faces)
          //   }
          //   this.setState({
          //     faces
          //     })

          //   tf.dispose([nextImageTensor])
          requestAnimationFrame(loop)
        } else {
          if (faces && faces.length !== 0) {
            // this.handleFacesDetected(faces)
            this.setState(
              {
                faceDetected: true,
                faceValid: true,
                borderColor: 'green',
                inValidText: '',
                countDownStarted: true,
                isPlaying: true,
                faces
              },
              () => {
                this.initCountDown()
              }
            )
          }
        }
      }
      await this.sleep(500)
      loop()
    } catch (e) {
      console.log(e)
    }
  }

  pathToImageFile = async (uri, pathToImageFile) => {
    try {
      const response = await fetch(uri);      
      const blob = await response.blob();     
      await Storage.put(pathToImageFile, blob, {
        contentType: 'image/jpeg'
      }); 
    } catch (err) {
      console.log('Error uploading file:', err);
    }
}

  onPictureSaved = async photo => {
    const { faces, nextImageTensor } = this.state
    // console.log('OK nè ')
    
    // console.log(faces)
    const cropData = {
        originX: faces[0]['box']['xMin'],
        originY: faces[0]['box']['yMin'],
        width: faces[0]['box']['width'],
        height: faces[0]['box']['height']
        }             
        
        const height = nextImageTensor.shape[0]
        const width = nextImageTensor.shape[1]
        const data = new Buffer(
            // concat with an extra alpha channel and slice up to 4 channels to handle 3 and 4 channels tensors
            tf.concat([nextImageTensor, tf.ones([height, width, 1]).mul(255)], [-1])
            .slice([0], [height, width, 4])
            .dataSync(),
        )

        const rawImageData = {data, width, height};
        const jpegImageData = jpeg.encode(rawImageData);

        const imgBase64 = tf.util.decodeString(jpegImageData.data, "base64")

        const salt = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
        const uri = FileSystem.documentDirectory + `tensor-${salt}.jpg`;
        // console.log(uri)
        await FileSystem.writeAsStringAsync(uri, imgBase64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('Tới đây okie nè ! 2')        

        let croppedPhoto = await manipulateAsync(
            uri,
        [{ crop: cropData }, { resize: { width: 336 } }],
        { compress: 0, format: 'jpeg', base64: true }   
        )        

        const cachedAsset = await MediaLibrary.createAssetAsync(croppedPhoto['uri']);
        // saved the asset uri

        const album = await MediaLibrary.getAlbumAsync('GWA');
        // check if the album if exist if return null you need to create an album.
      
        if (album === null) {
            // insert an album name with image
            const asset = await MediaLibrary.createAssetAsync(croppedPhoto['uri']);
            MediaLibrary.createAlbumAsync('GWA', asset)
                .then(() => {
                    console.log('Album created!');
                    Alert.alert('Image has been saved')
                    this.setState({ cameraRollUri: asset }); 
                })
                .catch(error => {
                    Alert.alert(`Opps there's something wrong`)
                    console.log('err', error);
                });
        } else {
            // if album exist asset added
            let assetAdded = await MediaLibrary.addAssetsToAlbumAsync(
                [cachedAsset],
                album,
                false
            );
        }

        await this.pathToImageFile(croppedPhoto['uri'], `tensor-${salt}.jpg`)

          this.setState(
            {
              previewVisible: !this.state.previewVisible,
              capturedImage: imgBase64
            },
            async () => {
              let dataFaceCheckArr = []         
              new Promise(() => {
                this.props.oncheckFaceLogin(
                  imgBase64,
                  this.state.session,
                  croppedPhoto['base64'],
                  response => {
                    // console.log(response.file)                    
                    if(response.status === 'not_exists' || response.status === 'exists'){
                      this.setState(
                        {                        
                          name: response.status === 'exists' ? response.name : "",
                          isResult:true,
                          capturedImage: response.file,
                          modalProcess: false
                        },
                        () => {  }
                      )
                    } else if (response.status === 'invalid') {
                      console.log(response.text)
                      this.setState({
                        modalProcess: false,
                        // modalSuccess: true,
                        modalInvalid: true,
                        isInvalid: true,
                        text: response.text,
                        // name: response.name,
                        previewVisible: true,
                        capturedImage: response.file
                      },() => {
                        setTimeout(() => {
                          this.setState({
                            modalInvalid: false,
                            
                          })
                        }, 5000)
                      })
                    } else {
                      setTimeout(() => {
                        this.setState({                            
                          modalProcess: false,
                          faceDetecting: true,
                          previewVisible: false,                   
                        })
                      }, 3000)
                    }                    
                  }
                )
              })
            }
          )              
  }

  onRegisterClick = () => {
    this.setState(
      {
        isCheckSubmit: true
      },
      async () => {
        const { EmpCode, EmpName, CompanyCode, capturedImage } = this.state

        // const base64 = await FileSystem.readAsStringAsync(capturedImage.uri, { encoding: 'base64' });
        //console.log(Image)
        let err = 0

        if (EmpName === '') {
          err = 1
          this.setState({
            modalVerify: !this.state.modalVerify
          })
        }

        if (err === 0) {
          this.props.onupdateFaceRegister(
            this.state.capturedImage,          
            EmpName,
            response => {
              if (response.status !== 'fail') {
                this.setState(
                  {
                    // Image: "",
                    // EmpCode: "",
                    // EmpName: "",
                    // CompanyCode: "",
                    // DeptValue: "",
                    // isFaceDetect: true,
                    successMessage: 'Register Successfully !',
                    modalSuccess: !this.state.modalSuccess
                  },
                  () => {
                    setTimeout(() => {
                      this.setState({
                        modalSuccess: false
                      })
                    }, 3000)
                  }
                )
              } else {
                this.setState({
                  modalVerify: !this.state.modalVerify
                })
              }
            }
          )
        }
      }
    )
  }

  onSubmitCode = () => {
    const { AppointmentCode } = this.state
    console.log(AppointmentCode)
    if (AppointmentCode === '') {
      this.setState(
        {
          errorMessage: 'Vui lòng nhập Mã công ty !',
          modalError: !this.state.modalError
        },
        () => {
          setTimeout(() => {
            this.setState({
              modalError: false
            })
          }, 1500)
        }
      )
    } else {
      this.props.oncheckAppointmentCode(AppointmentCode, response => {
        if (response.status === 'not_exists') {
          this.setState(
            {
              errorMessage:
                'Mã công ty không đúng !\n Vui lòng liên hệ công ty để xác nhận.',
              modalError: !this.state.modalError
            },
            () => {
              setTimeout(() => {
                this.setState({
                  modalError: false
                })
              }, 1500)
            }
          )
        } else if (response.status === 'exists') {
          this.setState(
            {
              CompanyCode: response.company_code,
              isAppointmentCode: false,
              successMessage:
                'Mã công ty hợp lệ ! \nChào mừng bạn đến website công ty ' +
                response.company_name,
              modalSuccess: !this.state.modalSuccess,
              company_name: response.company_name
            },
            () => {
              setTimeout(() => {
                this.setState({
                  modalSuccess: false
                })
              }, 1500)
            }
          )
        }
      })
    }
  }

  renderFaces = () => (
    <View style={styles.facesContainer} pointerEvents='none'>
      {this.state.faces.map(this.renderFace)}
    </View>
  )

  renderFace ({ bounds, faceID, rollAngle, yawAngle }) {
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
            { rotateY: `${yawAngle.toFixed(0)}deg` }
          ]}
          style={[
            styles.face,
            {
              ...bounds.size,
              left: bounds.origin.x,
              top: bounds.origin.y
            }
          ]}
        ></View>
      </Fragment>
    )
  }

  render () {
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
      AppointmentCode
    } = this.state

    const { navigation, route } = this.props

    if (isLoading) {
      // return <View />
      return (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator
            style={{ width: 300, height: 300 }}
            color={'black'}
          />
        </View>
      )
    } else if (!isLoading) {
      return (
        <View style={styles.container}>
          {!permission ? (
            Alert.alert('Cấp quyền', `Cấp quyền truy cập Camera !`, [
              {
                text: 'Cấp quyền',
                onPress: () => {
                  Promise.all(
                    Camera.requestCameraPermissionsAsync().then(result => {
                      console.log('Camera Permission', result)
                      this.setState({
                        permission: result
                      })
                    })
                  )
                }
              },
              {
                text: 'Hủy bỏ',
                onPress: () => {},
                style: 'cancel'
              }
            ])
          ) : (
            <Fragment>
              <Modal
                animationType='slide'
                transparent={true}
                visible={modalProcess}
                // key={this.state.data2['index']}
                onRequestClose={() => {
                  // Alert.alert('Modal has been closed.');
                  // this.setModalVisible(!modalProcess);
                  // this.setState({
                  //     modalProcess: !this.state.modalProcess
                  // })
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <Text style={styles.modalText}>
                      Processing ... ! Please wait{' '}
                    </Text>
                    <Block row center space='between'>
                      <Progress.CircleSnail color={['red', 'green', 'blue']} />
                    </Block>
                  </View>
                </View>
              </Modal>
              <Modal
                animationType='slide'
                transparent={true}
                visible={modalError}
                onRequestClose={() => {
                  this.setState({
                    modalError: !this.state.modalError
                  })
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <Text style={styles.modalText}>
                      {' '}
                      {this.state.errorMessage}{' '}
                    </Text>
                    <Block row center space='between'>
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
                animationType='slide'
                transparent={true}
                visible={modalVerify}
                // key={this.state.data2['index']}
                onRequestClose={() => {
                  // Alert.alert('Modal has been closed.');
                  // this.setModalVisible(!modalSuccess);
                  this.setState({
                    modalVerify: false
                  })
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <Text style={styles.modalText}>
                      Chưa đăng ký thông tin !
                    </Text>
                    <Block row center space='between' style={{ marginTop: 20 }}>
                      <EButton
                        title='Cancel'
                        onPress={() => {
                          this.setState({
                            modalVerify: false
                          })
                        }}
                        buttonStyle={{
                          borderColor: '#8B8B8B',
                          backgroundColor: '#8B8B8B'
                        }}
                        type='outline'
                        raised
                        titleStyle={{ color: 'white', fontSize: 20 }}
                        containerStyle={{
                          width: '45%',
                          marginHorizontal: 5,
                          borderRadius: 20,
                          marginVertical: 20
                        }}
                      />
                    </Block>
                  </View>
                </View>
              </Modal>
              <Modal
                animationType='slide'
                transparent={true}
                visible={modalSuccess}
                // key={this.state.data2['index']}
                onRequestClose={() => {
                  // Alert.alert('Modal has been closed.');
                  // this.setModalVisible(!modalSuccess);
                  this.setState({
                    modalSuccess: !this.state.modalSuccess
                  })
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    {/* <Text style={styles.modalText}>{'Mã công ty hợp lệ ! \nChào mừng bạn đến website công ty ' + this.state.company_name}</Text> */}
                    <Text style={styles.modalText}>
                      {this.state.successMessage}
                    </Text>
                    <Block row center space='between'>
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
                      width: '100%'
                    }}
                  >
                    {isResult ? (
                      <Fragment>
                        <View
                          style={{
                            width: '100%'
                          }}
                        >
                          <Block
                            row
                            style={{
                              // width: width - theme.SIZES.BASE * 2,
                              height: 350,
                              flexDirection: 'row',
                              justifyContent: 'center',
                              alignItems: 'center',
                              alignSelf: 'center'
                            }}
                          >
                            <Image
                              // resizeMethod='auto'
                              resizeMode='stretch'
                              source={{
                                uri:
                                'data:image/png;base64,' + this.state.capturedImage
                              }}
                              // source={{ uri: capturedUri }}
                              style={[
                                styles.camera,
                                {
                                  // flex:1,
                                  width: 330,
                                  height: 330
                                }
                              ]}
                            ></Image>
                          </Block>
                          <Block row style={{ justifyContent: 'center' }}>
                            <EButton
                              title='Re-scan'
                              onPress={() => {
                                this.setState({
                                  isResult: false
                                })
                              }}
                              buttonStyle={{
                                borderColor: '#ecf0f1',
                                backgroundColor: '#ecf0f1',
                                padding: 5
                              }}
                              type='outline'
                              raised
                              titleStyle={{
                                color: 'black',
                                fontSize: 18
                              }}
                              containerStyle={{
                                width: '35%',
                                // height: 50,
                                marginTop: 5,
                                backgroundColor: '#ecf0f1',
                                flex: 0.3
                                //   marginBottom: theme.SIZES.BASE,
                                //   width: width - theme.SIZES.BASE * 2,
                              }}
                            />
                          </Block>

                          <Block
                            style={{
                              backgroundColor: 'rgba(0,0,0,0)',
                              marginBottom: 8,
                              paddingTop: 12
                            }}
                          >
                            <Block style={styles.options}>
                              <Block style={[styles.defaultStyle, {}]}>
                                <View
                                  style={{
                                    borderBottomColor: 'black',
                                    borderBottomWidth: 2
                                  }}
                                />
                              </Block>
                            </Block>
                          </Block>
{/* 
                          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <Block
                              style={{
                                backgroundColor: 'rgba(0,0,0,0)',
                                marginBottom: 12
                              }}
                            >
                              <Block row style={styles.options}>
                                <Block
                                  flex
                                  row
                                  style={[styles.defaultStyle, {}]}
                                >
                                  <View
                                    style={{
                                      flex: 1,
                                      flexDirection: 'row',
                                      paddingHorizontal: 10
                                    }}
                                  >
                                    <Block
                                      row
                                      flex
                                      style={{ justifyContent: 'center' }}
                                    >
                                      <View
                                        style={{ flex: 0.2, paddingTop: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontFamily: 'montserrat-regular',
                                            // textTransform: "uppercase",
                                            // marginRight: 100,
                                            fontWeight: '700'
                                          }}
                                          size={18}
                                          bold={false}
                                          color={'#006464'}
                                        >
                                          Employee Code:
                                        </Text>
                                      </View>
                                      <View style={{ flex: 0.5 }}>
                                        <TextInput
                                          style={{
                                            height: 40,
                                            margin: 12,
                                            borderWidth: 1,
                                            padding: 10
                                          }}
                                          placeholder='Employee Code'
                                          // label="Tên mẫu"
                                          editable={!isExists}
                                          value={EmpCode}
                                          onChangeText={EmpCode =>
                                            this.setState({ EmpCode })
                                          }
                                          onBlur={() => {
                                            this.props.onfetchEmployeeDetail(
                                              EmpCode,
                                              dataEmployeeDetail => {
                                                if (
                                                  dataEmployeeDetail.length !==
                                                  0
                                                ) {
                                                  // alert(dataEmployeeDetail[0]['department_name'])
                                                  this.setState({
                                                    CompanyCode:
                                                      dataEmployeeDetail[0][
                                                        'company_code'
                                                      ],
                                                    EmpName:
                                                      dataEmployeeDetail[0][
                                                        'employee_name'
                                                      ],
                                                    DeptValue:
                                                      dataEmployeeDetail[0][
                                                        'department_name'
                                                      ],
                                                    modalProcess: false,
                                                    isResult: true
                                                  })
                                                } else {
                                                  this.setState({
                                                    modalVerify:
                                                      !this.state.modalVerify
                                                  })
                                                }
                                              }
                                            )
                                          }}
                                        />
                                      </View>
                                    </Block>
                                  </View>
                                </Block>
                              </Block>
                            </Block>
                          </TouchableWithoutFeedback> */}
                          <Block
                            style={{
                              backgroundColor: 'rgba(0,0,0,0)',
                              marginBottom: 12
                            }}
                          >
                            <Block row style={styles.options}>
                              <Block flex row style={[styles.defaultStyle, {}]}>
                                <View
                                  style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    paddingHorizontal: 10
                                  }}
                                >
                                  <Block
                                    row
                                    flex
                                    style={{ justifyContent: 'center' }}
                                  >
                                    <View style={{ flex: 0.2, paddingTop: 8 }}>
                                      <Text
                                        style={{
                                          fontFamily: 'montserrat-regular',
                                          // textTransform: "uppercase",
                                          // marginRight: 100,
                                          fontWeight: '700'
                                        }}
                                        size={18}
                                        bold={false}
                                        color={'#006464'}
                                      >
                                        Employee Name:
                                      </Text>
                                    </View>
                                    <View style={{ flex: 0.5 }}>
                                      <TextInput
                                        style={{
                                          height: 40,
                                          margin: 12,
                                          borderWidth: 1,
                                          padding: 10
                                        }}
                                        placeholder='Employee Name'
                                        // label="Tên mẫu"
                                        value={EmpName}
                                        onChangeText={EmpName =>
                                          this.setState({ EmpName })
                                        }
                                      />
                                    </View>
                                  </Block>
                                </View>
                              </Block>
                            </Block>
                          </Block>
                          <Block
                            style={{
                              backgroundColor: 'rgba(0,0,0,0)',
                              marginBottom: 12
                            }}
                          >
                            <Block row style={styles.options}>
                              <Block flex row style={[styles.defaultStyle, {}]}>
                                <View
                                  style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    paddingHorizontal: 10
                                  }}
                                >
                                  <Block
                                    row
                                    flex
                                    style={{ justifyContent: 'center' }}
                                  >
                                    <View style={{ flex: 0.2, paddingTop: 8 }}>
                                      <Text
                                        style={{
                                          fontFamily: 'montserrat-regular',
                                          // textTransform: "uppercase",
                                          // marginRight: 100,
                                          fontWeight: '700'
                                        }}
                                        size={18}
                                        bold={false}
                                        color={'#006464'}
                                      >
                                        Department:
                                      </Text>
                                    </View>
                                    <View style={{ flex: 0.5 }}>
                                      <TextInput
                                        style={{
                                          height: 40,
                                          margin: 12,
                                          borderWidth: 1,
                                          padding: 10
                                        }}
                                        placeholder='Department'
                                        editable={false}
                                        value={'AI Department'}
                                        onChangeText={DeptValue =>
                                          this.setState({ DeptValue })
                                        }
                                      />
                                    </View>
                                  </Block>
                                </View>
                              </Block>
                            </Block>
                          </Block>

                          <Block
                            style={{
                              backgroundColor: 'rgba(0,0,0,0)',
                              marginBottom: 8
                            }}
                          >
                            <Block style={styles.options}>
                              <Block style={[styles.defaultStyle, {}]}>
                                <View
                                  style={{
                                    borderBottomColor: 'black',
                                    borderBottomWidth: 2
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
                              padding: 8,
                              backgroundColor: 'white'
                            }}
                          >
                            <EButton
                              disabled={isCheckSubmit}
                              title='Register Face ID'
                              onPress={this.onRegisterClick}
                              buttonStyle={{
                                borderColor: '#20a8d8',
                                backgroundColor: '#20a8d8',
                                padding: 10
                              }}
                              type='outline'
                              raised
                              titleStyle={{
                                color: 'white',
                                fontSize: 18
                              }}
                              containerStyle={{
                                width: '35%',
                                marginTop: 10,
                                // height: 50,
                                backgroundColor: '#20a8d8',
                                flex: 0.7
                                //   marginBottom: theme.SIZES.BASE,
                                //   width: width - theme.SIZES.BASE * 2,
                              }}
                            />
                            <Text>{'  '}</Text>
                            <EButton
                              title='Back'
                              onPress={() => {
                                navigation.navigate('Onboarding', {})
                              }}
                              buttonStyle={{
                                borderColor: '#20a8d8',
                                backgroundColor: '#20a8d8',
                                padding: 10
                              }}
                              type='outline'
                              raised
                              titleStyle={{
                                color: 'white',
                                fontSize: 18
                              }}
                              containerStyle={{
                                width: '35%',
                                // height: 50,
                                marginTop: 10,
                                backgroundColor: '#20a8d8',
                                flex: 0.3
                                //   marginBottom: theme.SIZES.BASE,
                                //   width: width - theme.SIZES.BASE * 2,
                              }}
                            />
                          </View>
                        </View>
                      </Fragment>
                    ) : (
                      <Fragment>
                        <TouchableOpacity
                          style={{
                            flex: 0,
                            // height: '100%',
                            // borderColor: "green",
                            // borderWidth: 10,
                            width: 360,
                            borderRadius: this.state.isInvalid ? 0 : 360,
                            backgroundColor: 'transparent',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            alignSelf: 'center',
                            height: 360,
                            overflow: 'hidden',
                          }}
                          onPress={event => {
                            // console.log(event.nativeEvent)
                          }}
                        >
                          {previewVisible ? (
                            <>
                              <Image
                                // resizeMethod='auto'
                                resizeMode={this.state.isInvalid ? 'contain' :'stretch'}
                                source={{
                                  uri: 'data:image/png;base64,' + this.state.capturedImage
                                }}
                                // source={{ uri: capturedUri }}
                                style={[
                                  styles.camera,
                                  {
                                    // flex:1,
                                    // height: '97%'
                                  }
                                ]}
                              ></Image>
                            </>
                          ) : (
                            <TensorCamera
                              //   ref={r => {
                              //     camera = r
                              //     parentRef = r
                              //   }}
                              style={styles.camera}
                              autorender={AUTO_RENDER}
                              type={Camera.Constants.Type.front}
                              // tensor related props
                              resizeWidth={this.getOutputTensorWidth()}
                              resizeHeight={this.getOutputTensorHeight()}
                              resizeDepth={3}
                              // rotation={this.getTextureRotationAngleInDegrees}
                              onReady={
                                this.state.faceDetecting
                                  ? this.handleCameraStream
                                  : undefined
                              }
                            >
                              <View
                                style={{
                                  // flex:1,
                                  // padding: 20,
                                  overflow: 'hidden'
                                }}
                              >
                                <CountdownCircleTimer
                                  isPlaying={isPlaying}
                                  duration={1}
                                  strokeWidth={18}
                                  // colors={['#A30000', '#F7B801', '#004777', 'green']}
                                  // colorsTime={[3, 2, 1, 0]}
                                  colors={['#F7B801', 'green']}
                                  colorsTime={[1, 0]}
                                  size={360}
                                  key={this.state.key}
                                />
                              </View>
                            </TensorCamera>
                          )}
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
                              alignContent: 'center',
                              justifyContent: 'center',
                              marginBottom: 220
                            }}
                          >
                            <Text
                              // style={styles.textStandard}
                              style={{
                                color: 'red',
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
                              alignContent: 'center',
                              justifyContent: 'center',
                              marginBottom: 220
                            }}
                          >
                            <Text
                              // style={styles.textStandard}
                              style={{
                                color: 'red',
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
                              alignContent: 'center',
                              justifyContent: 'center',
                              marginBottom: 180
                            }}
                          >
                            <Text
                              style={{
                                color: 'blue',
                                fontSize: 64
                              }}
                            >
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
                          }}
                        >
                          <Text style={styles.paragraph}>
                            {time} - {date_current}
                          </Text>
                          <EButton
                            title='Back'
                            onPress={() => {
                              navigation.navigate('Onboarding', {})
                            }}
                            buttonStyle={{
                              borderColor: '#20a8d8',
                              backgroundColor: '#20a8d8'
                            }}
                            type='outline'
                            raised
                            titleStyle={{
                              color: 'white',
                              fontSize: 24
                            }}
                            containerStyle={{
                              width: '35%',
                              height: 50,
                              marginTop: 20,
                              backgroundColor: '#20a8d8'
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
                            fontFamily: 'montserrat-regular',
                            fontWeight: '700'
                          }}
                          size={18}
                          bold={false}
                          color={'#006464'}
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
                            padding: 10
                          }}
                          placeholder='Vui lòng nhập mã công ty'
                          // label="Tên mẫu"
                          value={AppointmentCode}
                          onChangeText={AppointmentCode =>
                            this.setState({ AppointmentCode })
                          }
                        />
                      </View>
                    </Block>
                    <Block row>
                      <View
                        style={{
                          paddingLeft: 12,
                          width: 400
                        }}
                      >
                        <EButton
                          title='Gửi'
                          onPress={this.onSubmitCode}
                          buttonStyle={{
                            borderColor: '#3ea662',
                            backgroundColor: '#3ea662'
                          }}
                          type='outline'
                          raised
                          titleStyle={{
                            color: 'white',
                            fontSize: 18
                          }}
                          containerStyle={{
                            width: '35%',
                            // height: 50,
                            backgroundColor: '#3ea662'
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

  componentWillUnmount () {
    // EventRegister.removeEventListener(this.listener);
    // this._unsubscribe();
    // this.BackHandler = BackHandler.removeEventListener(
    //     "hardwareBackPress",
    //     this.backAction
    // )
  }

  UNSAFE_componentWillUpdate (nextProps, nextState) {
    if (this.state.detectMotion && nextState.motion && this.state.motion) {
      if (
        Math.abs(nextState.motion.x - this.state.motion.x) <
          this.props.motionTolerance &&
        Math.abs(nextState.motion.y - this.state.motion.y) <
          this.props.motionTolerance &&
        Math.abs(nextState.motion.z - this.state.motion.z) <
          this.props.motionTolerance
      ) {
        //still
        this.detectFaces(true)
        this.detectMotion(false)
      } else {
        //moving
      }
    }
  }

  componentDidMount () {
    const timestamp = Date.now()
    Camera.getCameraPermissionsAsync().then(result => {
      // console.log(result)
      this.setState(
        {
          session: timestamp,
          permission: result.granted
          // isLoading: false
        },
        async () => {
          if (!this.state.isLoading && this.state.permission) {
            setInterval(() => {
              // console.log(new Date().toLocaleString())
              this.setState({
                time: new Date(Date.now()).toLocaleTimeString(),
                date_current: new Date(Date.now()).toLocaleDateString()
              })
            }, 1000)
          }

          // Set initial orientation.
          const curOrientation = await ScreenOrientation.getOrientationAsync()
          this.setState({
            orientation: curOrientation
          })

          // Listens to orientation change.
          ScreenOrientation.addOrientationChangeListener(event => {
            this.setState({
              orientation: event.orientationInfo.orientation
            })
          })

          // Wait for tfjs to initialize the backend.
          await MediaLibrary.requestPermissionsAsync()
          await MediaLibrary.presentPermissionsPickerAsync()
          await tf.ready()

          this.setState({
            // detector,
            tfReady: true,
            isLoading: false
          })
        }
      )
    })
  }

  componentWillUnmount () {
    clearInterval(this.time, this.date_current)
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  paragraph: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    textAlignVertical: 'center',
    justifyContent: 'flex-start'
  },
  camera: {
    // flex: 1,
    // height: '85%',
    width: "100%",
    flex: 0,
    height: '100%',
    // borderColor: 'green',
    // borderWidth: 10,
    // width: 400,
    // borderRadius: 360,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    // height: 400,
    overflow: 'hidden'
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center'
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
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
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
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
    width: 100
  },
  buttonSubmit: {
    backgroundColor: 'rgba(24,206,15, 0.8)'
  },
  buttonClose: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  buttonDelete: {
    backgroundColor: '#FF3636'
  },
  topBar: {
    flex: 0.2,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Constants.statusBarHeight + 1
  },
  bottomBar: {
    flex: 0.2,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  face: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 1,
    position: 'absolute',
    borderColor: '#3b5998',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  faceText: {
    color: '#32CD32',
    fontWeight: 'bold',
    textAlign: 'left',
    margin: 2,
    backgroundColor: 'transparent'
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0
  },
  textcolor: {
    color: '#008080'
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
    elevation: 4
  },
  defaultStyle: {
    // paddingVertical: 15,
    paddingHorizontal: 8,
    color: 'white'
  }
})

const mapStateToProps = state => {
  return {
    // user: state.user,
    // errors: state.errors,
  }
}

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
    oncheckFaceLogin: (face, session,faceCrop, callback) => {
      dispatch(checkFaceLogin(face, session,faceCrop, callback))
    },
    onfetchEmployeeDetail: (EmpCode, callback) => {
      dispatch(fetchEmployeeDetail(EmpCode, callback))
    },
    onupdateFaceRegister: (
      Avatar,      
      EmpName,
      callback
    ) => {
      dispatch(
        updateFaceRegister(
          Avatar,          
          EmpName,
          callback
        )
      )
    },
    oncheckAppointmentCode: (appointment_code, callback) => {
      dispatch(checkAppointmentCode(appointment_code, callback))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CheckIn)
