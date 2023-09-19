import { combineReducers } from "redux";
import userReducer from './user';
import errorsReducer from './errors'
import { configureStore } from '@reduxjs/toolkit'
import { applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";

const rootReducer =
  {
    user: userReducer,
    errors: errorsReducer,
  }
;

const composeEnhancers = typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
    })
    : compose;

const enhancer = composeEnhancers(
  applyMiddleware(thunk)
  // other store enhancers if any
);
const store = configureStore(
  {
    reducer: rootReducer
  }, enhancer);

export default store;