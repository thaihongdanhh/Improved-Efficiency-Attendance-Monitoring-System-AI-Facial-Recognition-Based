import axios from 'axios'
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
  Platform
} from 'react-native'
import { Button as EButton, Input, Card } from 'react-native-elements'
import { Block, theme, Text as GText } from 'galio-framework'
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator'
import moment from 'moment'
import * as FileSystem from 'expo-file-system'
import { connect } from 'react-redux'
import {
  uploadImages,
  fetchImages,
  cropImages
} from '../store/actions/aicoffee'
import { checkFace, fetchTimesheetPerson, fetchTimesheetByMonth } from '../store/actions/aiface'
import { faceDetect, faceRegister } from '../store/actions/aiface'
import * as Device from 'expo-device'
import * as Progress from 'react-native-progress'
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { w3cwebsocket as W3CWebSocket } from 'websocket'

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
import { Buffer } from 'buffer'; 
import * as MediaLibrary from 'expo-media-library';
import * as jpeg from 'jpeg-js';

import { Amplify, Auth, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);


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

let camera = TensorCamera
let parentRef = ''
let childRef = ''
const { width } = Dimensions.get('screen')
const height = Math.round((width * 16) / 9)

class CheckLogin extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      type: CameraType.front,
      typeFlash: FlashMode.off,
      startCamera: true,
      isInvalid: false,
      previewVisible: false,
      modalProcess: false,
      modalSuccess: false,
      modalRegister: false,
      modalVerify: false,
      modalInvalid: false,
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
      inValidText: '',
      borderColor: 'red',
      isPlaying: false,
      key: 0,
      time: new Date(Date.now()).toLocaleTimeString(),
      date_current: new Date(Date.now()).toLocaleDateString(),
      timestamp: '',
      avatar_path: '',
      isResult: false,
      dataFaceCheck: [],
      isLoading: true,
      // dataFaceCheck: [{ "check_in": "VQ9H+GJW, QL1A, Linh Xuân, Thủ Đức, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3510.3, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "35.066381443271894", "lat_out": "", "long_in": "129.0816877979185", "long_out": "", "snapshot_date": "2023-02-17", "time_enter": "2023-02-17 13:27:05", "time_enter_format": "13:27:05", "time_enter_late": "05:27:05", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-17" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.01, "distance_out": 0.01, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789579681839763", "lat_out": "10.789579681839763", "long_in": "106.71968133762259", "long_out": "106.71968133762259", "snapshot_date": "2023-02-09", "time_enter": "2023-02-09 13:38:16", "time_enter_format": "13:38:16", "time_enter_late": "05:38:16", "time_leave": "2023-02-09 13:38:30", "time_leave_early": "03:21:30", "time_leave_format": "13:38:30", "total_working_hour": 0, "working_date": "2023-02-09" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.789540511555128", "lat_out": "", "long_in": "106.71977028823788", "long_out": "", "snapshot_date": "2023-02-08", "time_enter": "2023-02-08 14:50:04", "time_enter_format": "14:50:04", "time_enter_late": "06:50:04", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-08" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "bảy", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 8.36, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.797056", "lat_out": "", "long_in": "106.643456", "long_out": "", "snapshot_date": "2023-02-04", "time_enter": "2023-02-04 15:29:06", "time_enter_format": "15:29:06", "time_enter_late": "07:29:06", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-02-04" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "company_code": "ai", "day_name": "năm", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 0.02, "distance_out": 0.02, "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7894894", "lat_out": "10.789491", "long_in": "106.7195971", "long_out": "106.719528", "snapshot_date": "2023-02-02", "time_enter": "2023-02-02 09:50:33", "time_enter_format": "09:50:33", "time_enter_late": "01:50:33", "time_leave": "2023-02-02 11:14:12", "time_leave_early": "05:45:48", "time_leave_format": "11:14:12", "total_working_hour": 1.4, "working_date": "2023-02-02" }, { "check_in": "31D96 92 Nguyễn Hữu Cảnh Khu biệt thự, Saigon Pearl, Bình Thạnh, Thành phố Hồ Chí Minh, Vietnam", "check_out": "", "company_code": "ai", "day_name": "tư", "department_id": "AI-S", "department_name": "AI Staff", "distance_in": 3.35, "distance_out": "", "employee_code": "AI004", "employee_name": "Thái Hồng Danh", "explan_path": "", "explan_text": "", "idcard": "AI004", "lat_in": "10.7974327", "lat_out": "", "long_in": "106.6900316", "long_out": "", "snapshot_date": "2023-01-25", "time_enter": "2023-01-25 17:47:09", "time_enter_format": "17:47:09", "time_enter_late": "09:47:09", "time_leave": "", "time_leave_early": "17:00:00", "time_leave_format": "", "total_working_hour": "", "working_date": "2023-01-25" }]
      EmpCode: '',
      department_name: '',
      employee_name: '',

      tfReady: false,
      model: null,
      poses: null,
      detector: null,
      faces: null,
      fps: null,
      orientation: null,
      rafId: {
        current: null
      }
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

  __startCamera = async () => {
    this.setState({
      startCamera: !this.state.startCamera
    })
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
  handleFacesDetected = faces => {
    // console.log(faces)
    if (faces && faces.length === 1) {
      console.log('OK Faces Detected')
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
        () => {}
      )

      // console.log(faces[0].rollAngle.toFixed(0) <= 10)
      //   if (
      //     (faces[0].rollAngle.toFixed(0) <= 10 ||
      //       faces[0].rollAngle.toFixed(0) >= 350) &&
      //     (faces[0].yawAngle.toFixed(0) <= 10 ||
      //       faces[0].yawAngle.toFixed(0) >= 350)
      //   ) {
      //     this.setState(
      //       {
      //         faceDetected: true,
      //         faceValid: true,
      //         borderColor: 'green',
      //         inValidText: '',
      //         countDownStarted: true,
      //         isPlaying: true,
      //         faces
      //       },
      //       () => {}
      //     )
      //   } else if (
      //     (faces[0].rollAngle.toFixed(0) <= 10 ||
      //       faces[0].rollAngle.toFixed(0) >= 350) &&
      //     10 < faces[0].yawAngle.toFixed(0) < 350
      //   ) {
      //     this.setState(
      //       {
      //         faceDetected: true,
      //         faceValid: false,
      //         borderColor: 'red',
      //         isPlaying: false,
      //         inValidText: 'Vui lòng nhìn thẳng !',
      //         faceDetected: false,
      //         faces
      //       },
      //       () => {}
      //     )
      //     this.cancelCountDown()
      //   } else if (
      //     10 < faces[0].rollAngle.toFixed(0) < 350 &&
      //     (faces[0].yawAngle.toFixed(0) <= 10 ||
      //       faces[0].yawAngle.toFixed(0) >= 350)
      //   ) {
      //     this.setState(
      //       {
      //         faceDetected: true,
      //         faceValid: false,
      //         borderColor: 'red',
      //         isPlaying: false,
      //         inValidText: 'Vui lòng nhìn thẳng !',
      //         faceDetected: false,
      //         faces
      //       },
      //       () => {}
      //     )
      //     this.cancelCountDown()
      //   } else {
      //     this.setState(
      //       {
      //         faceDetected: true,
      //         faceValid: false,
      //         borderColor: 'red',
      //         isPlaying: false,
      //         inValidText: 'Vui lòng nhìn thẳng !',
      //         faceDetected: false,
      //         faces
      //       },
      //       () => {}
      //     )
      //     this.cancelCountDown()
      //   }

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
          if (Camera) {
            console.log('take picture')
            this.onPictureSaved()
            // const options = { onPictureSaved: this.onPictureSaved }
            // Camera.takePictureAsync(options)
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

  onPictureSaved = async () => {
    const { faces, nextImageTensor } = this.state
    // console.log('OK nè ')
    
    // console.log(faces)
    const cropData = {
        originX: faces[0]['box']['xMin'],
        originY: faces[0]['box']['yMin'],
        width: faces[0]['box']['width'],
        height: faces[0]['box']['height']
        }
        
        try {
        // const [height, width] = nextImageTensor.shape
        // console.log('Tới đây okie nè ! 1', height, width)
        // const bytes = nextImageTensor.dataSync(); // can also use the async .data        
        // const encoded = Buffer.from(bytes, 'utf-8').toString('base64')
        // const encoded = base64.encode(bytes); // base64 string
        // const data = new Buffer(
        // // concat with an extra alpha channel and slice up to 4 channels to handle 3 and 4 channels tensors
        // tf.concat([nextImageTensor, tf.ones([height, width, 1]).mul(255)], [-1])
        //     .slice([0], [height, width, 4])
        //     .dataSync(),
        // )
        // console.log(encoded)
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

        // console.log('Tới đây okie nè ! 3')

        // console.log(croppedPhoto['base64'])

        this.setState(
        {
            capturedImage: imgBase64,
            previewVisible: !this.state.previewVisible
        },
        async () => {
            let dataFaceCheckArr = []
            // const client = new W3CWebSocket(
            // 'wss://edu.ailab.vn:5021/ws/facecheck'
            // )
            // client.onmessage = message => {
            // console.log('tới đây rồi')
            // this.setState(
            //     {
            //     isQuetLai: false
            //     },
            //     () => {
            //     if (message.data.split('|')[0] === 'facecheck') {
            //         this.setState(
            //         {
            //             isLoadingFaceCheck: true
            //         },
            //         () => {
            //             const device_name = message.data.split('|')[1]
            //             const employee_code = message.data.split('|')[2]
            //             const status = message.data.split('|')[3]
            //             const session_match = message.data.split('|')[8]
            //             console.log(status)

            //             // if (
            //             // String(session_match) ===
            //             // String(this.state.session)
            //             // ) {
            //             // if (status === 'no_meet_conditions_person') {
            //             //     dataFaceCheckArr = {
            //             //     device_name,
            //             //     employee_code,
            //             //     status,
            //             //     name: 'Không thể nhận dạng',
            //             //     idcard: 'Không thể nhận dạng',
            //             //     status_check: '-1'
            //             //     }
            //             //     // this.error('Chưa đăng ký thông tin')

            //             //     this.setState(
            //             //     {
            //             //         iscaptcha: false,
            //             //         isFaceDetect: true,
            //             //         isStepScanQR: false,
            //             //         isQuetLai: true,
            //             //         modalVerify: !this.state.modalVerify,
            //             //         modalProcess: !this.state.modalProcess
            //             //     },
            //             //     () => {setTimeout(() => {
            //             //         this.setState({
            //             //             modalVerify: false
            //             //           })
            //             //     }, 2000)}
            //             //     )
            //             // } else if (status === 'meet_conditions_person') {
            //             //     // if (message.data.split('|')[6] === 'valid') {
            //             //     const idcard = message.data.split('|')[4]
            //             //     const name = message.data.split('|')[5]
            //             //     const km = message.data.split('|')[7]
            //             //     const address_check = message.data.split('|')[9]
            //             //     // console.log(address_check)
            //             //     //const ma_doi_tuong = message.data.split('|')[2]

            //             //     this.setState(
            //             //     {
            //             //         // modalSuccess: !this.state.modalSuccess,
            //             //         km,
            //             //         address_check,
            //             //         EmpCode: idcard,
            //             //         name
            //             //     },
            //             //     () => {
            //             //         let status_check = '1'
            //             //         if (
            //             //         this.state.EmpCode.toUpperCase() !==
            //             //         idcard.toUpperCase()
            //             //         ) {
            //             //         status_check = '0'
            //             //         }

            //             //         dataFaceCheckArr = {
            //             //         device_name,
            //             //         employee_code,
            //             //         status,
            //             //         name,
            //             //         idcard,
            //             //         status_check
            //             //         }

            //             //         // this.success()
            //             //         const day = new Date()
            //             //         const endDate =
            //             //         moment().format('YYYY-MM-DD')
            //             //         const startDate = moment(
            //             //         new Date(day.setDate(day.getDate() - 30))
            //             //         ).format('YYYY-MM-DD')

            //             //         this.props.onfetchTimesheetPerson(
            //             //         idcard,
            //             //         startDate,
            //             //         endDate,
            //             //         dataFaceCheck => {
            //             //             // console.log(dataFaceCheck)
            //             //             this.setState(
            //             //             {
            //             //                 employee_name:
            //             //                 dataFaceCheck[0]['employee_name'],
            //             //                 department_name:
            //             //                 dataFaceCheck[0][
            //             //                     'department_name'
            //             //                 ],
            //             //                 dataFaceCheck: dataFaceCheck,
            //             //                 avatar_path:
            //             //                 dataFaceCheck[0]['avatar_path'],
            //             //                 //modal: !this.state.modal,
            //             //                 isLoadingFaceCheck: false,
            //             //                 iscaptcha: false,
            //             //                 isResult: true,
            //             //                 isQuetLai: true,
            //             //                 modalSuccess: true,
            //             //                 modalProcess:
            //             //                 !this.state.modalProcess
            //             //             },
            //             //             () => {
            //             //                 setTimeout(() => {
            //             //                 this.setState({
            //             //                     modal: false,
            //             //                     modalSuccess: false
            //             //                 })
            //             //                 }, 3000)
            //             //             }
            //             //             )
            //             //         }
            //             //         )
            //             //     }
            //             //     )
            //             // }

            //             // client.close()
            //             // }
            //         }
            //         )
            //     }
            //     }
            // )
            // }

            // const base64 = await FileSystem.readAsStringAsync(this.state.capturedImage.uri, { encoding: 'base64' });

            new Promise(() => {
            // client.onopen = () => {
            //     console.log('WebSocket Client Connected')
            // }

            this.props.oncheckFace(
                imgBase64,
                croppedPhoto['base64'],
                this.state.session,
                this.state.lat,
                this.state.lng,
                response => {
                // console.log(response)
                this.setState(
                    {
                    //isRefresh: true,
                    },
                    () => {
                    this.setState(
                        {
                        // isResult: true,
                        },
                        () => {
                          // console.log(response)       
                          if (response.status === 'not_exists'){
                            this.setState({
                              modalProcess: false,
                              faceDetecting: true,
                              previewVisible: false,
                              modalVerify: true  
                            })                            
                          } else if (response.status === 'valid') {
                            console.log(response.data)
                            this.setState({
                              modalProcess: false,
                              modalSuccess: true,
                              isResult: true,
                              name: response.name,
                              capturedImage: response.file,
                              dataFaceCheck: response.data
                            },() => {
                              setTimeout(() => {
                                this.setState({
                                  modalSuccess: false,
                                  previewVisible: true
                                })
                              }, 2000)
                            })

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
                              // client.close()
                              this.setState({
                              modalProcess: false,
                              faceDetecting: true,
                              // previewVisible: false,
  
                              // propsFace: {
                              //     onFacesDetected: this.handleFacesDetected
                              // }
                              })
                          }, 3000)
                          }
                          
                        //this.run();
                        }
                    )
                    }
                )
                }
            )
            })
        }
        )
        this.detectFaces(false)
    } catch (e) {
        console.log(e)
    }  
  }

  renderFaces = () => {
    const { faces } = this.state
    if (this.state.faces != null && this.state.faces.length > 0) {
      const box = faces[0].box
      const keypoints = faces[0].keypoints
      console.log('box', box)
      return (
        <Svg style={styles.svg}>
          <Rect
            // x={(((box.xMax + box.xMin) / 2) / getOutputTensorWidth()) * (isPortrait() ? CAM_PREVIEW_WIDTH : CAM_PREVIEW_HEIGHT) }
            // y={(((box.yMax + box.yMin) / 2) / getOutputTensorHeight()) * (isPortrait() ? CAM_PREVIEW_HEIGHT : CAM_PREVIEW_WIDTH)}
            x={
              (box.xMin / this.getOutputTensorWidth()) *
              (this.isPortrait() ? CAM_PREVIEW_WIDTH : CAM_PREVIEW_HEIGHT)
            }
            y={
              (box.yMin / this.getOutputTensorHeight()) *
              (this.isPortrait() ? CAM_PREVIEW_HEIGHT : CAM_PREVIEW_WIDTH)
            }
            width={
              (box.width / this.getOutputTensorWidth()) *
              (this.isPortrait() ? CAM_PREVIEW_WIDTH : CAM_PREVIEW_HEIGHT)
            }
            height={
              (box.height / this.getOutputTensorHeight()) *
              (this.isPortrait() ? CAM_PREVIEW_HEIGHT : CAM_PREVIEW_WIDTH)
            }
            strokeWidth='2'
            fill={'none'}
            stroke='blue'
          />
        </Svg>
      )
    } else {
      return <View></View>
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
            runtime: 'tfjs', // or 'tfjs',
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
          if (faces && faces.length !== 0){
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

  getTextureRotationAngleInDegrees = async () => {
    // On Android, the camera texture will rotate behind the scene as the phone
    // changes orientation, so we don't need to rotate it in TensorCamera.
    console.log('Vô đây rồi ==============')
    if (IS_ANDROID) {
      return 0
    }

    // For iOS, the camera texture won't rotate automatically. Calculate the
    // rotation angles here which will be passed to TensorCamera to rotate it
    // internally.
    switch (this.state.orientation) {
      // Not supported on iOS as of 11/2021, but add it here just in case.
      case ScreenOrientation.Orientation.PORTRAIT_DOWN:
        return 180
      case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
        return CameraType.front ? 270 : 90
      case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
        return CameraType.front ? 90 : 270
      default:
        return 0
    }
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
      modalInvalid,
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
      avatar_path,
      orientation
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
                onRequestClose={() => {}}
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
                visible={modalVerify}
                // key={this.state.data2['index']}
                onRequestClose={() => {
                  // Alert.alert('Modal has been closed.');
                  // this.setModalVisible(!modalSuccess);
                  this.setState({
                    modalVerify: !this.state.modalVerify
                  })
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <Text style={styles.modalText}>
                      Face ID does not exists ! Please register !
                    </Text>
                    <Block row center space='between' style={{ marginTop: 20 }}>
                      <EButton
                        title='Cancel'
                        onPress={() => {
                          this.setState({
                            modalVerify: !this.state.modalVerify
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
                          //   marginBottom: theme.SIZES.BASE,
                          //   width: width - theme.SIZES.BASE * 2,
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
                    <Text
                      style={styles.modalText}
                    >{`Hi ${this.state.name} ! \nYou Login successfully !`}</Text>
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
              <Modal
                animationType='slide'
                transparent={true}
                visible={modalInvalid}
                // key={this.state.data2['index']}
                onRequestClose={() => {
                  // Alert.alert('Modal has been closed.');
                  // this.setModalVisible(!modalSuccess);
                  this.setState({
                    modalInvalid: !this.state.modalInvalid
                  })
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <Text
                      style={styles.modalText}
                    >{`${this.state.text}`}</Text>
                    <Block row center space='between'>                      
                    </Block>
                  </View>
                </View>
              </Modal>
              {startCamera ? (
                <SafeAreaView style={{ flex: 1 }}>
                  <View
                    style={{
                      flex: 1,
                      width: '100%'
                    }}
                  >
                    {isResult ? (<Fragment>
                                                    <View
                                                        style={{
                                                            flex: 1,
                                                            width: '100%',
                                                        }}>
                                                        <Block row
                                                            style={{
                                                                width: width - theme.SIZES.BASE * 2,
                                                                padding: 5,
                                                                height: 180,
                                                            }}
                                                        >
                                                            <Block style={{ flex: 0.6 }}>
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
                                                                    source={{ uri: `https://hr.ailab.vn/api/employee/avatar?avatar_path=` + avatar_path }}
                                                                // source={{ uri: `https://hr.ailab.vn/api/employee/avatar?avatar_path=uploads/employee/AI004/avatar/2023-02-02-10-40-12.png` }}
                                                                />
                                                            </Block>
                                                            <Block style={{ flex: 0.4 }}>
                                                                <View style={{ paddingLeft: 10, justifyContent: "flex-end", }}>
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
                                                                            // flex: 0.4,
                                                                            width: 100,
                                                                            height: 42,
                                                                            backgroundColor: "#20a8d8",
                                                                            justifyContent: "flex-end"
                                                                        }}
                                                                    />
                                                                </View>
                                                                <View style={{ padding: 10, justifyContent: "flex-end", }}>
                                                                    <EButton
                                                                        title="Giải Trình"
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                TimePlan: moment().format('DD/MM/YYYY'),
                                                                                isExplain: !this.state.isExplain,
                                                                                // onClick: { onGiaiTrinh }
                                                                            })
                                                                        }}
                                                                        buttonStyle={{
                                                                            borderColor: '#c8ced3',
                                                                            backgroundColor: "#c8ced3",
                                                                        }}
                                                                        type="outline"
                                                                        raised
                                                                        titleStyle={{
                                                                            color: 'black',
                                                                            fontSize: 18,
                                                                        }}
                                                                        containerStyle={{
                                                                            // flex: 0.4,
                                                                            width: 100,
                                                                            backgroundColor: "#c8ced3",
                                                                            justifyContent: "flex-end",
                                                                        }}
                                                                    />
                                                                </View>
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
                                                        <TouchableOpacity
                                                            style={{
                                                                width: 150
                                                            }}
                                                            onPress={() => {
                                                                this.setState({
                                                                    modalMonthYear: !this.state.modalMonthYear
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
                                                                defaultValue={month_current}
                                                                editable={false}
                                                                onTouchStart={() => {
                                                                    this.setState({
                                                                        modalMonthYear: !this.state.modalMonthYear

                                                                    })
                                                                }}
                                                            />
                                                        </TouchableOpacity>
                                                        <ScrollView
                                                            style={{
                                                                flex: 1
                                                            }}
                                                            contentContainerStyle={{
                                                                width: width * 1.4,
                                                                height: 400,
                                                                paddingHorizontal: 10,
                                                            }}
                                                            horizontal
                                                        >
                                                            <ScrollView
                                                                style={{
                                                                    width: width * 1.4,
                                                                    height: 400,
                                                                }}
                                                            >
                                                                <Block style={{ backgroundColor: 'rgba(0,0,0,0)', marginBottom: 12 }}>
                                                                    <Block row style={styles.options}>
                                                                        <Block flex row style={[styles.defaultStyle, {
                                                                        }]}>
                                                                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                                                                <Block row flex>
                                                                                    {/* <View style={{ flex: 0.3 }}>
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
                                                                                            Vào
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
                                                                                            Ra
                                                                                        </Text>
                                                                                    </View> */}
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
                                                                                            Working Date
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
                                                                                            Time Enter
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
                                                                                            Time Out
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
                                                                                            Total hours
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
                                                                        <TouchableOpacity
                                                                            style={{
                                                                            }}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    data: data,
                                                                                    modalRow: !this.state.modalRow
                                                                                })
                                                                            }}
                                                                        >
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
                                                                                                    {data.working_date}
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
                                                                                                    {data.time_enter}
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
                                                                                                    {data.time_leave}
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
                                                                                                    {data.total_hourse}
                                                                                                </Text>
                                                                                            </View>                                                  
                                                                                        </Block>
                                                                                    </View>
                                                                                </Block>
                                                                            </Block>
                                                                        </TouchableOpacity>
                                                                    </Block>
                                                                })}
                                                            </ScrollView>
                                                        </ScrollView>
                                                    </View>
                                                </Fragment>) : (
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
                              onReady={this.state.faceDetecting
                                ? this.handleCameraStream
                                : undefined                                                           
                              }
                              //   // style={styles.camera}
                              //   style={{
                              //     flex: 1,
                              //     width: 360,
                              //     height: 360
                              //   }}
                              //   type={type}
                              //   zoom={Platform.OS === 'ios' ? 0.0005 : 0}
                              //   // zoom={0.0005}
                              //   flashMode={typeFlash}
                              //   ratio='4:3'
                              //   // onFaceDetectionError={this.handleFaceDetectionError}
                              //   // pictureSize
                              //   {...this.state.propsFace}
                              //   onCameraReady={() => {
                              //     this.setState({
                              //       propsFace: {
                              //         onFacesDetected: this.state.faceDetecting
                              //           ? this.handleFacesDetected
                              //           : undefined
                              //       },
                              //       faceDetectorSettings: {
                              //         mode: FaceDetector.FaceDetectorMode.fast,
                              //         detectLandmarks:
                              //           FaceDetector.FaceDetectorLandmarks.none,
                              //         runClassifications:
                              //           FaceDetector.FaceDetectorClassifications
                              //             .none,
                              //         minDetectionInterval: 100,
                              //         tracking: true
                              //       }
                              //     })
                              //   }}
                            >
                              {/* {this.renderFaces()} */}
                              <View
                                style={{
                                  // flex:1,
                                  // padding: 20,
                                  overflow: 'hidden'
                                }}
                              >
                                <CountdownCircleTimer
                                  isPlaying={isPlaying}
                                  strokeWidth={18}
                                  duration={1}
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

                          {/* {Platform.OS !== 'ios' && (
                                                                    <Camera
                                                                        // style={styles.camera}                                                        
                                                                        style={{
                                                                            // flex: 1,
                                                                            width: 360,
                                                                            height: 360,
                                                                            borderRadius: 180,
                                                                            overflow: "hidden"
                                                                        }}
                                                                        type={type}
                                                                        flashMode={typeFlash}
                                                                        ratio="4:3"
                                                                        onFacesDetected={this.state.faceDetecting ? this.handleFacesDetected : undefined}
                                                                        // onFaceDetectionError={this.handleFaceDetectionError}
                                                                        // pictureSize
                                                                        faceDetectorSettings={{
                                                                            mode: FaceDetector.FaceDetectorMode.fast,
                                                                            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                                                                            runClassifications: FaceDetector.FaceDetectorClassifications.none,
                                                                            minDetectionInterval: 100,
                                                                            tracking: true,
                                                                        }}
                                                                        ref={r => {
                                                                            camera = r;
                                                                            parentRef = r
                                                                        }}
                                                                    >
                                                                        <View style={{
                                                                            flex: 1,
                                                                            // padding: 20,                                                                            
                                                                            overflow: "hidden"
                                                                        }}>
                                                                            <CountdownCircleTimer
                                                                                isPlaying={isPlaying}
                                                                                strokeWidth={18}
                                                                                duration={3}
                                                                                colors={['#A30000', '#F7B801', '#004777', 'green']}
                                                                                colorsTime={[3, 2, 1, 0]}
                                                                                size={360}
                                                                                key={this.state.key} />
                                                                        </View>
                                                                    </Camera>
                                                                )}                                               */}
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
                            title='Trở về'
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
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <TouchableOpacity
                    onPress={this.__startCamera}
                    style={{
                      width: 300,
                      borderRadius: 360,
                      backgroundColor: '#3b5998',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 300
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: 24
                      }}
                    >
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
          permission: result.granted
        },
        async () => {
          new Promise(async () => {
            try {
              axios
                .get(
                  'https://api-bdc.net/data/ip-geolocation-with-confidence?key=bdc_533a81b335a94b11afa578755b7f8970'
                )
                .then(res => {
                  //   console.log(res['data']['location'])
                  const location = res['data']['location']
                  const now = new Date()
                  // console.log(location)
                  this.setState(
                    {
                      session: timestamp,
                      time: now.toLocaleTimeString(),
                      lat: parseFloat(location.latitude),
                      lng: parseFloat(location.longitude)
                    },
                    () => {
                      if (!this.state.isLoading && this.state.permission) {
                        setInterval(() => {
                          // console.log(new Date().toLocaleString())
                          this.setState({
                            time: new Date(Date.now()).toLocaleTimeString(),
                            date_current: new Date(
                              Date.now()
                            ).toLocaleDateString()
                          })
                        }, 1000)
                      }
                    }
                  )
                })
            } catch (e) {
              console.log(e)
            }
            // }
          })

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
          await MediaLibrary.requestPermissionsAsync();
          await MediaLibrary.presentPermissionsPickerAsync();
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
    width: '100%',
    flex: 0,
    height: '100%',
    // borderColor: 'green',
    // borderWidth: 0,
    // width: 400,
    // borderRadius: 360,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    // height: 400,
    // overflow: 'hidden'
  },
  svg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 30
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
    oncheckFace: (face, faceCrop, EmpCode, lat, lng, callback) => {
      dispatch(checkFace(face, faceCrop, EmpCode, lat, lng, callback))
    },
    onfetchTimesheetPerson: (EmpCode, start_date, end_date, callback) => {
      dispatch(fetchTimesheetPerson(EmpCode, start_date, end_date, callback))
    },
    onfetchTimesheetByMonth: (EmpCode, timesheet_month, callback) => {
        dispatch(fetchTimesheetByMonth(EmpCode, timesheet_month, callback))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CheckLogin)
