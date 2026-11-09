import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Tooltip } from '@rneui/themed';
import { Colors } from '@/constants/Colors';
import { formatNumber, numberComma } from '../FormatNumber';
import { useActiveColors } from '@/constants/ThemeMode';
import { fetchWeeklyRecap, WeeklyRecap, getUser, User } from "@/utils/service_api/userServiceApi";

const Recap = ({ data, minutes = 0, artists = 0, tracks = 0 }: { 
  data: any; 
  minutes?: number; 
  artists?: number; 
  tracks?: number; 
}) => {
  const activeColors = useActiveColors();
      
     // const minutes = 1408;
      //const artists = 199;
     // const tracks = 482;



  return (
    <View style={{width: '90%', alignItems: 'center', marginTop: 20,}}>
    <Text style={{fontWeight: 'bold', fontSize: 20, color: activeColors.text, paddingBottom: 20,}}>Weekly Recap</Text>

{
  data === null ? <Text style={{color: Colors.GRAY,}}>No Recap data. Wait till next week</Text> :
  <View style={{ flexDirection: 'row', gap: 20,}}>

    
      <View
      style={{
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#d5bcc0',
        //paddingVertical: 10,
        //paddingHorizontal: 20,
        height: 50,
        width: 80,
        borderRadius: 10,
        }}
        //onPress={() => handleTooltipVisibility(1)}
        >
        <Text style={{fontSize: 15,}} numberOfLines={1}>{minutes.toFixed(0)}</Text>
        <Text style={{fontSize: 12,}}>minutes</Text>
      </View>
      

      
      <View
      style={{
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#c8bcd7',
        //paddingVertical: 10,
        //paddingHorizontal: 20,
        height: 50,
        width: 80,
        borderRadius: 10,
        }}
       // onPress={() => handleTooltipVisibility(2)}
        >
      <Text style={{fontSize: 15,}}>{artists}</Text>
      <Text style={{fontSize: 12,}}>artists</Text>
      </View>
      

      
      <View
      style={{
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#c4b7bc',
        height: 50,
        //paddingVertical: 10,
        // paddingHorizontal: 20,
        width: 80,
        borderRadius: 10,
        }}
        //onPress={() => handleTooltipVisibility(3)}
        >
      <Text style={{fontSize: 15,}}>{tracks}</Text>
      <Text style={{fontSize: 12,}}>tracks</Text>
      </View>
      
    </View>

}
    
  </View>
  )
}

export default Recap

const styles = StyleSheet.create({
    tooltipContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Optional: Background color of the tooltip
       // borderRadius: 5,
        padding: 5,
      },
})