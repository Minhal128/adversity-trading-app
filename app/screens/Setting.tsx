import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import userApi from "../../services/userApi";

export default function SettingsScreen() {
  const navigation = useNavigation() as any;
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const sections = [
    {
      title: "Account",
      items: [
        { icon: "person-outline", text: "Edit Profile", route: "Editprofile" },
        { icon: "lock-closed-outline", text: "Security", route: "Security" },
        { icon: "notifications-outline", text: "Notifications", route: "Notification" },
        { icon: "shield-checkmark-outline", text: "Privacy", route: "Privacy" },
      ],
    },
    {
      title: "Support & About",
      items: [
        { icon: "card-outline", text: "My Subscription", route: "Mysubscription" },
        { icon: "help-circle-outline", text: "Help & Support", route: "Help" },
        { icon: "document-text-outline", text: "Terms and Policies", route: "Terms&Policy" },
        { icon: "construct-outline", text: "Service Account Credentials", route: "ServiceAccount" },
      ],
    },
  ];

  const handleNavigate = (route: string) => {
    if (route) navigation.navigate(route);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);
              // Try to call logout API, but don't fail if it doesn't work
              // (token might already be expired)
              try {
                await userApi.logout();
              } catch (apiError) {
                console.warn('⚠️ Logout API call failed (token may be expired):', apiError);
                // Continue with local logout anyway
              }
              await logout();
              (navigation as any).reset({
                index: 0,
                routes: [{ name: "SignIn" }],
              });
            } catch (error) {
              // Even if there's an error, try to navigate to sign in
              console.error('Error during logout:', error);
              try {
                await logout();
              } catch (e) {
                // Ignore
              }
              (navigation as any).reset({
                index: 0,
                routes: [{ name: "SignIn" }],
              });
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white pt-12">
      {/* Header */}
      <View className="flex-row items-center mb-4 px-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-3">Settings</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => (
          <View key={index} className="mb-6">
            <Text className="text-gray-500 mb-2">{section.title}</Text>
            <View className="bg-gray-50 rounded-2xl">
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleNavigate(item.route)}
                  className="flex-row items-center p-4 border-b border-gray-200"
                >
                  <Ionicons name={item.icon as any} size={22} color="#F97316" />
                  <Text className="ml-3 text-gray-800 text-base">
                    {item.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-gray-50 rounded-2xl p-4 flex-row items-center mt-4"
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Ionicons name="log-out-outline" size={22} color="#F97316" />
          )}
          <Text className="ml-3 text-gray-800 text-base">
            {loggingOut ? "Logging out..." : "Logout"}
          </Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <View className="mt-8 mb-4">
          <Text className="text-red-500 font-bold mb-2 ml-1">Danger Zone</Text>
          <TouchableOpacity
            className="bg-red-50 rounded-2xl p-4 border border-red-200 flex-row items-center"
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        setLoggingOut(true);
                        await userApi.deleteAccount();
                        await logout();
                        (navigation as any).reset({
                          index: 0,
                          routes: [{ name: "SignIn" }],
                        });
                      } catch (error: any) {
                        // If token is expired, just log out locally
                        if (error.response?.status === 401) {
                          console.warn('⚠️ Token expired during delete, logging out locally');
                          await logout();
                          (navigation as any).reset({
                            index: 0,
                            routes: [{ name: "SignIn" }],
                          });
                        } else {
                          Alert.alert("Error", error.message || "Failed to delete account");
                        }
                      } finally {
                        setLoggingOut(false);
                      }
                    }
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
            <Text className="ml-3 text-red-500 text-lg font-bold">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View >
  );
}
