import axios from 'axios';
import { InteractionManager } from 'react-native';
import { SERVER } from "../constants/config";

export const uploadImages = (filename, username, deviceid, file_path, file_path_cropped , callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    // console.log(image, filename, username, deviceid)

    return dispatch => {
        axios
            .post(
                `${SERVER}/coffee/upload`,
                // formData,
                {
                    filename: filename,
                    username: username,
                    deviceid: deviceid,
                    file_path,
                    file_path_cropped
                }
            )
            .then(res => {
                // res.data.sizePerPage = sizePerPage
                // res.data.page = page
                // console.log(res.data)
                callback(res.data);
            })
            .catch(
                err => console.log(err.message)
            );
    }
  }

  export const cropImages = (image, filename, username, deviceid , callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    // console.log(image, filename, username, deviceid)

    return dispatch => {
        axios
            .post(
                `${SERVER}/coffee/crop`,
                // formData,
                {
                    file: image,
                    filename: filename,
                    username: username,
                    deviceid: deviceid
                }
            )
            .then(res => {
                // res.data.sizePerPage = sizePerPage
                // res.data.page = page
                // console.log(res.data)
                callback(res.data);
            })
            .catch(
                err => console.log(err.message)
            );
    }
  }

  export const fetchImages = (callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    return dispatch => {
        axios
            .get(
                `${SERVER}/coffee/fetch`,
                // formData,
            )
            .then(res => {
                // res.data.sizePerPage = sizePerPage
                // res.data.page = page
                // console.log(res.data)
                callback(res.data);
            })
            .catch(
                err => console.log(err.message)
            );
    }
  }