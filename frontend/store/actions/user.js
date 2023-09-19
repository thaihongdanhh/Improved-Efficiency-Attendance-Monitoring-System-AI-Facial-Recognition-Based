import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGIN_USER, GET_ERRORS } from "../constants/user";
import axios from "axios";
import setAuthToken from "../setAuthToken";
import jwtDecode from "jwt-decode";
import {SERVER} from "../constants/config";

export const checkPhoneNumber = (phone, callback) => {
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: AsyncStorage.getItem("jwtToken"),
        fingerprint: "123456",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    };

    const params = { phone }

    return dispatch => {
        axios
            .get(`${SERVER}/coffee/phone/check`, {
                headers: headers,
                params: params
            })
            .then(res => {
                callback(res.data)
            })
            .catch(err => {
                console.log(err)
            })
    }




}

export const requestLoginUSer = userData => {
    // console.log(userData)
    const params = {
        username: userData.username,
        password: userData.password,
        fingerprint: userData.fingerprint
    }

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: AsyncStorage.getItem("jwtToken"),
        fingerprint: "123456",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    };

    return dispatch => {
        axios
            .get(`${SERVER}/coffee/login`, {
                headers: headers,
                params: params
            })
            .then(res => {
                console.log(res.data.detail)
                // console.log(res.data.detail)
                if (typeof res.data.detail !== "string") {
                    const { token } = res.data.detail;
                    AsyncStorage.setItem("jwtToken", token);
                    AsyncStorage.setItem("userLogin", JSON.stringify(res.data.detail));
                    // console.log('set Item Ok')
                    setAuthToken(token);
                    // console.log('set Token Ok')
                    const decoded = jwtDecode(token);
                    // console.log(decoded)
                    dispatch(actLoginUser(decoded));
                    // console.log('decoded Ok')
                    //   callback();
                } else {
                    alert("Tài khoản hoặc mật khẩu sai gòi.");
                }
            })
            .catch(err => {
                console.log(err.response.data.detail)
                dispatch({
                    type: GET_ERRORS,
                    payload: err.response.data.detail
                });
            });
    };
};

export const registerUser = (username, fullname, callback) => {

    console.log('username', username)
    console.log('fullname', fullname)

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: AsyncStorage.getItem("jwtToken"),
        fingerprint: "123456",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    };

    // console.log(params)

    return dispatch => {
        axios
            .post(
                `${SERVER}/coffee/register`,
                // formData,
                {
                    username: username,
                    fullname: fullname,
                    fingerprint: '123456'
                }
            )
            .then(res => {
                callback(res.data);
                // console.log(large)
                // history.push("/");
                // return <Redirect to='/users' />
            })
            .catch(err => {
                // console.log(err)
                dispatch({
                    type: GET_ERRORS,
                    payload: err.response.data
                });
            });
    };
};