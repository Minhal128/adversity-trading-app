import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ArrowLeftIcon, ChevronDownIcon } from "react-native-heroicons/outline";
import { useNavigation, useRoute } from "@react-navigation/native";
import barterApi from "../../services/barterApi";
import { useAuth } from "../../context/AuthContext";

export default function ProposeBarterScreen() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { user } = useAuth();
  const { userId, userName, friendRequestId } = (route.params as any) || {};
  const [offer, setOffer] = useState("");
  const [seek, setSeek] = useState("");
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [customOffer, setCustomOffer] = useState("");
  const [customSeek, setCustomSeek] = useState("");
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [theirSkills, setTheirSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserSkills();
  }, []);

  const loadUserSkills = async () => {
    try {
      setLoading(true);
      // Load other user's profile to get their skills_wanted
      const userApi = require('../../services/userApi').default;
      const otherUserProfile = await userApi.getUserById(userId);
      
      console.log('📊 Current user skills_offered:', (user as any)?.skills_offered);
      console.log('📊 Other user skills_wanted:', otherUserProfile.user?.skills_wanted);
      
      // My skills_offered and their skills_wanted
      const myOffers = (user as any)?.skills_offered || [];
      const theirWants = otherUserProfile.user?.skills_wanted || [];
      
      // Only use hardcoded if arrays are empty
      setMySkills(myOffers.length > 0 ? myOffers : ["Cooking", "Gardening", "Photography", "Painting", "Tutoring"]);
      setTheirSkills(theirWants.length > 0 ? theirWants : ["Cooking", "Gardening", "Photography", "Painting", "Tutoring"]);
      
      console.log('✅ My skills set to:', myOffers.length > 0 ? myOffers : 'hardcoded');
      console.log('✅ Their skills set to:', theirWants.length > 0 ? theirWants : 'hardcoded');
    } catch (error) {
      console.error('❌ Error loading skills:', error);
      setMySkills(["Cooking", "Gardening", "Photography", "Painting", "Tutoring"]);
      setTheirSkills(["Cooking", "Gardening", "Photography", "Painting", "Tutoring"]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (type: string, value: string) => {
    if (type === "offer") {
      setOffer(value);
      setCustomOffer(""); // Clear custom input when selecting from list
    } else {
      setSeek(value);
      setCustomSeek(""); // Clear custom input when selecting from list
    }
    setOpenModal(null);
  };

  const handleCustomInput = (type: string, value: string) => {
    if (type === "offer") {
      setCustomOffer(value);
      setOffer(""); // Clear dropdown selection when typing custom
    } else {
      setCustomSeek(value);
      setSeek(""); // Clear dropdown selection when typing custom
    }
  };

  const getDisplayText = (type: string) => {
    if (type === "offer") {
      return customOffer || offer || "Select skill you offer";
    } else {
      return customSeek || seek || "Select skill you seek";
    }
  };

  const handleProposeBarter = async () => {
    try {
      const offeredSkill = customOffer || offer;
      const soughtSkill = customSeek || seek;

      if (!offeredSkill || !soughtSkill) {
        Alert.alert("Error", "Please select both skills");
        return;
      }

      if (!friendRequestId && !userId) {
        Alert.alert("Error", "User information is required");
        return;
      }

      setSubmitting(true);
      const barterData: any = {
        offered_skill: offeredSkill,
        wanted_skill: soughtSkill,
      };

      // Add either friendRequestId or userId
      if (friendRequestId) {
        barterData.friendRequestId = friendRequestId;
      } else {
        barterData.userId = userId;
      }

      await barterApi.proposeBarter(barterData);

      Alert.alert("Success", "Barter proposal sent! 10 credits deducted.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to send barter proposal";
      Alert.alert("Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 pt-24">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeftIcon size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-center flex-1 mr-6">
          Propose Barter
        </Text>
      </View>

      {/* Profile Picture */}
      <View className="items-center mt-4">
        {user?.profileImage?.url ? (
          <Image
            source={{ uri: user.profileImage.url }}
            className="w-32 h-32 rounded-full border-4 border-[#007d86]"
          />
        ) : (
          <View className="w-32 h-32 rounded-full border-4 border-[#007d86] bg-gray-200 items-center justify-center">
            <Text className="text-4xl text-gray-400">{user?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text className="text-center text-lg font-semibold mt-3 text-gray-800">
        Propose Barter with {userName || "User"}
      </Text>

      {/* Green Section */}
      <View className="bg-[#007d86] mt-6 rounded-t-3xl p-6 pb-10 flex-1">
        {/* I Offer Section */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-2">I Offer</Text>
          
          {/* Dropdown Trigger */}
          <TouchableOpacity
            className="bg-white rounded-lg px-4 py-3 flex-row items-center justify-between mb-2"
            onPress={() => setOpenModal("offer")}
          >
            <Text className={`text-gray-700 ${!offer && !customOffer ? 'opacity-50' : ''}`}>
              {getDisplayText("offer")}
            </Text>
            <ChevronDownIcon size={20} color="#007d86" />
          </TouchableOpacity>
          
          {/* Custom Input */}
         
        </View>

        {/* I Seek Section */}
        <View className="mb-4">
          <Text className="text-white font-semibold text-lg mb-2">I Seek</Text>
          
          {/* Dropdown Trigger */}
          <TouchableOpacity
            className="bg-white rounded-lg px-4 py-3 flex-row items-center justify-between mb-2"
            onPress={() => setOpenModal("seek")}
          >
            <Text className={`text-gray-700 ${!seek && !customSeek ? 'opacity-50' : ''}`}>
              {getDisplayText("seek")}
            </Text>
            <ChevronDownIcon size={20} color="#007d86" />
          </TouchableOpacity>
          
          {/* Custom Input */}
         
        </View>

        {/* Cost Note */}
        <Text className="text-white text-sm mb-6 text-center">
          *Costs 10 credits on acceptance.
        </Text>

        {/* Send Request Button */}
        <TouchableOpacity
          className="bg-[#ff7b00] py-4 rounded-xl mt-2"
          onPress={handleProposeBarter}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Send Request
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal visible={!!openModal} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-lg font-semibold mb-3 text-center text-[#007d86]">
              {openModal === "offer" ? "Select Skill You Offer" : "Select Skill You Seek"}
            </Text>
            <FlatList
              data={openModal === "offer" ? mySkills : theirSkills}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-3 border-b border-gray-200"
                  onPress={() => handleSelect(openModal, item)}
                >
                  <Text className="text-gray-700 text-center">{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setOpenModal(null)}
              className="mt-4 bg-[#007d86] rounded-lg py-2"
            >
              <Text className="text-center text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}