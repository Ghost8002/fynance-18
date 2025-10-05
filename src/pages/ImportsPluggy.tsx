import { useEffect, useState } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, PlugZap, Download, Link as LinkIcon } from "lucide-react";

const ImportsPluggy = () => {
  const { isAuthenticated } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [accountsSummary, setAccountsSummary] = useState<{ created: number; updated: number } | null>(null);
  const [txSummary, setTxSummary] = useState<{ inserted: number; updated: number; skipped: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    document.title = "Open Finance (Pluggy) | Fynance";
    // Garantir SDK carregado
    const existing = document.querySelector('script[data-pluggy-connect]') as HTMLScriptElement | null;
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://connect.pluggy.ai/sdk.js';
      s.async = true;
      s.defer = true;
      s.setAttribute('data-pluggy-connect', 'true');
      document.body.appendChild(s);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const openConnect = async () => {
    try {
      setConnecting(true);
      const token = localStorage.getItem('sb-access-token') || ''
      const ctRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pluggy-connect-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      })
      const ct = await ctRes.json()
      if (!ctRes.ok) throw new Error(ct.error || 'Falha ao gerar token de conexão')

      // @ts-ignore
      const PluggyConnect = (window as any).PluggyConnect
      if (!PluggyConnect) throw new Error('Pluggy Connect SDK não carregado ainda')

      const connector = new PluggyConnect({
        connectToken: ct.connectToken,
        onSuccess: async () => {
          await syncAccounts()
          await syncTransactions()
        },
        onError: (err: any) => {
          alert('Erro no Pluggy Connect: ' + (err?.message || 'desconhecido'))
        },
      })
      connector.open()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setConnecting(false)
    }
  }

  const syncAccounts = async () => {
    const token = localStorage.getItem('sb-access-token') || ''
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pluggy-sync-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Falha ao sincronizar contas')
    setAccountsSummary({ created: data.created || 0, updated: data.updated || 0 })
  }

  const syncTransactions = async () => {
    try {
      setSyncing(true)
      const token = localStorage.getItem('sb-access-token') || ''
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pluggy-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ days: 30 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao sincronizar transações')
      setTxSummary({ inserted: data.inserted || 0, updated: data.updated || 0, skipped: data.skipped || 0 })
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Open Finance (Pluggy)</h1>
            <p className="text-finance-text-secondary">Conecte seus bancos e sincronize transações automaticamente.</p>
          </div>
          <Badge variant="default">Beta</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conexão</CardTitle>
            <CardDescription>Use o Pluggy Connect para autorizar o acesso às suas instituições.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button onClick={openConnect} disabled={connecting} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <PlugZap className="h-4 w-4 mr-2" />
                {connecting ? 'Abrindo...' : 'Conectar com Pluggy'}
              </Button>
              <Button variant="outline" onClick={syncAccounts}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Sincronizar Contas
              </Button>
            </div>
            {accountsSummary && (
              <p className="text-sm text-finance-text-secondary mt-3">Contas sincronizadas: {accountsSummary.created} novas, {accountsSummary.updated} atualizadas.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transações</CardTitle>
            <CardDescription>Baixe e atualize suas transações diretamente dos bancos conectados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button onClick={syncTransactions} disabled={syncing}>
                <Download className="h-4 w-4 mr-2" />
                {syncing ? 'Sincronizando...' : 'Sincronizar Transações'}
              </Button>
              <Button variant="ghost" onClick={() => syncTransactions()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-sincronizar (30 dias)
              </Button>
            </div>
            {txSummary && (
              <p className="text-sm text-finance-text-secondary mt-3">Transações: {txSummary.inserted} inseridas, {txSummary.updated} atualizadas, {txSummary.skipped} ignoradas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default ImportsPluggy;


