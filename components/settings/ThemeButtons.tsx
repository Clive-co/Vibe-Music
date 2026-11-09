import { StyleSheet, Text, TouchableOpacity,  View } from 'react-native'
import React from 'react'
import { Colors } from '@/constants/Colors'
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { RadioButton } from 'react-native-paper'
import { useActiveColors } from '@/constants/ThemeMode'
import { useTheme } from '@/constants/ThemeProvider'
import {useColorScheme} from "nativewind"
const ThemeButtons = () => {
  const activeColors = useActiveColors();
    const [checked, setChecked] = React.useState('first');
    const { mode, setMode, colors, resolvedMode } = useTheme();
    const {setColorScheme, colorScheme} = useColorScheme();
  return (
    <>
    {/*---------------------------------------------------------- Additional buttons ------------------------------------------------------*/}
    <View style={{ width: "90%", marginVertical: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.GRAY }}>
            Theme
          </Text>
        </View>
        <View
          style={{
            width: "100%",
            borderRadius: 20,
            //gap: 20,
            backgroundColor: activeColors.background2,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
            onPress={() => {setMode('light'), setColorScheme('light'), console.log('resolvedMode:', resolvedMode);}}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="sunny" size={24} color={activeColors.text} />
              </View>

              <Text style={{ fontSize: 14, color: activeColors.text, }}>Day</Text>
            </View>

             <RadioButton
            value="light"
            status={mode === 'light' ? 'checked' : 'unchecked'}
            onPress={() => {}}
          />
          </TouchableOpacity>

          <View style={[styles.separator, {borderBottomColor: activeColors.border,}]} />

          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
            onPress={() => {setMode('dark'), setColorScheme('dark'), console.log('resolvedMode:', resolvedMode);}}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="moon"
                  size={24}
                  color={activeColors.text}
                />
              </View>

              <Text style={{ fontSize: 14,  color: activeColors.text,}}>Night</Text>
            </View>

             <RadioButton
            value="dark"
            status={mode === 'dark' ? 'checked' : 'unchecked'}
            onPress={() => {}}
          />
          </TouchableOpacity>

          <View style={[styles.separator, {borderBottomColor: activeColors.border,}]} />

          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
            onPress={() => {setMode('system'), setColorScheme('system'), console.log('resolvedMode:', resolvedMode);}}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="theme-light-dark" size={24} color={activeColors.text}/>
              </View>

              <Text style={{ fontSize: 14, color: activeColors.text, }}>System</Text>
            </View>

             <RadioButton
            value="system"
            status={mode === 'system' ? 'checked' : 'unchecked'}
            onPress={() => {}}
          />
          </TouchableOpacity>

        </View>
        {/*---------------------------------------------------------- Additional buttons end------------------------------------------------------*/}
        </>
  )
}

export default ThemeButtons

const styles = StyleSheet.create({
    separator: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        //borderBottomColor: activeColors.border,
        width: "85%",
        alignSelf: "center",
      },
})