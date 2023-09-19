// drawer
import CustomDrawerContent from "./Menu";
import { Dimensions, Image, } from "react-native";
// header for screens
// screens
import Camera from "../screens/Camera"
import Camera2 from "../screens/Camera2"
import CheckIn from "../screens/CheckIn";
import CheckOut from "../screens/CheckOut";
import CheckLogin from "../screens/CheckLogin";
import RegisterFace from "../screens/RegisterFace";
import RegisterAppointment from "../screens/RegisterAppointment";

import Pro from "../screens/Pro";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import { nowTheme } from "../constants";
import Images from "../constants/Images";
import tabs from "../constants/tabs";

const { width } = Dimensions.get("screen");

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function HomeStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
      initialRouteName="Chấm công vào"
    >       
      <Stack.Screen
        name="Chấm công vào"
        component={CheckIn}
        options={{
          header: ({ navigation, scene }) => (
            // <Header title="Chấm công vào" navigation={navigation} scene={scene} />
            <Image style={{              
                // height: 45,
                width: "100%",
                resizeMode: 'contain',       
            }} 
            source={Images.Logo} />
          ),
          cardStyle: { backgroundColor: "#FFFFFF" }
        }}
      />   
      <Stack.Screen
        name="Chấm công ra"
        component={CheckOut}
        options={{
          header: ({ navigation, scene }) => (
            // <Header title="Chấm công vào" navigation={navigation} scene={scene} />
            <Image style={{              
                // height: 45,
                width: "100%",
                resizeMode: 'contain',       
            }} 
            source={Images.Logo} />
          ),
          cardStyle: { backgroundColor: "#FFFFFF" }
        }}
      />      
    </Stack.Navigator>
  );
}


function CheckInStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
      initialRouteName="Chấm công vào"
    >       
      <Stack.Screen
        name="Chấm công vào"
        component={CheckIn}
        options={{
          header: ({ navigation, scene }) => (
            // <Header title="Chấm công vào" navigation={navigation} scene={scene} />
            <Image style={{              
                // height: 45,
                width: "100%",
                resizeMode: 'contain',       
            }} 
            source={Images.Logo} />
          ),
          cardStyle: { backgroundColor: "#FFFFFF", paddingTop: 50 }
        }}
      />   
    </Stack.Navigator>
  );
}


function CheckOutStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
      initialRouteName="Chấm công ra"
    >       
      <Stack.Screen
        name="Chấm công ra"
        component={Camera2}
        options={{
          header: ({ navigation, scene }) => (
            // <Header title="Chấm công vào" navigation={navigation} scene={scene} />
            <Image style={{              
                // height: 45,
                width: "100%",
                resizeMode: 'contain',       
            }} 
            source={Images.Logo} />
          ),
          cardStyle: { backgroundColor: "#FFFFFF" }
        }}
      />      
    </Stack.Navigator>
  );
}

function CheckLoginStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
      initialRouteName="Xem lịch sử chấm công"
    >       
      <Stack.Screen
        name="Xem lịch sử chấm công"
        component={CheckLogin}
        options={{
          header: ({ navigation, scene }) => (
            // <Header title="Chấm công vào" navigation={navigation} scene={scene} />
            <Image style={{              
                // height: 45,
                width: "100%",
                resizeMode: 'contain',       
            }} 
            source={Images.Logo} />
          ),
          cardStyle: { backgroundColor: "#FFFFFF" }
        }}
      />      
    </Stack.Navigator>
  );
}

function RegisterFaceStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
      initialRouteName="Đăng ký"
    >       
      <Stack.Screen
        name="Đăng ký"
        component={RegisterFace}
        options={{
          header: ({ navigation, scene }) => (
            // <Header title="Chấm công vào" navigation={navigation} scene={scene} />
            <Image style={{              
                // height: 45,                
                // paddingTop: "",                
                width: "100%",
                resizeMode: 'contain',       
            }} 
            source={Images.Logo} 
            />
          ),
          cardStyle: { backgroundColor: "#FFFFFF", paddingTop: 50 }
        }}
      />      
    </Stack.Navigator>
  );
}

function RegisterAppointmentStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
      initialRouteName="Đăng ký lịch hẹn"
    >       
      <Stack.Screen
        name="Đăng ký lịch hẹn"
        component={RegisterAppointment}
        options={{
          header: ({ navigation, scene }) => (
            // <Header title="Chấm công vào" navigation={navigation} scene={scene} />
            <Image style={{              
                // height: 45,
                width: "100%",
                resizeMode: 'contain',       
            }} 
            source={Images.Logo} />
          ),
          cardStyle: { backgroundColor: "#FFFFFF" }
        }}
      />      
    </Stack.Navigator>
  );
}

function AppStack(props) {
  // console.log(props)
  return (
    <Drawer.Navigator
      style={{ flex: 1 }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      drawerStyle={{
        backgroundColor: nowTheme.COLORS.PRIMARY,
        width: width * 0.8,
      }}
      screenOptions={{
        activeTintcolor: nowTheme.COLORS.WHITE,
        inactiveTintColor: nowTheme.COLORS.WHITE,
        activeBackgroundColor: "transparent",
        itemStyle: {
          width: width * 0.75,
          backgroundColor: "transparent",
          paddingVertical: 16,
          paddingHorizonal: 12,
          justifyContent: "center",
          alignContent: "center",
          alignItems: "center",
          overflow: "hidden",
        },
        labelStyle: {
          fontSize: 18,
          marginLeft: 12,
          fontWeight: "normal",
        },
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
}

export default function OnboardingStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={Pro}
        option={{
          headerTransparent: true,
        }}
      />
      <Stack.Screen name="App" component={AppStack} />
      <Stack.Screen name="CheckIn" component={CheckInStack} />
      <Stack.Screen name="CheckOut" component={CheckOutStack} />
      <Stack.Screen name="CheckLogin" component={CheckLoginStack} />
      <Stack.Screen name="RegisterFace" component={RegisterFaceStack} />
      <Stack.Screen name="RegisterAppointment" component={RegisterAppointmentStack} />      
    </Stack.Navigator>
  );
}
