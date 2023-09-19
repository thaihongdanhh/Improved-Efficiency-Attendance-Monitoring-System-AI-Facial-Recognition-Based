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