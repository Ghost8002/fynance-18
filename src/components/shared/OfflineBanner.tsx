import { Wifi, WifiOff, CloudUpload, Loader2 } from 'lucide-react';
import { useOfflineSync } from '@/context/RealtimeDataContext';
import { cn } from '@/lib/utils';

export const OfflineBanner = () => {
  const { isOnline, pendingCount, isSyncing, syncPendingOperations } = useOfflineSync();

  // Don't show anything if online with no pending operations
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] px-4 py-2 text-center text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-amber-500/90 text-amber-950"
          : "bg-destructive/90 text-destructive-foreground"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sincronizando {pendingCount} operações...</span>
              </>
            ) : (
              <>
                <CloudUpload className="h-4 w-4" />
                <span>{pendingCount} operações pendentes</span>
                <button
                  onClick={syncPendingOperations}
                  className="ml-2 underline hover:no-underline"
                >
                  Sincronizar agora
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>
              Você está offline
              {pendingCount > 0 && ` • ${pendingCount} operações salvas localmente`}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
