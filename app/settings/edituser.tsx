import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import {  Colors } from "@/constants/Colors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useActiveColors } from "@/constants/ThemeMode";
import * as  ImagePicker from 'expo-image-picker'
import { getPreSignedURL, updateUser } from "@/utils/service_api/userServiceApi";
import { Snackbar } from 'react-native-paper';
import { useLocalSearchParams } from "expo-router";

const Edituser = () => {
  const activeColors = useActiveColors();

  const {profileImg, userName} = useLocalSearchParams<{profileImg: string, userName: string}>()
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  

  const pickAndUploadImage = async () => {
    // 1) Request permission and pick
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission Denied", "We need access to your photos.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets.length) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);

    try {
      setUploading(true);

      // 2) Fetch blob & determine fileType
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileType = blob.type; // e.g. "image/jpeg"
      const ext = fileType.split("/")[1] || "jpg";

      // 3) Generate a simple unique filename
      const timestamp = Date.now();
      const randomToken = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomToken}.${ext}`;

      // 4) Get presigned URLs from your Lambda
      const { uploadUrl, fileUrl } = await getPreSignedURL(fileName, fileType);

      // 5) PUT the blob into S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": fileType },
      });
      if (!uploadRes.ok) {
        throw new Error(`S3 upload failed: ${uploadRes.status}`);
      }

      // 6) Persist the new URL in your MongoDB user document
      await updateUser({ profileImg: fileUrl });

      setSnackbarVisible(true);
      // Switch preview to the hosted URL
      setImageUri(fileUrl);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Upload Error", err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  /*const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photo library.');
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      // OPTIONAL: Upload to server here
    }
  };*/

  return (
    <View style={{flex: 1, backgroundColor: activeColors.background,}}>
    <KeyboardAvoidingView
    behavior = {Platform.OS == 'ios'? 'padding' : 'height'}
    keyboardVerticalOffset={80}
      style={{
        flex: 1,
        backgroundColor: activeColors.background,       
      }}
    >
      <ScrollView style={{
        flex: 1, 
        
      }} contentContainerStyle={{alignItems: "center", gap: 30,}}>

      <TouchableOpacity
      onPress={pickAndUploadImage}
        style={{
          backgroundColor: activeColors.background2,
          width: 100,
          height: 100,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 99,
          shadowColor: activeColors.shadowColor,
          shadowOffset: { width: -2, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
         <Image
        source={{ uri: profileImg }}
        style={{ width: "95%", height: "95%", borderRadius: 99 }}
        resizeMode="cover"
      />
        <View
          style={{
            width: "95%",
            height: "95%",
            borderRadius: 127,
            position: "absolute",
            backgroundColor: "rgba(25, 25, 25, .3)",
          }}
        />
        {/* <Feather name="edit" size={24} color={Colors.WHITE} style={{position: 'absolute', }} /> */}
        <MaterialCommunityIcons
          name="circle-edit-outline"
          size={24}
          color={Colors.WHITE}
          style={{ position: "absolute" }}
        />
      </TouchableOpacity>

      <View style={{ width: "80%", gap: 20, }}>
        <View style={{gap: 10,}}>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: activeColors.text,}}>Name</Text>
        <TextInput
          placeholder="john doe"
          placeholderTextColor={activeColors.text}
          style={{
            width: "100%",
            padding: 10,
            backgroundColor: activeColors.border,
            borderRadius: 10,
            color: activeColors.text,
          }}
        />
        </View>

        <View style={{gap: 10,}}>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: activeColors.text,}}>Username</Text>
        <TextInput
          placeholder={userName}
          placeholderTextColor={activeColors.text}
          style={{
            width: "100%",
            padding: 10,
            backgroundColor: activeColors.border,
            borderRadius: 10,
            color: activeColors.text,
          }}
        />
        </View>

        <View style={{gap: 10,}}>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: activeColors.text,}}>Bio</Text>
        <TextInput
          placeholder="write anything"
          placeholderTextColor={activeColors.text}
          multiline
          numberOfLines={3}
          style={{
            width: "100%",
            padding: 10,
            backgroundColor: activeColors.border,
            borderRadius: 10,
            color: activeColors.text,
          }}
        />
        </View>

      </View>

      </ScrollView>
    </KeyboardAvoidingView>
    <Snackbar
      visible={snackbarVisible}
      onDismiss={() => setSnackbarVisible(false)}
      duration={2500}
      style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}
    >
      Your profile image has been updated!
    </Snackbar>
    </View>
  );
};

export default Edituser;

const styles = StyleSheet.create({});
