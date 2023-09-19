import React from 'react'
import { Camera } from 'expo-camera'
import { cameraWithTensors } from '@tensorflow/tfjs-react-native'
import {
  AppRegistry,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native'

import * as tf from '@tensorflow/tfjs'
import * as faceDetection from '@tensorflow-models/face-detection'
import * as ScreenOrientation from 'expo-screen-orientation'
import Svg, { Circle, Rect } from 'react-native-svg'


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
const OUTPUT_TENSOR_WIDTH = 180
const OUTPUT_TENSOR_HEIGHT = OUTPUT_TENSOR_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4)

// Whether to auto-render TensorCamera preview.
const AUTO_RENDER = true

// Whether to load model from app bundle (true) or through network (false).
const LOAD_MODEL_FROM_BUNDLE = false


export default class Camera2 extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: true,
      faces: [],
      orientation: null,
      outputTensorWidth: null,
      outputTensorHeight: null
    }
  }

  handleCameraStream = (images, updatePreview, gl) => {
    const loop = async () => {
      const nextImageTensor = images.next().value
      const detectorConfig = {
        runtime: 'tfjs' // or 'tfjs'
        // solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        // refineLandmarks: false
      }

      const detector = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        detectorConfig
      )

      const faces = await detector.estimateFaces(nextImageTensor)          
      this.setState({
        faces
      })
      //
      // do something with tensor here
      //

      // if autorender is false you need the following two lines.
      // updatePreview();
      // gl.endFrameEXP();

      requestAnimationFrame(loop)
    }
    loop()
  }

  renderFaces = () => {
    const {
        faces
    } = this.state
    
    if (this.state.faces != null && this.state.faces.length > 0) {
      const box = faces[0].box
      const keypoints = faces[0].keypoints
    //   console.log(box)
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
    const {
        orientation
    } = this.state
    return (
      orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
      orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
    )
  }

  getOutputTensorWidth = () => {
    // On iOS landscape mode, switch width and height of the output tensor to
    // get better result. Without this, the image stored in the output tensor
    // would be stretched too much.
    //
    // Same for getOutputTensorHeight below.
    // if(this.isPortrait() || IS_ANDROID){
    //     this.setState({
    //         outputTensorWidth: OUTPUT_TENSOR_WIDTH
    //     })
    // } else {
    //     this.setState({
    //         outputTensorWidth: OUTPUT_TENSOR_HEIGHT
    //     })         
    // } 

    return this.isPortrait() || IS_ANDROID
      ? OUTPUT_TENSOR_WIDTH
      : OUTPUT_TENSOR_HEIGHT
  }

  getOutputTensorHeight = () => {
    // if(this.isPortrait() || IS_ANDROID){
    //     this.setState({
    //         outputTensorHeight: OUTPUT_TENSOR_HEIGHT
    //     })
    // } else {
    //     this.setState({
    //         outputTensorHeight: OUTPUT_TENSOR_WIDTH
    //     })         
    // }
    return this.isPortrait() || IS_ANDROID
      ? OUTPUT_TENSOR_HEIGHT
      : OUTPUT_TENSOR_WIDTH
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
    // console.log(this.state.orientation)
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
    const { isLoading, outputTensorHeight, outputTensorWidth } = this.state
    // console.log(this.getOutputTensorWidth())
    // console.log(this.getOutputTensorHeight())
    if (isLoading) {
      return <View></View>
    } else {
      return (
        <View>
          <TensorCamera
            // Standard Camera props
            style={styles.camera}
            type={Camera.Constants.Type.front}
            // Tensor related props
            resizeWidth={this.getOutputTensorWidth()}
            resizeHeight={this.getOutputTensorHeight()}
            // resizeDepth={3}
            // rotation={this.getTextureRotationAngleInDegrees()}
            // resizeHeight={200}
            // resizeWidth={152}
            resizeDepth={3}
            onReady={this.handleCameraStream}
            autorender={true}
          >
            {this.state.faces.length ? this.renderFaces() : undefined}
            </TensorCamera>
        </View>
      )
    }
  }

  async componentDidMount () {
    await tf.ready()

    this.setState({
      isLoading: false
    })
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  camera: {
    // flex: 1,
    // height: '85%',
    width: '100%',
    flex: 0,
    height: '100%',
    borderColor: 'green',
    borderWidth: 10,
    // width: 400,
    borderRadius: 360,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    // height: 400,
    overflow: 'hidden'
  },
  svg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 30
  },
})
