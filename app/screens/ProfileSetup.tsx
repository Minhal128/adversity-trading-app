import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import authApi from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

const ProfileSetup = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name && user.name !== 'Apple User' ? user.name : '');
  const [skillsToAdd, setSkillsToAdd] = useState('');
  const [skillsSeeking, setSkillsSeeking] = useState('');
  const [profilePicture, setProfilePicture] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePicture(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      if (!skillsToAdd || !skillsSeeking) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setLoading(true);

      // Prepare skills array
      const skillsArray = skillsToAdd.split(',').map(s => s.trim()).filter(s => s);

      // Prepare image data
      let imageData: { uri: string; type: string; name: string } | undefined = undefined;
      if (profilePicture) {
        imageData = {
          uri: profilePicture.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        };
      }

      const response = await authApi.completeProfile({
        name: name.trim(),
        skills: skillsArray,
        serviceSeeking: skillsSeeking,
        profileImage: imageData,
      });

      // Update user context
      await updateUser(response.user);

      Alert.alert('Success', 'Profile setup completed!');
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAndContinue = () => {
    navigation.navigate('Home');
  };

  return (


    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header Section */}
      <View className="bg-[#008C99] pb-6 rounded-b-3xl items-center justify-center pt-10">
        <Image
          source={require('../../assets/logo1.png')}
          style={{
            width: 100,
            height: 100,
            marginTop: 4,
          }}
          resizeMode="contain"
        />
        <Text className="text-white text-xl font-bold mb-1">
          Profile Setup
        </Text>
      </View>

      {/* Content Section */}
      <View className="flex-1 px-6 py-8 -mt-4">
        {/* Name Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Your Name
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-base"
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Skills to Add Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Add skills
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-base"
            placeholder="Enter your skills"
            placeholderTextColor="#9CA3AF"
            value={skillsToAdd}
            onChangeText={setSkillsToAdd}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Skills Seeking Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Add Skills/Services Seeking
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-base"
            placeholder="What skills or services are you looking for?"
            placeholderTextColor="#9CA3AF"
            value={skillsSeeking}
            onChangeText={setSkillsSeeking}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Profile Picture Upload Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Upload Profile Picture
          </Text>

          <TouchableOpacity
            className="border-2 border-dashed border-gray-400 rounded-lg p-6 items-center justify-center bg-gray-50"
            onPress={handleImageSelect}
            activeOpacity={0.7}
          >
            <View className="items-center">
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture.uri }}
                  className="w-20 h-20 rounded-full mb-2"
                />
              ) : (
                <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              )}
              <Text className="text-blue-500 font-semibold text-center">
                {profilePicture ? 'Change Photo' : 'Upload Photo'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-orange-500 rounded-lg py-4 px-6 items-center mt-4"
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              Save & Continue
            </Text>
          )}
        </TouchableOpacity>

        {/* Skip Button - Quick navigation */}
        <TouchableOpacity
          className="border border-gray-400 rounded-lg py-3 px-6 items-center mt-3"
          onPress={handleSkipAndContinue}
          activeOpacity={0.8}
        >
          <Text className="text-gray-600 text-base">
            Skip & Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

  );
};

export default ProfileSetup;