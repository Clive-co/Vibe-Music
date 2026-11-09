import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useActiveColors } from '@/constants/ThemeMode'
import NoLeagueSvg from '@/assets/svg/NoLeagueSvg'

const NoLeague = () => {


    const activeColors = useActiveColors()
  return (
    <View style={{ alignItems: 'center', gap: 20,}}>
        <NoLeagueSvg size={110} />
      <Text style= {{color: activeColors.text, fontWeight: 'bold', fontSize: 12,}}>You are currently not in a league</Text>

    </View>
  )
}

export default NoLeague

const styles = StyleSheet.create({})