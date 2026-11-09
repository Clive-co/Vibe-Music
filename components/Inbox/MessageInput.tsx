import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native'
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
import { Entypo, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useActiveColors } from '@/constants/ThemeMode';

export type MessageInputProps = {
    onShouldSendMessage: (
        message: string, 
        mediaUri?: string, 
        fileName?: string, 
        mimeType?: string
    ) => void;
    onFocus?: () => void; 
}

const ATouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

const MessageInput = ({ onShouldSendMessage }: MessageInputProps) => {
    const activeColors = useActiveColors();
    const [message, setMessage] = useState('');
    const { bottom } = useSafeAreaInsets();
    const expanded = useSharedValue(0);

    const expandItems = () => {
        expanded.value = withTiming(1, { duration: 400 })
    }

    const collapseItems = () => {
        expanded.value = withTiming(0, { duration: 400 })
    }

    const expandedButtonStyle = useAnimatedStyle(() => {
        const opacityInterpolation = interpolate(expanded.value, [0, 1], [1, 0], Extrapolation.CLAMP)
        const widthInterpolation = interpolate(expanded.value, [0, 1], [30, 0], Extrapolation.CLAMP)
        return {
            opacity: opacityInterpolation,
            width: widthInterpolation,
        };
    })

    const buttonViewStyle = useAnimatedStyle(() => {
        const widthInterpolation = interpolate(expanded.value, [0, 1], [0, 100], Extrapolation.CLAMP)
        return {
            opacity: expanded.value,
            width: widthInterpolation,
        };
    })

    const onChangeText = (text: string) => {
        collapseItems();
        setMessage(text)
    }

    const onSend = () => {
        if (message.trim()) {
            onShouldSendMessage(message.trim());
            setMessage('')
        }
    }

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        
        if (status !== 'granted' || cameraStatus.status !== 'granted') {
            Alert.alert(
                'Permissions Required',
                'Please grant camera and photo library permissions to send media.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    }

    const handleCamera = async () => {
        collapseItems();
        
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const fileName = `camera_${Date.now()}.jpg`;
                onShouldSendMessage('', asset.uri, fileName, asset.mimeType || 'image/jpeg');
            }
        } catch (error) {
            console.error('Error launching camera:', error);
            Alert.alert('Error', 'Failed to open camera');
        }
    }

    const handleImageLibrary = async () => {
        collapseItems();
        
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const fileName = asset.fileName || `image_${Date.now()}.jpg`;
                onShouldSendMessage('', asset.uri, fileName, asset.mimeType || 'image/jpeg');
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    }

    const handleDocumentPicker = async () => {
        collapseItems();
        
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                
                // Check file size (limit to 10MB)
                if (asset.size && asset.size > 10 * 1024 * 1024) {
                    Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
                    return;
                }

                onShouldSendMessage(
                    '', 
                    asset.uri, 
                    asset.name, 
                    asset.mimeType || 'application/octet-stream'
                );
            }
        } catch (error) {
            console.error('Error selecting document:', error);
            Alert.alert('Error', 'Failed to select document');
        }
    }

    return (
        <View style={styles.container}>
            <BlurView 
                intensity={activeColors.inputBlurIntensity} 
                tint='extraLight' 
                style={{
                    paddingBottom: Platform.OS == 'ios' ? bottom : bottom + 20, 
                    paddingTop: 10, 
                }}
            >
                <View style={styles.row}>
                    <ATouchableOpacity 
                        onPress={expandItems}
                        style={[styles.roundBtn, expandedButtonStyle, { backgroundColor: activeColors.buttonBackdrop }]}
                    >
                        <Ionicons name='add' size={24} color={Colors.GRAY} />
                    </ATouchableOpacity>

                    <Animated.View style={[styles.buttonView, buttonViewStyle]}>
                        <TouchableOpacity onPress={handleCamera}>
                            <Ionicons name='camera-outline' size={24} color={Colors.GRAY} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleImageLibrary}>
                            <Ionicons name='image-outline' size={24} color={Colors.GRAY} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleDocumentPicker}>
                            <Ionicons name='folder-outline' size={24} color={Colors.GRAY} />
                        </TouchableOpacity>
                    </Animated.View>

                    <TextInput
                        placeholder='say something...'
                        placeholderTextColor={Colors.GRAY}
                        multiline={true}
                        value={message}
                        onChangeText={onChangeText}
                        style={[styles.messageInput, {
                            borderColor: activeColors.border,
                            backgroundColor: activeColors.sheet,
                            color: activeColors.text,
                        }]}
                        onFocus={() => {
                            collapseItems();            
                        }}
                    />

                    {message.length > 0 ? (
                        <TouchableOpacity onPress={onSend}>
                            <Ionicons name="arrow-up-circle" size={26} color={activeColors.colorText} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity>
                            <Entypo name='sound' size={26} color={Colors.GRAY} />
                        </TouchableOpacity>
                    )}
                </View>
            </BlurView>
        </View>
    )
}

export default MessageInput

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        // justifyContent: 'flex-end',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        width: "90%",
        alignSelf: 'center',
    },

    roundBtn: {
        width: 30,
        height: 30,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    messageInput: {
        minHeight: 40,
        flex: 1,
        flexGrow: 1,
        marginHorizontal: 10,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 20,
        padding: Platform.OS == 'ios' ? 10 : 10,
    },

    buttonView: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
})