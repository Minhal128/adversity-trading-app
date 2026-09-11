import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import config from '../../config/config';

interface ServiceAccountConfig {
    project_id: string;
    private_key_id: string;
    client_email: string;
}

export default function ServiceAccountScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ServiceAccountConfig | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch(`${config.baseUrl}/config/service-account`);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                Alert.alert('Error', result.message || 'Failed to load configuration');
            }
        } catch (error) {
            console.error('Error details:', error);
            Alert.alert('Error', 'Failed to connect to backend');
        } finally {
            setLoading(false);
        }
    };

    /*
    const copyToClipboard = async (text: string, label: string) => {
      // Copy feature disabled for stability
      Alert.alert('Info', 'Copy feature is disabled.');
    };
    */

    if (loading) {
        return (
            <View className="flex-1 bg-[#1A1A1A] justify-center items-center">
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A]">
            <ScrollView className="flex-1 px-5 pt-8">

                <View className="flex-row justify-between items-center mb-8">
                    <Text className="text-white text-xl font-bold">Service Account Credentials Details</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color="#999" />
                    </TouchableOpacity>
                </View>

                {data ? (
                    <View className="space-y-6">

                        <View>
                            <Text className="text-white font-semibold mb-2 ml-1">Project ID</Text>
                            <View className="bg-[#2A2A2A] rounded-xl flex-row items-center border border-[#333]">
                                <TextInput
                                    value={data.project_id}
                                    editable={false}
                                    className="flex-1 text-[#ccc] p-4 text-base"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-white font-semibold mb-2 ml-1">Private Key ID</Text>
                            <View className="bg-[#2A2A2A] rounded-xl flex-row items-center border border-[#333]">
                                <TextInput
                                    value={data.private_key_id}
                                    editable={false}
                                    className="flex-1 text-[#ccc] p-4 text-base"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-white font-semibold mb-2 ml-1">Client Email</Text>
                            <View className="bg-[#2A2A2A] rounded-xl flex-row items-center border border-[#333]">
                                <TextInput
                                    value={data.client_email}
                                    editable={false}
                                    className="flex-1 text-[#ccc] p-4 text-base"
                                />
                            </View>
                        </View>

                    </View>
                ) : (
                    <View className="items-center py-10">
                        <Text className="text-gray-400">No configuration data available</Text>
                    </View>
                )}

                <View className="mt-10 mb-20">
                    <TouchableOpacity
                        className="bg-[#333] py-4 rounded-xl items-center"
                        onPress={() => navigation.goBack()}
                    >
                        <Text className="text-white font-bold text-lg">Go Back</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
