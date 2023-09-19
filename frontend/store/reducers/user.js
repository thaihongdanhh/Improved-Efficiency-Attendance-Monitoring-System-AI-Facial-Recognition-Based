import { LOGIN_USER } from "../constants/user";
import { isEmpty } from "validator";

let initalState = {
  userProfile: {}
};

const userReducer = (state = initalState, action) => {
  switch (action.type) {
    case LOGIN_USER: 
    {
      const updateState = { ...state };
      updateState.userProfile = action.payload;
      updateState.isAuthenticated = !isEmpty(action.payload.username);
      return updateState;
    }
    default:
      return state;
  }
};
export default userReducer;