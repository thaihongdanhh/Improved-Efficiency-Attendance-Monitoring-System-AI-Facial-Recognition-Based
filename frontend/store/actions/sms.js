import axios from 'axios';
import { SERVER } from "../constants/config";

// export const fetchSMS = (callback) => {
 
//     return dispatch => {
//       axios
//         // .get(`${SERVER}/qrcodegv/fetch`)
//         .get('https://ai.uel.edu.vn:5002/qrcodegv/fetch')
//         .then(function (res) {
//           // res.data.sizePerPage = sizePerPage
//           // res.data.page = page
//           console.log(res.data)
//           callback(res.data);
//         })
//         .catch(function (error) {console.log(error.message)});
//     };
  
//   }

// export const fetchSMS = (callback) => {
//     axios
//       .get('https://jsonplaceholder.typicode.com/posts/1')
//       .then(function (response) {
//         // handle success
//         alert(JSON.stringify(response.data));
//         callback(JSON.stringify(response.data));
//       })
//       .catch(function (error) {
//         // handle error
//         alert(error.message);
//       })
//       .finally(function () {
//         // always executed
//         alert('Finally called');
//       });
//   };