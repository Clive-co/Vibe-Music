import { FlatList, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { AntDesign, Ionicons } from '@expo/vector-icons'
import { Dimensions } from 'react-native'
import { Colors } from '@/constants/Colors'
import { useActiveColors } from '@/constants/ThemeMode'
import { SafeAreaView } from 'react-native-safe-area-context'

const PhoneNumberPicker = ({ onSelectCode }: { onSelectCode: (callingCode: string) => void }) => {

    const activeColors = useActiveColors()
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetch("https://restcountries.com/v2/all")
        .then(response => response.json())
        .then(data => {
            let areaData = data.map((item: any) => {
                return {
                    code: item.alpha2Code,
                    item: item.name,
                    callingCode: `+${item.callingCodes[0]}`,
                    flag: `https://flagsapi.com/${item.alpha2Code}/flat/64.png`
                }
            });

            setAreas(areaData);

            if(areaData.length > 0) {
                let defaultData = areaData.filter((a: any) => a.code == "US");

                if(defaultData.length > 0) {
                    setSelectedArea(defaultData[0]);
                    onSelectCode(defaultData[0].callingCode);  // Send default code to parent
                }
            }
        })
    }, [])

    const handleAreaSelect = (item: any) => {
        setSelectedArea(item);
        onSelectCode(item.callingCode);  // Pass the selected calling code
        setModalVisible(false);
    }

    const renderAreaCodeModal = () => {

        const renderItem = ({ item }: { item: any }) => {
            return (
                <TouchableOpacity style={{ flexDirection: 'row', padding: 10 }}
                    onPress={() => handleAreaSelect(item)}
                >
                    <Image
                        source={{ uri: item.flag }} 
                        resizeMode='contain'
                        style={{ height: 30, width: 30, marginRight: 10 }}
                    />
                    <Text style={{ color: activeColors.text }}>{item.item}</Text>
                </TouchableOpacity>
            )
        }

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={modalVisible}
                style={{flex: 1,}}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',}}>
                        <View style={{ height: '100%', width: '100%', backgroundColor: activeColors.background,  paddingVertical: 20,}}>
                            <TouchableOpacity
                                style={{ top: Platform.OS == 'ios' ? 40 : 20, alignSelf: 'flex-end', right: 22, padding: 5, backgroundColor: activeColors.text, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color={activeColors.background} />
                            </TouchableOpacity>

                            <FlatList 
                                data={areas}
                                renderItem={renderItem}
                                horizontal={false}
                                keyExtractor={item => item.code}
                                style={{ padding: 20, marginBottom: 10 }}
                                contentContainerStyle={{paddingBottom: 20,}}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        )
    }

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
                style={{ width: 90, alignItems: 'center',  flexDirection: "row" }}
                onPress={() => { setModalVisible(true) }}
            >
                <View style={{ justifyContent: 'center' }}>
                    <AntDesign name="down" size={13} color={activeColors.text} />
                </View>

                <View style={{ justifyContent: 'center', marginLeft: 5 }}>
                    <Image
                        source={{ uri: selectedArea?.flag }}
                        resizeMode="contain"
                        style={{ width: 30, height: 30 }}
                    />
                </View>

                <View style={{ marginLeft: 5 }}>
                    <Text style={{ color: activeColors.text, fontSize: 12 }}>{selectedArea?.callingCode}</Text>
                </View>
            </TouchableOpacity>
            {renderAreaCodeModal()}
        </View>
    )
}

export default PhoneNumberPicker;
