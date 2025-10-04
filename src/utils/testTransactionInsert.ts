/**
 * Função de teste para verificar se conseguimos inserir uma transação
 */

export const testTransactionInsert = async (supabase: any, userId: string, accountId: string) => {
  try {
    console.log('=== TESTE DE INSERÇÃO DE TRANSAÇÃO ===');
    
    const testTransaction = {
      user_id: userId,
      account_id: accountId,
      type: 'expense',
      amount: 100.00,
      description: 'Teste de transação',
      date: '2024-01-15',
      tags: []
    };

    console.log('Dados de teste:', testTransaction);

    const { data, error } = await supabase
      .from('transactions')
      .insert(testTransaction)
      .select();

    if (error) {
      console.error('❌ Erro no teste:', error);
      return { success: false, error };
    }

    console.log('✅ Teste bem-sucedido:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Erro no teste:', err);
    return { success: false, error: err };
  }
};
