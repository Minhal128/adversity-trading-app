import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Home, MessageCircle, User } from 'lucide-react-native';
import { Text } from 'react-native';

export default function IconTabs() {
  return (
    <View className="absolute bottom-5 w-full flex-row justify-around items-center px-6 py-3 bg-white/70 rounded-2xl shadow">
      {/* Home Icon */}
      <TouchableOpacity>
        <Home size={28} color="black" />
      </TouchableOpacity>

      {/* Double Arrow (↔) */}
      <TouchableOpacity>
        <Text className="text-3xl text-black">↔</Text>
      </TouchableOpacity>

      {/* Chat Icon */}
      <TouchableOpacity>
        <MessageCircle size={28} color="black" />
      </TouchableOpacity>

      {/* Profile Icon */}
      <TouchableOpacity>
        <User size={28} color="black" />
      </TouchableOpacity>
    </View>
  );
}
