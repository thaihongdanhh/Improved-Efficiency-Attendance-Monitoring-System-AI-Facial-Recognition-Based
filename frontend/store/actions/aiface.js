import axios from 'axios';
import { InteractionManager } from 'react-native';
import { SERVER } from "../constants/config";


const sign = require('jwt-encode');

const secret = "ts6nJu7TGes*og$C63NKR412zVhtXsiw5Zd$LC7tk$B^6%WXU1";

const data = {
  type: 'browser',
  name: 'HRAI',
  time: Math.floor(Date.now() / 1000)
};

const jwt = sign(data, secret);


// export const checkFace = (face, EmpCode, lat, lng, callback) => {

//     return dispatch => {

//         axios.get("https://api.bigdatacloud.net/data/client-info")
//             .then(res => {
//                 const ip_info = res.data
//                 const headers = {
//                     "Content-Type": "multipart/form-data",
//                     fingerprint: "123456",
//                     Authorization: jwt,
//                     "ip": ip_info['ipString'],
//                     "device": ip_info['device'],
//                     "os": ip_info['os'],
//                     "userAgent": ip_info['userAgent'],
//                     "isMobile": ip_info['isMobile'],
//                     "userAgentDisplay": ip_info['userAgentDisplay'],
//                     "userAgentRaw": ip_info['userAgentRaw'],
//                     "Access-Control-Allow-Origin": "*",
//                     "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//                 };

//                 const base64Data = face.replace(/^data:image\/(png|jpeg);base64,/, "")

//                 const formData = new FormData();
//                 formData.append("file", base64Data);
//                 formData.append("EmpCode", EmpCode);
//                 formData.append("lat", lat);
//                 formData.append("lng", lng);

//                 console.log(EmpCode)

//                 axios
//                     .post(`${SERVER}/device/checkface`, formData, {
//                         headers: headers
//                     })
//                     .then(res => {
//                         // res.data.sizePerPage = sizePerPage
//                         // res.data.page = page
//                         // console.log(res.data)
//                         callback(res.data);
//                     })
//                     .catch(err => {
//                         console.log(err)
//                         // const { errors } = this.props            
//                         // alert(err.response.data.detail.image)
//                         // dispatch({
//                         //   type: GET_ERRORS,
//                         //   payload: err.response.data.detail
//                         // });
//                     });
//             })
//     };

// }



// export const fetchTimesheetPerson = (empcode, start_date, end_date, callback) => {
//     // const headers = {
//     //   "Content-Type": "multipart/form-data",
//     //   Authorization: localStorage.getItem("jwtToken"),
//     //   fingerprint: "123456",
//     //   "Access-Control-Allow-Origin": "*",
//     //   "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//     // };
  
//     return dispatch => {
  
//       axios.get("https://api.bigdatacloud.net/data/client-info")
//         .then(res => {
//           const ip_info = res.data
//           const headers = {
//             "Content-Type": "multipart/form-data",
//             fingerprint: "123456",
//             Authorization: jwt,
//             "ip": ip_info['ipString'],
//             "device": ip_info['device'],
//             "os": ip_info['os'],
//             "userAgent": ip_info['userAgent'],
//             "isMobile": ip_info['isMobile'],
//             "userAgentDisplay": ip_info['userAgentDisplay'],
//             "userAgentRaw": ip_info['userAgentRaw'],
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//           };
  
//           const is_manager = '0'
//           const is_hr = '0'
//           const department_in_charge_id = ''
//           const employee_code = empcode.split('_')[0]
//           const company_code = empcode.split('_')[1]
  
//           const params = {
//             department_in_charge_id,
//             is_hr,
//             start_date,
//             end_date,
//             is_manager,
//             employee_code,
//             company_code
//           }
  
//           axios
//             .get(`${SERVER}/schedule/timesheetall`, {
//               headers: headers,
//               params: params
//             })
//             .then(res => {
//               // res.data.sizePerPage = sizePerPage
//               // res.data.page = page
//               // console.log(res.data)
//               callback(res.data);
//             })
//             .catch(console.log);
//         })
//     };
//   }



// export const checkFaceLogin = (face, session, callback) => {
//     // const headers = {
//     //   "Content-Type": "multipart/form-data",
//     //   Authorization: localStorage.getItem("jwtToken"),
//     //   fingerprint: "123456",
//     //   "Access-Control-Allow-Origin": "*",
//     //   "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//     // };

//     return dispatch => {

//       axios.get("https://api.bigdatacloud.net/data/client-info")
//         .then(res => {
//           const ip_info = res.data
//           const headers = {
//             "Content-Type": "multipart/form-data",
//             fingerprint: "123456",
//             Authorization: jwt,
//             "ip": ip_info['ipString'],
//             "device": ip_info['device'],
//             "os": ip_info['os'],
//             "userAgent": ip_info['userAgent'],
//             "isMobile": ip_info['isMobile'],
//             "userAgentDisplay": ip_info['userAgentDisplay'],
//             "userAgentRaw": ip_info['userAgentRaw'],
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//           };
//           const base64Data = (face.replace(/^data:image\/png;base64,/, "")).replace(/^data:image\/png;base64,/, "")//.replace(/^data:image\/jpeg;base64,\/9j\//,"")    

//           const formData = new FormData();
//           formData.append("file", base64Data);
//           formData.append('session', session)

//           axios
//             .post(`${SERVER}/user/login/face`, formData, {
//               headers: headers
//             })
//             .then(res => {
//               // res.data.sizePerPage = sizePerPage
//               // res.data.page = page
//               // console.log(res.data)
//               callback(res.data);
//             })
//             .catch(err => {
//               console.log(err)
//               // const { errors } = this.props            
//               // alert(err.response.data.detail.image)
//               // dispatch({
//               //   type: GET_ERRORS,
//               //   payload: err.response.data.detail
//               // });
//             });
//         })
//     };

//   }

// export const updateFaceRegister = (Avatar, company_code, ObjType, EmpCode, EmpName, callback) => {
  
//     return dispatch => {
//       axios.get("https://api.bigdatacloud.net/data/client-info")
//         .then(res => {
//           const ip_info = res.data
//           const headers = {
//             "Content-Type": "multipart/form-data",
//             fingerprint: "123456",
//             Authorization: jwt,
//             "ip": ip_info['ipString'],
//             "device": ip_info['device'],
//             "os": ip_info['os'],
//             "userAgent": ip_info['userAgent'],
//             "isMobile": ip_info['isMobile'],
//             "userAgentDisplay": ip_info['userAgentDisplay'],
//             "userAgentRaw": ip_info['userAgentRaw'],
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//           };
//           const base64Data = Avatar.replace(/^data:image\/(png|jpeg);base64,/, "")
//           const formData = new FormData();
//           formData.append("EditBy", EmpCode);
//           formData.append('company_code', company_code);
//           formData.append("file", base64Data);
//           formData.append("EmpCode", EmpCode);
//           formData.append("EmpName", EmpName);
//           formData.append("ObjType", ObjType);
  
  
//           axios
//             .post(`${SERVER}/device/faceregisterpub`, formData, {
//               headers: headers
//             })
//             .then(res => {
//               // res.data.sizePerPage = sizePerPage
//               // res.data.page = page
//               // console.log(res.data)
//               callback(res.data);
//             })
//             .catch(console.log);
//         })
  
//     };
  
//   }

// export const checkAppointmentCode = (appointment_code, callback) => {
//     return dispatch => {
//       axios.get("https://api.bigdatacloud.net/data/client-info")
//         .then(res => {
//           const ip_info = res.data
//           const headers = {
//             "Content-Type": "multipart/form-data",
//             fingerprint: "123456",
//             Authorization: jwt,
//             "ip": ip_info['ipString'],
//             "device": ip_info['device'],
//             "os": ip_info['os'],
//             "userAgent": ip_info['userAgent'],
//             "isMobile": ip_info['isMobile'],
//             "userAgentDisplay": ip_info['userAgentDisplay'],
//             "userAgentRaw": ip_info['userAgentRaw'],
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//           };
  
//           const formData = new FormData();
//           formData.append("appointment_code", appointment_code);
//           axios
//             .post(`${SERVER}/company/speccode/check`, formData, {
//               headers: headers
//             })
//             .then(res => {
//               // res.data.sizePerPage = sizePerPage
//               // res.data.page = page
//               // console.log(res.data)
//               callback(res.data);
//             })
//             .catch(console.log);
//         })
//     };
//   }

// export const updateFaceRegisterVisitor = (Avatar, VisitorName, VisitorID, Company, CompanyCode, TimePlan, ReasonPlan, AppointmentCode, callback) => {
  
//     return dispatch => {
  
//       axios.get("https://api.bigdatacloud.net/data/client-info")
//         .then(res => {
//           const ip_info = res.data
//           const headers = {
//             "Content-Type": "multipart/form-data",
//             fingerprint: "123456",
//             Authorization: jwt,
//             "ip": ip_info['ipString'],
//             "device": ip_info['device'],
//             "os": ip_info['os'],
//             "userAgent": ip_info['userAgent'],
//             "isMobile": ip_info['isMobile'],
//             "userAgentDisplay": ip_info['userAgentDisplay'],
//             "userAgentRaw": ip_info['userAgentRaw'],
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//           };
//           const base64Data = Avatar.replace(/^data:image\/(png|jpeg);base64,/, "")
//           const formData = new FormData();
//           formData.append("file", base64Data);
//           formData.append("VisitorName", VisitorName);
//           formData.append("VisitorID", VisitorID);
//           formData.append("Company", Company);
//           formData.append("TimePlan", TimePlan);
//           formData.append("ReasonPlan", ReasonPlan);
//           formData.append("AppointmentCode", AppointmentCode);
//           formData.append("CompanyCode", CompanyCode);
  
  
//           axios
//             .post(`${SERVER}/device/faceregisterpub/visitor`, formData, {
//               headers: headers
//             })
//             .then(res => {
//               // res.data.sizePerPage = sizePerPage
//               // res.data.page = page
//               // console.log(res.data)
//               callback(res.data);
//             })
//             .catch(console.log);
//         })
//     };
  
//   }


// export const insertExplan = (params, callback) => {
//     // export const insertEmployee = ( params, callback) => {
//     const headers = {
//         "Content-Type": "multipart/form-data",
//         Authorization: localStorage.getItem("jwtToken"),
//         fingerprint: "123456",
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//     };

//     // alert(String(params.company_code))
//     // alert(String(params.employee_code))
//     // alert(String(params.timesheet_date))
//     // alert(String(params.explan_text))
//     // alert(String(params.image_text))
//     // alert(String(params.timesheet_month))

//     const formData = new FormData();
//     formData.append("company_code", params.company_code);
//     formData.append("employee_code", params.employee_code);
//     formData.append("timesheet_date", params.timesheet_date);
//     formData.append("explan_text", params.explan_text);
//     formData.append("image_text", params.image_text);
//     formData.append('timesheet_month', params.timesheet_month)

//     return dispatch => {
//         axios
//             .post(`${SERVER}/explan/insert`, formData, {
//                 headers: headers
//             })
//             .then(res => {
//                 // res.data.sizePerPage = sizePerPage
//                 // res.data.page = page
//                 // console.log(res.data)
//                 callback(res.data);
//             })
//             .catch(console.log);
//     };

// }


// export const deleteExplan = (params, callback) => {
//     // export const insertEmployee = ( params, callback) => {
//     const headers = {
//       "Content-Type": "multipart/form-data",
//       Authorization: localStorage.getItem("jwtToken"),
//       fingerprint: "123456",
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
//     };
  
//     const formData = new FormData();
//     formData.append("company_code", params.company_code);
//     formData.append("employee_code", params.employee_code);
//     formData.append("timesheet_date", params.timesheet_date);
//     formData.append('timesheet_month', params.timesheet_month)
  
//     return dispatch => {
//       axios
//         .post(`${SERVER}/explan/delete`, formData, {
//           headers: headers
//         })
//         .then(res => {
//           // res.data.sizePerPage = sizePerPage
//           // res.data.page = page
//           // console.log(res.data)
//           callback(res.data);
//         })
//         .catch(console.log);
//     };
  
//   }


export const deleteExplan = (params, callback) => {   
 
    return dispatch => {
      axios
        .post(`${SERVER}/mobile/explan/delete`, {
          company_code: params.company_code,
          employee_code: params.employee_code,
          timesheet_date: params.timesheet_date,
          timesheet_month: params.timesheet_month
        })
        .then(res => {
          // res.data.sizePerPage = sizePerPage
          // res.data.page = page
          // console.log(res.data)
          callback(res.data);
        })
        .catch(console.log);
    };
  
  }

export const insertExplan = (params, callback) => {

    return dispatch => {
        axios
            .post(`${SERVER}/mobile/explan/insert`, {
                company_code: params.company_code,
                employee_code: params.employee_code,
                timesheet_date: params.timesheet_date,
                explan_text: params.explan_text,
                image_text: params.base64,
                timesheet_month: params.timesheet_month
            })
            .then(res => {
                // res.data.sizePerPage = sizePerPage
                // res.data.page = page
                // console.log(res.data)
                callback(res.data);
            })
            .catch(console.log);
    };

}

export const fetchVisitorDetail = (CompanyCode, VisitorCode, callback) => {
    // console.log(CompanyCode)
    // console.log(VisitorCode)

    return dispatch => {
        axios
            .post(`${SERVER}/mobile/visitor/fetchdetail`, {
                company_code: CompanyCode,
                visitor_code: VisitorCode
            })
            .then(res => {
                // res.data.sizePerPage = sizePerPage
                // res.data.page = page
                // console.log(res.data)
                callback(res.data);
            })
            .catch(console.log);
    };
}

export const updateFaceRegisterVisitor = (Avatar, VisitorName, VisitorID, Company, CompanyCode, TimePlan, ReasonPlan, AppointmentCode, callback) => {

    // console.log(
    //     Avatar,
    //     VisitorName,
    //     VisitorID,
    //     Company,
    //     TimePlan,
    //     ReasonPlan,
    //     AppointmentCode,
    //     CompanyCode
    // )

    return dispatch => {
        axios
            .post(`${SERVER}/mobile/visitor/faceregisterpub`, {
                file: Avatar,
                VisitorName,
                VisitorID,
                Company,
                TimePlan,
                ReasonPlan,
                AppointmentCode,
                CompanyCode
            })
            .then(res => {
                // res.data.sizePerPage = sizePerPage
                // res.data.page = page
                // console.log(res.data)
                callback(res.data);
            })
            .catch(console.log);
    };

}


export const checkAppointmentCode = (appointment_code, callback) => {
    return dispatch => {
        axios
            .post(`${SERVER}/mobile/speccode/check`, {
                appointment_code
            })
            .then(res => {
                // res.data.sizePerPage = sizePerPage
                // res.data.page = page
                // console.log(res.data)
                callback(res.data);
            })
            .catch(console.log);
    };
}

export const updateFaceRegister = (Avatar, EmpName, callback) => {
  
    return dispatch => {
        axios
        .post(`${SERVER}/mobile/faceregisterpub`, {
            file: Avatar, 
            name: EmpName
        })
        .then(res => {
          // res.data.sizePerPage = sizePerPage
          // res.data.page = page
          // console.log(res.data)
          callback(res.data);
        })
        .catch(console.log);
    };
  
  }


export const fetchTimesheetPerson = (empcode, start_date, end_date, callback) => { 

    const is_manager = '0'
    const is_hr = '0'
    const department_in_charge_id = ''
    const employee_code = empcode.split('_')[0]
    const company_code = empcode.split('_')[1]


    return dispatch => {
        axios
            .post(
                `${SERVER}/mobile/timesheetall`,
                // formData,
                {
                    is_manager,
                    is_hr,
                    department_in_charge_id,
                    company_code: company_code,
                    employee_code: employee_code,
                    start_date: start_date,
                    end_date: end_date
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

export const fetchTimesheetByMonth = (empcode, timesheet_month, callback) => {

    const employee_code = empcode.split('_')[0]
    const company_code = empcode.split('_')[1]
  
    return dispatch => {
      axios
        .post(`${SERVER}/mobile/timesheetbymonth`, {
            employee_code,
            company_code,
            timesheet_month
        })
        .then(res => {
          // res.data.sizePerPage = sizePerPage
          // res.data.page = page
          // console.log(res.data)
          callback(res.data);
        })
        .catch(console.log);
    };
  }

export const fetchEmployeeDetail = (employee_code, callback) => {
    return dispatch => {

        axios
            .post(`${SERVER}/mobile/employee/fetch_detail`, {
                employee_code
            })
            .then(res => {
                callback(res.data);
            })
            .catch(console.log);
    };

}


export const checkFace = (face, faceCrop, EmpCode, lat, lng, callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    // console.log(face.slice(0, 50))
    // console.log(EmpCode)
    // console.log(lat)
    // console.log(lng)

    return dispatch => {
        axios
            .post(
                `${SERVER}/mobile/checkface`,
                // formData,
                {
                    file: face,       
                    filecrop: faceCrop,
                    EmpCode: EmpCode,
                    lat: lat,
                    lng: lng             
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



  export const checkFaceLogin = (face, session, faceCrop,  callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    console.log(face.slice(0, 50))
    console.log(session)
    // console.log(lat)
    // console.log(lng)

    return dispatch => {
        axios
            .post(
                `${SERVER}/mobile/checkface_login`,
                // formData,
                {
                    file: face,    
                    filecrop: faceCrop,   
                    session
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

export const checkFaceOut = (face, EmpCode, lat, lng, callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    // console.log(face.slice(0, 50))
    // console.log(EmpCode)
    // console.log(lat)
    // console.log(lng)

    return dispatch => {
        axios
            .post(
                `${SERVER}/mobile/checkface_out`,
                // formData,
                {
                    file: face,       
                    EmpCode: EmpCode,
                    lat: lat,
                    lng: lng             
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

export const faceDetect = (image, callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    // console.log(image)

    return dispatch => {
        axios
            .post(
                `${SERVER}/aiface/detect`,
                // formData,
                {
                    file: image,                    
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

  export const faceRegister = (image,name, callback) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    };

    // console.log(image)

    return dispatch => {
        axios
            .post(
                `${SERVER}/aiface/register`,
                // formData,
                {
                    file: image,         
                    name: name           
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