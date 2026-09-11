import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { getToken } from '../utils/storage';

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = await getToken();
    
    this.socket = io(API_CONFIG.SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Join a chat room
  joinChat(chatId: string): void {
    if (this.socket?.connected) {
      console.log('🚪 Joining chat room:', chatId);
      this.socket.emit('joinChat', chatId);
    } else {
      console.error('❌ Cannot join chat - socket not connected');
    }
  }

  // Leave a chat room
  leaveChat(chatId: string): void {
    if (this.socket?.connected) {
      console.log('🚪 Leaving chat room:', chatId);
      this.socket.emit('leaveChat', chatId);
    } else {
      console.error('❌ Cannot leave chat - socket not connected');
    }
  }

  // Listen for new messages
  onNewMessage(callback: (message: any) => void): void {
    if (this.socket) {
      console.log('👂 Listening for newMessage events');
      this.socket.on('newMessage', callback);
    } else {
      console.error('❌ Cannot listen - socket not initialized');
    }
  }

  // Remove message listener
  offNewMessage(): void {
    if (this.socket) {
      this.socket.off('newMessage');
    }
  }

  // Emit typing indicator
  emitTyping(chatId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  // Listen for typing indicator
  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  // Remove typing listener
  offTyping(): void {
    if (this.socket) {
      this.socket.off('typing');
    }
  }

  // ============ CALL FUNCTIONALITY ============
  
  // Initiate a call
  initiateCall(data: { chatId: string; callerId: string; callerName: string; receiverId: string | null; receiverName: string; callType: 'audio' | 'video' }): void {
    if (this.socket?.connected) {
      console.log('📞 Initiating call:', data);
      this.socket.emit('initiateCall', data);
    } else {
      console.error('❌ Cannot initiate call - socket not connected');
    }
  }

  // Accept a call
  acceptCall(data: { chatId: string; callerId: string; receiverId: string }): void {
    if (this.socket?.connected) {
      console.log('✅ Accepting call:', data);
      this.socket.emit('acceptCall', data);
    } else {
      console.error('❌ Cannot accept call - socket not connected');
    }
  }

  // Reject a call
  rejectCall(data: { chatId: string; callerId: string; receiverId: string }): void {
    if (this.socket?.connected) {
      console.log('❌ Rejecting call:', data);
      this.socket.emit('rejectCall', data);
    } else {
      console.error('❌ Cannot reject call - socket not connected');
    }
  }

  // End a call
  endCall(data: { chatId: string }): void {
    if (this.socket?.connected) {
      console.log('📞 Ending call:', data);
      this.socket.emit('endCall', data);
    } else {
      console.error('❌ Cannot end call - socket not connected');
    }
  }

  // Listen for call initiated
  onCallInitiated(callback: (data: any) => void): void {
    if (this.socket) {
      console.log('👂 Listening for call initiated events');
      this.socket.on('callInitiated', callback);
    } else {
      console.error('❌ Cannot listen - socket not initialized');
    }
  }

  // Listen for call accepted
  onCallAccepted(callback: (data: any) => void): void {
    if (this.socket) {
      console.log('👂 Listening for call accepted events');
      this.socket.on('callAccepted', callback);
    } else {
      console.error('❌ Cannot listen - socket not initialized');
    }
  }

  // Listen for call rejected
  onCallRejected(callback: (data: any) => void): void {
    if (this.socket) {
      console.log('👂 Listening for call rejected events');
      this.socket.on('callRejected', callback);
    } else {
      console.error('❌ Cannot listen - socket not initialized');
    }
  }

  // Listen for call ended
  onCallEnded(callback: (data: any) => void): void {
    if (this.socket) {
      console.log('👂 Listening for call ended events');
      this.socket.on('callEnded', callback);
    } else {
      console.error('❌ Cannot listen - socket not initialized');
    }
  }

  // Remove call listeners
  offCallInitiated(): void {
    if (this.socket) {
      this.socket.off('callInitiated');
    }
  }

  offCallAccepted(): void {
    if (this.socket) {
      this.socket.off('callAccepted');
    }
  }

  offCallRejected(): void {
    if (this.socket) {
      this.socket.off('callRejected');
    }
  }

  offCallEnded(): void {
    if (this.socket) {
      this.socket.off('callEnded');
    }
  }

  onSafeTradeSpotUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('safeTradeSpotUpdated', callback);
    }
  }

  offSafeTradeSpotUpdated(): void {
    if (this.socket) {
      this.socket.off('safeTradeSpotUpdated');
    }
  }
}

export default new SocketService();
