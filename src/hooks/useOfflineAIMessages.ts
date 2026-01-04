import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage, PendingAIMessage } from '@/lib/offlineStorage';
import { useOnlineStatus } from './useOnlineStatus';
import { devLog, devError } from '@/utils/logger';
import { toast } from 'sonner';

interface UseOfflineAIMessagesOptions {
  onSendMessage: (message: string) => Promise<void>;
}

export const useOfflineAIMessages = ({ onSendMessage }: UseOfflineAIMessagesOptions) => {
  const [pendingMessages, setPendingMessages] = useState<PendingAIMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline, wasOffline } = useOnlineStatus();
  const syncingRef = useRef(false);

  // Load pending messages on mount
  const loadPendingMessages = useCallback(async () => {
    try {
      const messages = await offlineStorage.getPendingAIMessages();
      setPendingMessages(messages);
    } catch (error) {
      devError('Error loading pending AI messages:', error);
    }
  }, []);

  useEffect(() => {
    loadPendingMessages();
  }, [loadPendingMessages]);

  // Generate unique ID
  const generateId = () => `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add message to queue (when offline)
  const queueMessage = useCallback(async (message: string, audioBlob?: string): Promise<PendingAIMessage> => {
    const pendingMsg: PendingAIMessage = {
      id: generateId(),
      message,
      audioBlob,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await offlineStorage.addPendingAIMessage(pendingMsg);
    setPendingMessages(prev => [...prev, pendingMsg]);
    
    devLog('Queued offline message:', pendingMsg.id);
    return pendingMsg;
  }, []);

  // Try to send a single pending message
  const sendPendingMessage = useCallback(async (msg: PendingAIMessage): Promise<boolean> => {
    try {
      // Update status to sending
      await offlineStorage.updatePendingAIMessage(msg.id, { status: 'sending' });
      setPendingMessages(prev => 
        prev.map(m => m.id === msg.id ? { ...m, status: 'sending' as const } : m)
      );

      // Send the message
      await onSendMessage(msg.message);

      // Success - remove from queue
      await offlineStorage.removePendingAIMessage(msg.id);
      setPendingMessages(prev => prev.filter(m => m.id !== msg.id));
      
      devLog('Successfully sent pending message:', msg.id);
      return true;
    } catch (error) {
      devError('Failed to send pending message:', msg.id, error);
      
      // Update retry count and status
      const newRetryCount = msg.retryCount + 1;
      const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';
      
      await offlineStorage.updatePendingAIMessage(msg.id, { 
        status: newStatus,
        retryCount: newRetryCount 
      });
      
      setPendingMessages(prev => 
        prev.map(m => m.id === msg.id ? { ...m, status: newStatus, retryCount: newRetryCount } : m)
      );
      
      return false;
    }
  }, [onSendMessage]);

  // Sync all pending messages
  const syncPendingMessages = useCallback(async () => {
    if (syncingRef.current || !isOnline) return;
    
    const messages = await offlineStorage.getPendingAIMessages();
    const pendingToSync = messages.filter(m => m.status === 'pending');
    
    if (pendingToSync.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);
    
    devLog(`Syncing ${pendingToSync.length} pending AI messages...`);
    toast.info(`Enviando ${pendingToSync.length} mensagem(ns) pendente(s)...`);

    let successCount = 0;
    
    for (const msg of pendingToSync) {
      if (!navigator.onLine) {
        devLog('Lost connection during sync, stopping...');
        break;
      }
      
      const success = await sendPendingMessage(msg);
      if (success) successCount++;
      
      // Small delay between messages to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (successCount > 0) {
      toast.success(`${successCount} mensagem(ns) enviada(s) com sucesso!`);
    }

    syncingRef.current = false;
    setIsSyncing(false);
    
    // Reload to get updated state
    await loadPendingMessages();
  }, [isOnline, sendPendingMessage, loadPendingMessages]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      devLog('Back online, syncing pending AI messages...');
      syncPendingMessages();
    }
  }, [wasOffline, isOnline, syncPendingMessages]);

  // Retry a failed message
  const retryMessage = useCallback(async (msgId: string) => {
    const msg = pendingMessages.find(m => m.id === msgId);
    if (!msg || !isOnline) return;

    await offlineStorage.updatePendingAIMessage(msgId, { status: 'pending', retryCount: 0 });
    setPendingMessages(prev => 
      prev.map(m => m.id === msgId ? { ...m, status: 'pending' as const, retryCount: 0 } : m)
    );
    
    await sendPendingMessage({ ...msg, status: 'pending', retryCount: 0 });
  }, [pendingMessages, isOnline, sendPendingMessage]);

  // Remove a failed message
  const removeMessage = useCallback(async (msgId: string) => {
    await offlineStorage.removePendingAIMessage(msgId);
    setPendingMessages(prev => prev.filter(m => m.id !== msgId));
    toast.success('Mensagem removida');
  }, []);

  return {
    pendingMessages,
    isSyncing,
    isOnline,
    queueMessage,
    retryMessage,
    removeMessage,
    syncPendingMessages,
    pendingCount: pendingMessages.length,
  };
};
