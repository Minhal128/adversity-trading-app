import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';

export interface SendMessageData {
  chatId: string;
  message: string;
  content?: string;
}

export interface SendMediaData {
  chatId: string;
  file: any;
}

export interface GetOrCreateChatData {
  userId: string;
}

class ChatAPI {
  async sendMessage(data: SendMessageData) {
    const response = await axiosInstance.post(ENDPOINTS.CHAT.SEND_MESSAGE, {
      chatId: data.chatId,
      content: data.message || data.content
    });
    return response.data;
  }

  async sendMedia(data: SendMediaData) {
    const formData = new FormData();
    formData.append('chatId', data.chatId);
    // @ts-ignore
    formData.append('file', data.file);

    const response = await axiosInstance.post(
      ENDPOINTS.CHAT.SEND_MEDIA,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getMessages(chatId: string) {
    const response = await axiosInstance.get(ENDPOINTS.CHAT.GET_MESSAGES(chatId));
    return response.data;
  }

  async markMessagesSeen(chatId: string) {
    const response = await axiosInstance.put(ENDPOINTS.CHAT.MARK_SEEN(chatId));
    return response.data;
  }

  async getChats() {
    const response = await axiosInstance.get(ENDPOINTS.CHAT.GET_CHATS);
    return response.data;
  }

  async getOrCreateChat(data: GetOrCreateChatData) {
    const response = await axiosInstance.post(ENDPOINTS.CHAT.GET_OR_CREATE, {
      otherUserId: data.userId
    });
    return response.data;
  }
}

export default new ChatAPI();
