import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';

/**
 * SocketService — Hub for real-time AI inference results.
 */
class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  /**
   * Initialize socket connection and join user-specific room
   */
  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) return;

    this.userId = userId;
    this.socket = io(BASE_URL, {
      transports: ['websocket'],
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log(`[Socket] Connected: ${this.socket?.id}`);
      this.socket?.emit('join_session', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection Error:', error);
    });
  }

  /**
   * Register a listener for completed AI inference results
   */
  onInferenceComplete(callback: (data: { scan: any }) => void) {
    if (!this.socket) return;
    this.socket.on('INFERENCE_COMPLETE', callback);
  }

  /**
   * Stop listening for inference results
   */
  offInferenceComplete() {
    if (!this.socket) return;
    this.socket.off('INFERENCE_COMPLETE');
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const PulsonaSocket = new SocketService();
