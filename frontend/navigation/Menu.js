import React from "react";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Linking
} from "react-native";
import { Block, Text, theme } from "galio-framework";
import { useSafeArea } from "react-native-safe-area-context";
import Images from "../constants/Images";
import { DrawerItem as DrawerCustomItem, Icon } from "../components";

import nowTheme from "../constants/Theme";

const { width } = Dimensions.get("screen");

function CustomDrawerContent({
  drawerPosition,
  navigation,
  profile,
  focused,
  state,
  ...rest
}) {
  const insets = useSafeArea();
  const screens = [
    "Chấm công vào",
    "Chấm công ra",
    "Xem lịch sử chấm công",
    "Đăng ký lịch hẹn"
    // "Chụp hình",
    // "Components",
    // "Articles",
    // "Profile",
    // "Account",
    // "Settings"
  ];
  return (
    <Block
      style={styles.container}
      forceInset={{ top: "always", horizontal: "never" }}
    >
      <Block style={styles.header}>
        <Image style={styles.logo} source={Images.Logo} />
        <Block right style={styles.headerIcon}>
          <Icon
            name="align-left-22x"
            family="NowExtra"
            size={15}
            color={"white"}
          />
        </Block>
      </Block>
      <Block flex style={{ paddingLeft: 8, paddingRight: 14, marginVertical: 30 }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {screens.map((item, index) => {
            return (
              <DrawerCustomItem
                title={item}
                key={index}
                navigation={navigation}
                focused={state.index === index ? true : false}
              />
            );
          })}
          <Block flex style={{ marginTop: 24, marginVertical: 8, paddingHorizontal: 8 }}>
          <Block
            style={{ borderColor: 'white', width: '93%', borderWidth: StyleSheet.hairlineWidth, marginHorizontal: 10}}
          />
        </Block>
        </ScrollView>
      </Block>
    </Block>
  );
}

// /*
// <TouchableOpacity onPress={() => props.navigation.navigate('Onboarding')}
//           style={{ marginLeft: 10, fontFamily: 'montserrat-regular' }}
//         >
//           <DrawerItem {...props} title="GETTING STARTED" />
//         </TouchableOpacity>

// <TouchableOpacity onPress={() => props.navigation.navigate('Onboarding')}
//       style={{ marginLeft: 10, fontFamily: 'montserrat-regular' }}
//     >
//       <DrawerItem {...props} title="LOGOUT" navigation={navigation} />
//     </TouchableOpacity>
// */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#006464'
  },
  header: {
    paddingHorizontal: 28,
    paddingBottom: theme.SIZES.BASE,
    paddingTop: theme.SIZES.BASE * 3,
    justifyContent: "center"
  },
  headerIcon: {
    marginTop: -30
  },
  logo: {
    height: 45,
    width: 200
  }
});

export default CustomDrawerContent;
