import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SelectList } from "react-native-dropdown-select-list";
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../../context/AuthContext";
import userApi from "../../services/userApi";

export default function EditProfile() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  // State for user profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [skillsOffer, setSkillsOffer] = useState("");
  const [skillsSeek, setSkillsSeek] = useState("");
  const [profileImage, setProfileImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      // Set first skill if available
      if (user.skills && user.skills.length > 0) {
        setSkillsOffer(user.skills[0]);
      }
      setSkillsSeek(user.serviceSeeking || "");
    }
  }, [user]);

  // Dropdown skill options
  const skillOptions = [
    { key: "1", value: "Web Development" },
    { key: "2", value: "Graphic Design" },
    { key: "3", value: "UI/UX Design" },
    { key: "4", value: "Video Editing" },
    { key: "5", value: "Marketing" },
    { key: "6", value: "App Development" },
    { key: "7", value: "Content Writing" },
    { key: "8", value: "SEO Optimization" },
  ];

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
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      if (!name) {
        Alert.alert("Error", "Name is required");
        return;
      }

      setLoading(true);

      const skillsArray = skillsOffer.split(',').map(s => s.trim()).filter(s => s);
      
      let imageData = null;
      if (profileImage) {
        imageData = {
          uri: profileImage.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        };
      }

      const response = await userApi.editProfile({
        name,
        phone,
        skills: skillsArray,
        serviceSeeking: skillsSeek,
        profileImage: imageData,
      });

      await updateUser(response.user);
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800">Edit Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Profile Image Section */}
        <View className="items-center mb-8">
          <View className="relative">
            <Image
              source={{
                uri: profileImage?.uri || user?.profileImage?.url || "https://randomuser.me/api/portraits/men/1.jpg",
              }}
              className="w-28 h-28 rounded-full border-4 border-[#008c99]"
            />
            <TouchableOpacity 
              className="absolute bottom-0 right-0 bg-[#008c99] p-2 rounded-full"
              onPress={handleImageSelect}
            >
              <Ionicons name="camera-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="mt-3 text-gray-900 text-lg font-semibold">
            {name}
          </Text>
        </View>

        {/* Full Name */}
        <Text className="text-gray-700 mb-1 font-medium">Full Name</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 mb-5 text-gray-800"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="gray"
        />

        {/* Phone */}
        <Text className="text-gray-700 mb-1 font-medium">Phone</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 mb-5 text-gray-800"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          placeholderTextColor="gray"
        />

        {/* Skills I Offer */}
        <Text className="text-gray-700 mb-2 font-medium">Skills I Offer</Text>
        <SelectList
          setSelected={setSkillsOffer}
          data={skillOptions}
          save="value"
          defaultOption={skillsOffer ? { key: skillsOffer, value: skillsOffer } : undefined}
          boxStyles={{
            backgroundColor: "#f3f4f6",
            borderRadius: 12,
            borderWidth: 0,
            paddingVertical: 10,
          }}
          dropdownStyles={{
            backgroundColor: "#fff",
            borderRadius: 12,
            marginTop: 4,
          }}
          inputStyles={{ color: "black" }}
          searchPlaceholder="Search skills..."
          placeholder="Select a skill you offer"
        />

        {/* Skills I Seek */}
        <Text className="text-gray-700 mb-2 font-medium mt-5">Skills I Seek</Text>
        <SelectList
          setSelected={setSkillsSeek}
          data={skillOptions}
          save="value"
          defaultOption={skillsSeek ? { key: skillsSeek, value: skillsSeek } : undefined}
          boxStyles={{
            backgroundColor: "#f3f4f6",
            borderRadius: 12,
            borderWidth: 0,
            paddingVertical: 10,
          }}
          dropdownStyles={{
            backgroundColor: "#fff",
            borderRadius: 12,
            marginTop: 4,
          }}
          inputStyles={{ color: "black" }}
          searchPlaceholder="Search skills..."
          placeholder="Select a skill you seek"
        />

        {/* Save Button */}
        <TouchableOpacity
          className="mt-10 py-4 rounded-2xl"
          style={{ backgroundColor: "#008c99" }}
          onPress={handleSave}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
