import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Button, TouchableOpacity, ListRenderItem, Image, Switch, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, Keyboard, TouchableWithoutFeedback} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  useBottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {  Colors } from '@/constants/Colors';
import friend from '@/data/friends.json'
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import { useActiveColors } from '@/constants/ThemeMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export type Ref = BottomSheetModal;


interface FriendsProps {
    first_name: string;
    last_name: string;
    img: string;
    desc: string;
  }

const CreateLeagueSheet = forwardRef<Ref>((props, ref) => {
  const activeColors = useActiveColors();
    const snapPoints = useMemo(() => ['75%'], []);
    const { dismiss } = useBottomSheetModal();
   
    const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop
            opacity={0.6}
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
			/>
		),
		[]
	);

    const data = friend


      const renderItem: ListRenderItem<FriendsProps> = (({item}) => (
        <TouchableOpacity style={{ marginBottom: 20, alignItems: 'center', width: 70, gap: 5,}}>
            <Image source={{uri: item.img}} style={{height: 70, width: 70, borderRadius: 99,}} />
            <Text style={{fontSize: 12, width: '100%', textAlign: 'center', color: activeColors.text,}} numberOfLines={2} ellipsizeMode='tail'>{item.first_name} {item.last_name}</Text>
          </TouchableOpacity>
      ))


      const {height} = useWindowDimensions();

      const onScrollView = () => {
        Keyboard.dismiss()
      }

      const insets = useSafeAreaInsets()
      const pageBottomPadding = useBottomTabBarHeight()

      const [keyboardVisible, setKeyboardVisible] = useState(false);

      useEffect(() => {
        const showSubscription = Keyboard.addListener(
          Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
          () => setKeyboardVisible(true)
        );
        const hideSubscription = Keyboard.addListener(
          Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
          () => setKeyboardVisible(false)
        );
    
        return () => {
          showSubscription.remove();
          hideSubscription.remove();
        };
      }, []);
    
   return (
    // <BottomSheetModal 
    // ref={ref} 
    // index={0}
    // snapPoints={snapPoints}
    // backdropComponent={renderBackdrop}
    // style={{padding:12, }}
    // enableDynamicSizing={false}
    // keyboardBehavior='interactive'
    // keyboardBlurBehavior="restore"
    // handleIndicatorStyle={{backgroundColor: activeColors.tint,}}
    // backgroundStyle={{backgroundColor: activeColors.sheet,}}
    // >
    //   <BottomSheetView style={{flex: 1,}}>
    //   <KeyboardAvoidingView
    //   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    //   //keyboardVerticalOffset={60}
    // style={{flex: 1,}}
    // >
    //     <View style={styles.contentContainer}>

    //       <View style={{width: "100%", paddingBottom: 5,}}>
    //       <TouchableOpacity
    //           style={{backgroundColor: activeColors.buttonBackdrop, borderRadius: 20, padding: 4, position: 'absolute', right: 10,}}
    //           onPress={()=> dismiss()}
    //           >
    //             <Ionicons name="close" color={Colors.GRAY} size={25} />
    //           </TouchableOpacity>
    //           <Text style={[styles.containerHeadline, {color: activeColors.text, alignSelf: 'center',}]}>Create a League 🎉</Text>
    //           </View>
    //     <View style={styles.separator}/>
        
    //     {/* <View style={{flex: 1,  width: '100%',}}> */}
        
    //     {/* <ScrollView
    //     scrollEnabled={true}
    //     showsVerticalScrollIndicator={true}
    //     contentInsetAdjustmentBehavior="automatic"
    //     onScroll={onScrollView}
    //     style={{ width: '100%',}}
    //     > */}
          
    //     <FlatList
    //       scrollEnabled={true}
    //       data={data}
    //       keyExtractor={(item) => item.first_name}
    //       renderItem={renderItem}
    //       contentContainerStyle={styles.listContentContainer}
    //       numColumns={3}
    //       columnWrapperStyle={{gap: 60,}}
    //     /> 
        
    //     {/* </ScrollView> */}
        

    //     {/* <View style={{ 
    //       height: '40%', 
    //       //backgroundColor: Colors.lightGray,
    //        alignItems: 'center',
    //        justifyContent: 'flex-end',
    //        }}> */}
         
    //      <View style={{
    //       backgroundColor: 'transparent',
    //       //flex: 1,  
    //       width: '80%',
    //       //paddingTop: 20,
    //       //marginBottom: 30, 
    //      // position: 'absolute',
    //       gap: Platform.OS == 'ios'? 20 : 10,
    //       }}>
    //      <BottomSheetTextInput
    //         placeholder='Enter League name'
    //         style={{borderBottomWidth: 2, borderBottomColor: Colors.lightGray,  
    //          // height: 40, 
    //           marginTop: 20, color: activeColors.text,}}
    //         placeholderTextColor={activeColors.text}
            
    //         />
    //       {/* <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%',}}>
    //         <Text style={{fontSize: 15, fontWeight: '500', }}>Public?</Text>
    //       <Switch/>
    //       </View> */}
          
    //      <TouchableOpacity style={{
    //     padding:15,
    //     width: '100%',
    //     backgroundColor:Colors.PRIMARY,
    //     borderRadius: 99,
    //     shadowOpacity: 0.2,
    //     elevation:2,
    //   }}>
    //     <Text style={{
    //         color:Colors.WHITE,
    //         textAlign: "center",
    //     }}>Create</Text>
    //   </TouchableOpacity>
    //   </View>
    //     {/* </View> */}


    //     {/* </View> */}
    //     </View>
    //     </KeyboardAvoidingView>
    //     </BottomSheetView>
    // </BottomSheetModal>

    <BottomSheetModal
    ref={ref}
    index= {0}
    snapPoints={snapPoints}
    backdropComponent={renderBackdrop}
    enableDynamicSizing={false}
    handleIndicatorStyle={{backgroundColor: activeColors.text,}}
    backgroundStyle={{backgroundColor: activeColors.sheet, flex: 1, }}
    keyboardBehavior='interactive'
    keyboardBlurBehavior='restore'
    >
     
      <BottomSheetView 
      style={{
        flex: 1, 
        //backgroundColor: 'red', 
        width: '100%', 
        }}>

<KeyboardAvoidingView
      behavior={Platform.OS === 'ios'? 'padding': 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios'? 0 : 20}
      style={{
        flex: 1,  
        alignItems: 'center', 
       // backgroundColor: 'red',
      }}
      >
        <View style={{width: "100%", paddingVertical: 10,}}>
           <TouchableOpacity
              style={{backgroundColor: activeColors.buttonBackdrop, borderRadius: 20, padding: 4, position: 'absolute', right: 15, marginTop: 10,}}
              onPress={()=> dismiss()}
              >
                <Ionicons name="close" color={Colors.GRAY} size={25} />
              </TouchableOpacity>
              <Text style={[styles.containerHeadline, {color: activeColors.text, alignSelf: 'center',}]}>Create a League 🎉</Text>
              </View>
        <View style={styles.separator}/>


       
       <FlatList
          scrollEnabled={true}
          data={data}
          keyExtractor={(item) => item.first_name}
          renderItem={renderItem}
          contentContainerStyle={styles.listContentContainer}
          numColumns={3}
          columnWrapperStyle={{gap: 60,}}
        /> 
       

        
        <View style={{
          position: 'absolute', 
          backgroundColor: activeColors.sheet,
          paddingTop:20,
          bottom: 0,
          paddingBottom:Platform.OS === 'ios'? keyboardVisible? 10 : insets.bottom : 10, 
          flexDirection: 'row', 
          alignItems: 'center', 
          width: '100%',
          paddingHorizontal: 25, 
          gap: 15,
          justifyContent: 'center', }}>
        <BottomSheetTextInput
        aria-label='League name'
        placeholder='League name'
        placeholderTextColor={Colors.GRAY}
        style={{
          flex: 1,
          padding: 15, 
          overflow: "hidden",
          //borderWidth: StyleSheet.hairlineWidth +0.2,
          borderColor: activeColors.text,
          backgroundColor: activeColors.buttonBackdrop,
          borderRadius: 99,
          color: activeColors.text,
         }}
        />
        <TouchableOpacity style={{borderRadius: 99, padding: 10, backgroundColor: Colors.BLACK, alignItems: 'center', justifyContent: 'center',}}>
        <MaterialIcons name="create" size={24} color={Colors.WHITE} />
        </TouchableOpacity>

        </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
      
    </BottomSheetModal>
  );
});


const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        alignItems:'center',
        paddingBottom: Platform.OS === "ios"? 0 : 40,
    },

    listContentContainer: {
        alignItems:'center',
        paddingVertical: 10,
    },

    containerHeadline: {
        fontSize: 17,
        fontWeight: '600',
        padding: Platform.OS === "ios" ? 0 : 5,
        fontFamily: 'dmsans-bold',
        //color: activeColors.text,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.GRAY,
        width: '100%',
    },
    // input: {
    //     marginTop: 8,
    //     marginBottom: 10,
    //     borderRadius: 10,
    //     fontSize: 16,
    //     lineHeight: 20,
    //     padding: 8,
    //     backgroundColor: 'rgba(151, 151, 151, 0.25)',
    //   },
});

export default CreateLeagueSheet;