import React, { Fragment } from 'react';
import { Image } from "react-native";
import * as Font from "expo-font";
import { Asset } from "expo-asset";
import { Block, GalioProvider } from "galio-framework";
import { NavigationContainer } from "@react-navigation/native";

// Before rendering any navigation stack
import { enableScreens } from "react-native-screens";
enableScreens();

import Screens from "./navigation/Screens";
import { Images, articles, nowTheme } from "./constants";

import Entypo from '@expo/vector-icons/Entypo';

import * as SplashScreen from 'expo-splash-screen';

import { Provider } from 'react-redux';
import store  from "./store/reducers/index";

import {
  ImageBackground,
  StyleSheet,
  StatusBar,
  Dimensions
} from "react-native";

// cache app images
const assetImages = [
  Images.Pro,
  Images.NowLogo,
  Images.iOSLogo,
  Images.androidLogo,
  Images.CreativeTimLogo,
  Images.InvisionLogo,
  Images.RegisterBackground,  
];

// cache product images
articles.map((article) => assetImages.push(article.image));

function cacheImages(images) {
  return images.map((image) => {
    if (typeof image === "string") {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

SplashScreen.preventAutoHideAsync();

export default class App extends React.Component {
  state = {
    isLoading: true,
  };

  prepare = async () => {
    try {
      // Pre-load fonts, make any API calls you need to do here
      await console.log('OK');
      await Font.loadAsync(Entypo.font);
      await Font.loadAsync({
        "montserrat-regular": require("./assets/font/Montserrat-Regular.ttf"),
        "montserrat-bold": require("./assets/font/Montserrat-Bold.ttf"),
      });
      await console.log('OK');
      await new Promise.all([...cacheImages(assetImages)]);
      await console.log('OK');
      // Artificially delay for two seconds to simulate a slow loading
      // experience. Please remove this if you copy and paste the code!
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      console.warn(e);
    } finally {
      // Tell the application to render
      this.setState({
        isLoading: false,
      },async () => {
        // console.log(this.state.isLoading)
        await SplashScreen.hideAsync();
      })

    }
  }

  render() {
    const {
      isLoading
    } = this.state

    if(isLoading){
      this.prepare() 
    }

    return (
      <Fragment>
        {(!isLoading) && (
          <NavigationContainer>
            <GalioProvider theme={nowTheme}>
              <Block flex>
                <Provider
                  store={store}
                >
                  {Platform.OS === "ios" && <StatusBar barStyle="default" />}
                  <Screens />
                </Provider>
              </Block>
            </GalioProvider>
          </NavigationContainer>
        )}
      </Fragment>
    );
  }
}
