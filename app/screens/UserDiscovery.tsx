import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import userApi from "../../services/userApi";

interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: { url?: string };
  skills_offered?: string[];
  skills_wanted?: string[];
  rating?: number;
}

export default function UserDiscoveryScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a name or email to search");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const response = await userApi.searchUsers(searchQuery);
      setUsers(response.users || []);
    } catch (error: any) {
      console.log("Error searching users:", error.message);
      Alert.alert("Error", error.message || "Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (user: User) => {
    navigation.navigate("OtherProfile", {
      userId: user._id,
      userName: user.name,
      rating: user.rating || 0,
      image: user.profileImage?.url,
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 mt-12 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-center flex-1 mr-6">
          Find Users
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-4">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            placeholder="Search by name or email..."
            className="ml-3 flex-1 text-gray-800"
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          className="bg-[#008c99] rounded-full py-3 mt-3"
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold text-center">Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008c99" />
          </View>
        ) : searched && users.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">No users found</Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Try searching with a different name or email
            </Text>
          </View>
        ) : !searched ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">
              Search for users to connect
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Enter a name or email address
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <View
              key={user._id}
              className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm"
            >
              <View className="flex-row justify-between items-start">
                {/* User Info */}
                <TouchableOpacity
                  className="flex-row items-center flex-1"
                  onPress={() => handleViewProfile(user)}
                >
                  {user.profileImage?.url ? (
                    <Image
                      source={{
                        uri: user.profileImage.url,
                      }}
                      className="w-14 h-14 rounded-full mr-3"
                    />
                  ) : (
                    <View className="w-14 h-14 rounded-full mr-3 bg-gray-200 items-center justify-center">
                      <Ionicons name="person" size={24} color="#999" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800 text-lg">
                      {user.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">{user.email}</Text>
                    {user.rating && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={14} color="#FACC15" />
                        <Text className="text-gray-600 text-xs ml-1">
                          {user.rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* View Profile Button */}
                <TouchableOpacity
                  className="bg-[#008c99] px-4 py-2 rounded-full ml-2"
                  onPress={() => handleViewProfile(user)}
                >
                  <Text className="text-white font-semibold text-sm">View</Text>
                </TouchableOpacity>
              </View>

              {/* Skills */}
              {(user.skills_offered || user.skills_wanted) && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  {user.skills_offered && user.skills_offered.length > 0 && (
                    <View className="mb-2">
                      <Text className="text-gray-600 text-xs font-semibold mb-1">
                        Offers:
                      </Text>
                      <View className="flex-row flex-wrap gap-1">
                        {user.skills_offered.slice(0, 3).map((skill, i) => (
                          <Text
                            key={i}
                            className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs"
                          >
                            {skill}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                  {user.skills_wanted && user.skills_wanted.length > 0 && (
                    <View>
                      <Text className="text-gray-600 text-xs font-semibold mb-1">
                        Seeks:
                      </Text>
                      <View className="flex-row flex-wrap gap-1">
                        {user.skills_wanted.slice(0, 3).map((skill, i) => (
                          <Text
                            key={i}
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
                          >
                            {skill}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          left: 16,
          right: 16,
          backgroundColor: "#008C99",
          borderRadius: 50,
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 12,
          elevation: 6,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ActiveTrades")}>
          <Ionicons name="swap-horizontal-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Chats")}>
          <Ionicons name="chatbubbles-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="person-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
