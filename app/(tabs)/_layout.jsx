import { View, Text, Image, TouchableOpacity, Platform } from "react-native";
import React, { useContext } from "react";
import { Tabs } from "expo-router";
import { Entypo, Feather, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Colors, theme} from "../../constants/Colors";
import { Svg, Path } from "react-native-svg";
import { setStatusBarBackgroundColor, StatusBar } from "expo-status-bar";
import { DefaultTheme } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { color } from "@rneui/base";
import { useActiveColors } from "@/constants/ThemeMode";
import { Screen } from "react-native-screens";
import { GlobalContext } from "@/context/GlobalProvider";


const AcytivityLogo = ({ fill = "#000", width = 24, height = 24 }) => {
  return (
    <Svg
      viewBox="0 0 20 29"
      width={width}
      height={height}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d=" M14.0771 11.4282L12.573 7.08287L16.5977 4.36894L11.5907 4.32832L9.99948 0L8.40931 4.32454L3.40231 4.36516L7.427 7.07909L5.92293 11.4244L10.0005 8.77944L14.0771 11.4282ZM9.80551 21.1183L19.999 16.4055V11.6917L9.81899 16.3979L0 11.7985V16.5217L9.80551 21.1183ZM9.81899 24.2034L0 19.604V24.3272L9.80654 28.92L20 24.2072V19.4935L9.81899 24.2034Z" />
    </Svg>
  );
};

const PartyLogo = ({ fill = "#000", width = 24, height = 24 }) => {
  return (
    <Svg
      viewBox="0 0 32 32"
      width={width}
      height={height}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="M15.371 13.0409C15.482 13.0779 15.597 13.1049 15.713 13.1219C15.898 13.1689 16.086 13.2019 16.276 13.2219C16.3665 13.6573 16.601 14.0495 16.9417 14.3351C17.2825 14.6208 17.7095 14.7834 18.154 14.7966C18.5985 14.8097 19.0344 14.6728 19.3915 14.4078C19.7485 14.1427 20.0059 13.7652 20.122 13.3359C20.34 12.5499 20.452 11.7379 20.455 10.9219C20.9322 10.2745 21.3247 9.56881 21.623 8.82192L21.636 8.79192L21.743 8.53192L21.88 8.18592C22.0263 7.80687 22.1647 7.42479 22.295 7.03992L22.322 6.95992L22.332 6.92792C22.4 6.72792 22.468 6.50592 22.532 6.28192C22.57 6.15292 22.606 6.02192 22.641 5.88992C22.8054 5.3046 22.9132 4.70485 22.963 4.09892V4.06892C22.9803 3.57296 22.8126 3.08827 22.4925 2.70903C22.1725 2.3298 21.7228 2.08312 21.231 2.01692C20.842 1.967 20.447 2.03493 20.097 2.21192C19.7896 2.36755 19.5277 2.59995 19.3365 2.88658C19.1454 3.17321 19.0315 3.50435 19.006 3.84792V3.85792C18.9281 4.46941 18.7839 5.07061 18.576 5.65092C18.476 5.95092 18.376 6.23592 18.276 6.49092C18.076 6.38792 17.866 6.30092 17.652 6.23092L17.633 6.22192C16.7325 5.93564 15.7555 6.01568 14.9137 6.44471C14.0718 6.87373 13.4329 7.61719 13.1354 8.51399C12.8379 9.41079 12.9057 10.3887 13.3241 11.2359C13.7426 12.083 14.478 12.7312 15.371 13.0399V13.0409ZM19.157 13.0719C19.1038 13.2694 18.99 13.4451 18.8317 13.5746C18.6734 13.704 18.4785 13.7806 18.2744 13.7935C18.0704 13.8064 17.8674 13.755 17.694 13.6466C17.5207 13.5381 17.3856 13.3781 17.308 13.1889C17.498 13.1549 17.685 13.1069 17.867 13.0449C18.4171 12.8492 18.9231 12.5467 19.356 12.1549C19.306 12.4649 19.24 12.7699 19.157 13.0719ZM14.047 8.81192C14.1539 8.48947 14.3233 8.19125 14.5456 7.9343C14.7678 7.67735 15.0385 7.4667 15.3422 7.3144C15.6459 7.1621 15.9766 7.07113 16.3154 7.04668C16.6542 7.02223 16.9946 7.06479 17.317 7.17192L17.347 7.18192C17.542 7.24392 17.73 7.32592 17.908 7.42592L17.887 7.47492V7.48692C17.6634 8.00729 17.3597 8.48946 16.987 8.91592L16.971 8.93192L16.946 8.96092C16.9141 8.99855 16.8807 9.03491 16.846 9.06992C16.813 9.05644 16.7796 9.04377 16.746 9.03192L16.716 9.02192C16.5568 8.9693 16.3833 8.98185 16.2334 9.0568C16.0835 9.13176 15.9694 9.26304 15.916 9.42192C15.886 9.49935 15.8732 9.58235 15.8784 9.66521C15.8836 9.74807 15.9066 9.82882 15.946 9.90192C16.006 10.0299 16.108 10.1329 16.235 10.1939C16.269 10.2019 16.302 10.2109 16.335 10.2219C16.425 10.2539 16.519 10.2749 16.614 10.2829C16.7662 10.2919 16.9178 10.2572 17.051 10.1829C17.121 10.1469 17.188 10.1059 17.251 10.0589C17.419 9.92692 17.573 9.77892 17.709 9.61392L17.719 9.60392C18.1658 9.10049 18.5293 8.52896 18.796 7.91092C18.8271 7.84 18.8564 7.76831 18.884 7.69592C18.8852 7.691 18.8852 7.68584 18.884 7.68092L18.894 7.65692C18.9496 7.5266 19.0036 7.39559 19.056 7.26392L19.09 7.17692L19.124 7.08892C19.548 6.07392 19.844 5.00992 20.007 3.92192C20.026 3.66246 20.1454 3.42066 20.34 3.24792C20.5337 3.0755 20.788 2.98703 21.047 3.00192C21.262 3.01392 21.467 3.09792 21.627 3.24192C21.7388 3.34001 21.8274 3.46183 21.8862 3.5985C21.9451 3.73517 21.9726 3.88324 21.967 4.03192C21.957 4.19092 21.938 4.35892 21.912 4.53192C21.832 5.02392 21.72 5.51192 21.576 5.98892L21.534 6.12892C21.3524 6.72481 21.1472 7.31327 20.919 7.89292L20.886 7.97692C20.8293 8.12047 20.7713 8.26348 20.712 8.40592L20.697 8.44192L20.611 8.64992C20.2593 9.46576 19.7822 10.2216 19.197 10.8899C18.7286 11.4859 18.09 11.9254 17.366 12.1499C17.0264 12.2422 16.672 12.2666 16.323 12.2219C16.1804 12.2043 16.0394 12.1762 15.901 12.1379C15.8281 12.1316 15.7562 12.1165 15.687 12.0929C15.3638 11.9852 15.065 11.815 14.8077 11.5918C14.5503 11.3686 14.3395 11.0969 14.1872 10.7922C14.0349 10.4875 13.9441 10.1558 13.9201 9.81601C13.896 9.47623 13.9391 9.13503 14.047 8.81192ZM12.06 3.97992C11.9553 4.05411 11.8368 4.10657 11.7115 4.13418C11.5862 4.1618 11.4566 4.16402 11.3305 4.14071C11.2043 4.11741 11.0841 4.06904 10.9769 3.99848C10.8697 3.92792 10.7778 3.83659 10.7066 3.72989C10.6353 3.6232 10.5861 3.5033 10.562 3.37728C10.5379 3.25126 10.5392 3.12169 10.566 2.99621C10.5928 2.87073 10.6445 2.7519 10.718 2.64673C10.7915 2.54157 10.8853 2.4522 10.994 2.38392C11.2056 2.25087 11.4608 2.20565 11.7053 2.25785C11.9498 2.31006 12.1643 2.45559 12.3032 2.66348C12.442 2.87138 12.4943 3.12524 12.4489 3.37108C12.4035 3.61693 12.2639 3.83536 12.06 3.97992ZM23.968 22.8259C24.0737 22.7508 24.1934 22.6977 24.32 22.6697C24.4466 22.6417 24.5776 22.6393 24.7051 22.6628C24.8327 22.6862 24.9542 22.735 25.0625 22.8063C25.1709 22.8775 25.2639 22.9698 25.336 23.0776C25.408 23.1853 25.4578 23.3065 25.4822 23.4339C25.5067 23.5612 25.5054 23.6922 25.4783 23.819C25.4513 23.9458 25.3991 24.0659 25.3248 24.1722C25.2506 24.2786 25.1558 24.3689 25.046 24.4379C24.8322 24.5723 24.5744 24.6181 24.3274 24.5655C24.0804 24.5128 23.8637 24.3659 23.7233 24.156C23.5829 23.9461 23.53 23.6897 23.5756 23.4413C23.6213 23.1929 23.7621 22.9721 23.968 22.8259ZM24.967 8.91192C25.2746 8.91192 25.5697 8.78971 25.7872 8.57216C26.0048 8.35462 26.127 8.05957 26.127 7.75192C26.127 7.44427 26.0048 7.14922 25.7872 6.93168C25.5697 6.71413 25.2746 6.59192 24.967 6.59192C24.6593 6.59192 24.3643 6.71413 24.1467 6.93168C23.9292 7.14922 23.807 7.44427 23.807 7.75192C23.807 8.05957 23.9292 8.35462 24.1467 8.57216C24.3643 8.78971 24.6593 8.91192 24.967 8.91192ZM6.65097 8.71592C6.52441 8.80436 6.38146 8.86664 6.23052 8.89912C6.07957 8.93159 5.92366 8.9336 5.77192 8.90504C5.62019 8.87647 5.47568 8.8179 5.34688 8.73276C5.21807 8.64762 5.10756 8.53762 5.02182 8.40921C4.93608 8.2808 4.87684 8.13657 4.84757 7.98497C4.8183 7.83336 4.81959 7.67744 4.85137 7.52635C4.88314 7.37525 4.94476 7.23202 5.03261 7.10505C5.12046 6.97807 5.23278 6.86992 5.36297 6.78692C5.61891 6.61612 5.93221 6.55399 6.23395 6.61418C6.5357 6.67438 6.80117 6.85199 6.97197 7.10792C7.14277 7.36385 7.20491 7.67716 7.14471 7.9789C7.08451 8.28065 6.90691 8.54612 6.65097 8.71692" />
      <Path d="M29.396 14.89C29.2714 14.9476 29.1368 14.98 28.9997 14.9855C28.8626 14.991 28.7257 14.9694 28.597 14.922C27.5365 14.5252 26.3922 14.4059 25.2726 14.5755C24.1531 14.7451 23.0954 15.1979 22.2 15.891C24.527 15.951 26.802 16.585 28.823 17.74C29.3172 18.0189 29.681 18.4819 29.8352 19.028C29.9894 19.5742 29.9215 20.1591 29.6462 20.6553C29.3709 21.1515 28.9106 21.5188 28.3656 21.677C27.8206 21.8352 27.2352 21.7716 26.737 21.5C25.5406 20.8056 24.2102 20.374 22.8341 20.2338C21.4579 20.0937 20.0678 20.2481 18.756 20.687C19.091 21.33 19.342 22.014 19.501 22.722C19.558 22.933 19.586 23.152 19.585 23.37C19.6189 23.6463 19.5937 23.9268 19.5109 24.1926C19.4281 24.4585 19.2898 24.7037 19.105 24.912C19.025 24.992 18.936 25.062 18.84 25.121C18.5445 25.4048 18.1813 25.6083 17.785 25.712L5.04698 29.122C4.63629 29.2316 4.20397 29.2311 3.79353 29.1205C3.3831 29.0099 3.00903 28.7932 2.70897 28.4921C2.40891 28.191 2.19344 27.8162 2.08425 27.4054C1.97507 26.9946 1.97601 26.5623 2.08698 26.152L5.49698 13.412C5.60171 13.0111 5.80842 12.6442 6.09698 12.347C6.15391 12.2548 6.221 12.1692 6.29698 12.092C6.49873 11.9117 6.73598 11.7757 6.99346 11.6927C7.25094 11.6097 7.52295 11.5815 7.79198 11.61C8.03498 11.604 8.27798 11.635 8.51198 11.702C9.13303 11.8423 9.73524 12.0558 10.306 12.338C10.586 10.718 10.316 9.04998 9.53698 7.60198C9.38979 7.32748 9.35767 7.00575 9.44769 6.70756C9.5377 6.40938 9.74249 6.15917 10.017 6.01198C10.2915 5.86478 10.6132 5.83266 10.9114 5.92268C11.2096 6.01269 11.4598 6.21748 11.607 6.49198C12.7765 8.67074 13.0712 11.2135 12.431 13.602C13.2073 14.153 13.9453 14.7561 14.64 15.407C14.8507 15.1934 15.1364 15.0706 15.4364 15.0648C15.7363 15.0589 16.0267 15.1706 16.2455 15.3758C16.4643 15.581 16.5942 15.8636 16.6076 16.1633C16.6209 16.463 16.5167 16.7561 16.317 16.98C17.7656 16.4131 19.2888 16.059 20.839 15.929C20.716 15.8303 20.6169 15.7052 20.5489 15.563C20.4809 15.4208 20.4458 15.2651 20.4462 15.1075C20.4466 14.9499 20.4824 14.7944 20.5511 14.6525C20.6198 14.5106 20.7196 14.386 20.843 14.288C22.0233 13.3545 23.4246 12.7416 24.9113 12.5086C26.398 12.2756 27.9197 12.4304 29.329 12.958C29.5221 13.0311 29.6894 13.1598 29.8097 13.3277C29.9299 13.4956 29.9979 13.6953 30.0051 13.9017C30.0123 14.1081 29.9583 14.312 29.8499 14.4879C29.7415 14.6637 29.5836 14.8036 29.396 14.89ZM11.508 22.247L11.327 22.092L11.493 22.234L11.508 22.247ZM11.508 22.247L11.64 22.359C11.5962 22.321 11.5522 22.2844 11.508 22.247ZM4.05398 28.154C4.29398 28.219 4.54798 28.219 4.78898 28.155L5.36698 28.004C4.54961 27.4113 3.8154 26.7118 3.18398 25.924L3.05298 26.414C3.0044 26.594 2.99176 26.7817 3.01578 26.9666C3.03979 27.1515 3.1 27.3298 3.19296 27.4914C3.28592 27.653 3.40981 27.7947 3.55755 27.9083C3.70529 28.022 3.87398 28.1055 4.05398 28.154ZM5.64998 25.647C6.36159 26.3035 7.16253 26.856 8.02899 27.288L10.827 26.539C9.73816 25.8956 8.72224 25.1362 7.79698 24.274C6.5873 23.1311 5.53114 21.8359 4.65498 20.421L3.86098 23.39C4.347 24.2235 4.94939 24.9835 5.64998 25.647ZM9.16698 22.812C10.5015 24.0441 12.0326 25.0446 13.697 25.772L16.188 25.104C13.91 24.2033 11.8579 22.8128 10.177 21.031C9.5884 20.4457 9.03287 19.8281 8.51298 19.181C8.28298 18.896 8.06898 18.611 7.86898 18.328C7.1207 17.3176 6.52376 16.2036 6.09698 15.021L5.39398 17.682C6.34832 19.5956 7.62458 21.3309 9.16698 22.812ZM28.701 18.902C28.6028 18.7831 28.4818 18.6851 28.345 18.614H28.34C26.6452 17.6446 24.7559 17.0648 22.8091 16.9165C20.8623 16.7683 18.907 17.0554 17.085 17.757L16.893 17.827L16.902 17.837C15.0074 18.5957 13.3159 19.7859 11.962 21.313C12.221 21.54 12.472 21.748 12.721 21.948C13.07 22.228 13.421 22.487 13.821 22.748C14.9123 21.4921 16.2955 20.5237 17.849 19.928C19.3637 19.3338 20.9927 19.0876 22.6154 19.2075C24.2381 19.3275 25.8131 19.8105 27.224 20.621C27.4567 20.7606 27.7314 20.8134 27.9993 20.77C28.2672 20.7266 28.5112 20.5899 28.688 20.384C28.8648 20.1781 28.9631 19.9163 28.9655 19.6449C28.9679 19.3735 28.8742 19.11 28.701 18.901" />
    </Svg>
  );
};

export default function TabLayout() {
  const activeColors = useActiveColors();
  const { unreadChatsCount } = useContext(GlobalContext)

  const badge = unreadChatsCount > 0
    ? unreadChatsCount > 1
      ? unreadChatsCount       // show number
      : ''                      // show dot if exactly one
    : undefined                // no badge when zero

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColors.tabIconSelected,
        tabBarInactiveTintColor: activeColors.tabIconDefault,
        tabBarShowLabel: false,
        sceneStyle: {backgroundColor: activeColors.background,},
        headerStyle: {backgroundColor: activeColors.background,},
        headerTintColor: activeColors.tint,
        tabBarStyle: { 
          //position: 'absolute',
          borderTopLeftRadius: 0.5, borderTopRightRadius: 0.5, 
          borderTopWidth: 0, 
          paddingTop: Platform.OS=='ios'? 8: 0,
          backgroundColor: activeColors.background,
          
        },
        tabBarBackground:() => <BlurView intensity={0} tint="extraLight" //intensity on 90 would work great for the home screen
        style={{
          ...StyleSheet.absoluteFillObject,
        //   overflow: 'hidden',
        //   borderTopLeftRadius: 20,
        //   borderTopRightRadius: 20,
        //   backgroundColor: activeColors.background,
        
        }}
        />,
        
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarInactiveTintColor: '#fff',
          headerTransparent: true,
          tabBarStyle: {
            position: 'absolute',
            //backgroundColor: 'rgba(25, 25, 25, .3)',
            //backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderTopWidth: 0,
            elevation: 0,
            paddingTop: Platform.OS=='ios'? 8: 2,
          },
          tabBarIcon: ({focused, color }) => (
            focused? <MaterialCommunityIcons name="home-variant" size={26} color={color} />
            :
            <MaterialCommunityIcons name="home-variant-outline" size={26} color={activeColors.tabIconDefault} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          title: "",
          headerShown: false,
          headerShadowVisible: false,
          tabBarIcon: ({ focused, color }) => (
            focused? <Ionicons name="medal" size={24} color={color}  />
            :
            <Ionicons name="medal-outline" size={24} color={activeColors.tabIconDefault} />
          ),
          tabBarBackground:() => <BlurView intensity={Platform.OS === 'ios'? 80 : 0} tint="regular" //intensity on 90 would work great for the home screen
          style={{
            ...StyleSheet.absoluteFillObject,
          }}
          />,
          
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios'? undefined : activeColors.background,
            paddingTop: Platform.OS=='ios'? 8: 2,
            borderTopWidth: 0,
          },
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarBackground:() => <BlurView intensity={Platform.OS === 'ios'? 80 : 0} tint="regular" //intensity on 90 would work great for the home screen
          style={{
            ...StyleSheet.absoluteFillObject,
          //   overflow: 'hidden',
          //   borderTopLeftRadius: 20,
          //   borderTopRightRadius: 20,
          //   backgroundColor: activeColors.background,
            
          }}
          />,
          
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios'? undefined : activeColors.background,
            paddingTop: Platform.OS=='ios'? 8: 2,
            borderTopWidth: 0,
          },
          headerShown: false,
          //headerTransparent: true,
          tabBarIcon: ({ focused, color }) => (

            focused? <View style={{alignItems: 'center',}}>
              <Ionicons name="chatbubbles" size={24} color={color} />
              {
                unreadChatsCount ? 
                <View style={{
                maxHeight: 15, 
                paddingHorizontal: 5,  
                flexDirection: 'row',
                alignItems: 'center', 
                justifyContent: 'flex-start', 
                borderRadius: 99, 
                backgroundColor: Colors.PRIMARY, position: 'absolute', bottom: -10,}}>
                <Text style={{ color: 'white', fontSize: 10, textAlign: 'left', fontWeight: 'bold',}} numberOfLines={1} >{unreadChatsCount}</Text>
              </View> : undefined 
              }
              
              </View> : 
            <View style={{alignItems: 'center',}}>
              <Ionicons name="chatbubbles-outline" size={24} color={activeColors.tabIconDefault} />
              {
                unreadChatsCount ? 
                <View style={{
                maxHeight: 15, 
                paddingHorizontal: 5,  
                flexDirection: 'row',
                alignItems: 'center', 
                justifyContent: 'flex-start', 
                borderRadius: 99, 
                backgroundColor: '#a020f0', position: 'absolute', bottom: -10,}}>
                <Text style={{ color: 'white', fontSize: 10, textAlign: 'left', fontWeight: 'bold',}} numberOfLines={1} >{unreadChatsCount}</Text>
              </View> : undefined 
              }
              </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: '',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            focused? <Ionicons name="person" size={24} color={color} />
            :
            <Ionicons name="person-outline" size={24} color={activeColors.tabIconDefault} />
          ),
          tabBarBackground:() => <BlurView intensity={Platform.OS === 'ios'? 80 : 0} tint="regular" //intensity on 90 would work great for the home screen
          style={{
            ...StyleSheet.absoluteFillObject,
          }}
          />,
          
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios'? undefined : activeColors.background,
            paddingTop: Platform.OS=='ios'? 8: 2,
            borderTopWidth: 0,
          },
        }}
      />
    </Tabs>
  );
}
