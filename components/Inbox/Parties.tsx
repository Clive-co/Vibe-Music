import {
  Button,
  FlatList,
  Image,
  ListRenderItem,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useMemo, useRef } from "react";
import party from "@/data/parties.json";
import { PartyProps } from "@/types/PartyTypes";
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import CreatePartySheet from "./CreatePartySheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useActiveColors } from "@/constants/ThemeMode";


const Parties = () => {
  const activeColors = useActiveColors();

  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const handlePresentModalPress = () => bottomSheetRef.current?.present();

  const partyRender: ListRenderItem<PartyProps> = ({ item }) => {
    return (
      <TouchableOpacity style={{width: 70,  gap: 2,}}>
        <View style={{width: 70, height: 70, borderRadius: 99, backgroundColor: activeColors.background2,}}>
            <Image source={{uri: item.hostavi}} 
            resizeMode="cover"
            style={{width: '100%', height: '100%', borderRadius: 99,}}
            />
            {(item.public == true)?  
            <View
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: "rgba(25, 25, 25, .6)",
                position: 'absolute',
                borderRadius: 99,
                alignItems: 'center',
                justifyContent: 'center',
            }} 
            >
                 <MaterialCommunityIcons name='lock' size={17} color={Colors.WHITE}/> 
            </View> : null }
        </View>
        <View style={{alignItems: 'center', width: '100%', gap: 5,}} 
        //className='bg-slate-300'
        >
        <Text style={{fontSize: 10, width: '100%', color: activeColors.text, textAlign: 'center',}} numberOfLines={1} ellipsizeMode='tail'>{item.partyname}</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: 4,}}>
            {/* <MaterialIcons name='verified-user' size={13} color={Colors.PRIMARY}/> */}
            {/* <MaterialCommunityIcons name='balloon' size={13} color={Colors.PRIMARY}/> */}
            <Ionicons name='balloon' size={13} color={Colors.GRAY}/>
        <Text style={{fontSize: 9, color: activeColors.text,}} numberOfLines={1} ellipsizeMode='tail'>{item.hostname}</Text>
        </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
         <Text style={{paddingHorizontal: 20, paddingVertical: 13, fontFamily: 'dmsans-semibold', fontSize: 16, color: activeColors.text,}}>
        Parties
        </Text>
        <TouchableOpacity
              style={{width: 35, 
              height: 35, 
              borderRadius: 99, 
              backgroundColor: activeColors.buttonBackdrop,
               alignItems: 'center', 
               justifyContent: 'center',
               marginRight: 20,

              }}
              onPress={handlePresentModalPress}
              >
                <Entypo name="sound" size={26} color={activeColors.colorText} />
                <View style={{position: 'absolute', left: 0, bottom: 0, width: '40%', height: '40%', borderRadius: 100, backgroundColor: activeColors.background, alignItems: 'center', justifyContent: 'center',}}>
                <Entypo name="circle-with-plus" size={12} color={activeColors.colorText} style={{alignSelf: 'center', textAlign: 'center',}} />
                </View>
                
              </TouchableOpacity>
        </View>
    <ScrollView
      style={
        {
          paddingHorizontal: 20,
          paddingVertical: 10,
        }
      }
      horizontal
      scrollEnabled
      showsHorizontalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
        <TouchableOpacity style={{width: 70,}} onPress={handlePresentModalPress}>
            <View style={{width: 70, height: 70, borderRadius: 99, backgroundColor: activeColors.background2,}}>
            <Image source={require('@/assets/images/user.png')} 
            resizeMode="cover"
            style={{width: '100%', height: '100%', borderRadius: 99,}}
            />
            <View style={{position: 'absolute', right: 0, bottom: 0, width: '30%', height: '30%', borderRadius: 100, backgroundColor: activeColors.background, alignItems: 'center', justifyContent: 'center',}}>
                <Entypo name="circle-with-plus" size={17} color={activeColors.colorText} style={{alignSelf: 'center', textAlign: 'center',}} />
                </View>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 10 ,}}>
                    <Text style={{fontSize: 11, fontWeight: '500', color: activeColors.text,}}>My Party</Text>
                </View>
        </TouchableOpacity>
      <FlatList
        data={party}
        horizontal
        scrollEnabled={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={partyRender}
        contentContainerStyle={{paddingHorizontal: 14, gap: 14,}}
      />
    </ScrollView>
    <CreatePartySheet ref={bottomSheetRef}/> 
    </View>
    
  );
};

export default Parties;

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
