import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  tags?: string[];
}

interface ImportRequest {
  account_id: string;
  transactions: Transaction[];
}

interface ImportResult {
  success: boolean;
  summary: {
    total: number;
    imported: number;
    errors: number;
    duplicates: number;
  };
  details: {
    imported_ids: string[];
    errors: Array<{
      index: number;
      transaction: Transaction;
      error: string;
    }>;
    account_updated: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`[import-transactions] Request from user: ${user.id}`);

    // Parse request body
    const body: ImportRequest = await req.json();
    
    if (!body.account_id || !body.transactions || !Array.isArray(body.transactions)) {
      throw new Error('Invalid request body. Expected: { account_id: string, transactions: Transaction[] }');
    }

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabaseClient
      .from('accounts')
      .select('id, balance')
      .eq('id', body.account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found or does not belong to user');
    }

    console.log(`[import-transactions] Processing ${body.transactions.length} transactions for account ${account.id}`);

    // Fetch user categories
    const { data: categories } = await supabaseClient
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id);

    const categoryMap = new Map(
      categories?.map(cat => [cat.name.toLowerCase(), cat.id]) || []
    );

    // Process transactions
    const result: ImportResult = {
      success: true,
      summary: {
        total: body.transactions.length,
        imported: 0,
        errors: 0,
        duplicates: 0,
      },
      details: {
        imported_ids: [],
        errors: [],
        account_updated: false,
      },
    };

    let totalBalanceChange = 0;

    for (let i = 0; i < body.transactions.length; i++) {
      const transaction = body.transactions[i];

      try {
        // Validate transaction
        if (!transaction.date || !transaction.description || transaction.amount === undefined || !transaction.type) {
          throw new Error('Missing required fields: date, description, amount, type');
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(transaction.date)) {
          throw new Error('Invalid date format. Expected: YYYY-MM-DD');
        }

        // Validate type
        if (transaction.type !== 'income' && transaction.type !== 'expense') {
          throw new Error('Invalid type. Expected: "income" or "expense"');
        }

        // Validate amount
        const amount = parseFloat(String(transaction.amount));
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Amount must be a positive number');
        }

        // Get category_id if category name provided
        let categoryId: string | undefined;
        if (transaction.category) {
          categoryId = categoryMap.get(transaction.category.toLowerCase());
          if (!categoryId) {
            console.log(`[import-transactions] Category "${transaction.category}" not found, skipping category assignment`);
          }
        }

        // Calculate final amount (negative for expenses)
        const finalAmount = transaction.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

        // Insert transaction
        const { data: insertedTransaction, error: insertError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: body.account_id,
            date: transaction.date,
            description: transaction.description,
            amount: finalAmount,
            type: transaction.type,
            category_id: categoryId,
            tags: transaction.tags || [],
          })
          .select('id')
          .single();

        if (insertError) {
          throw insertError;
        }

        result.summary.imported++;
        result.details.imported_ids.push(insertedTransaction.id);
        totalBalanceChange += finalAmount;

        console.log(`[import-transactions] Transaction ${i + 1}/${body.transactions.length} imported: ${insertedTransaction.id}`);

      } catch (error) {
        result.summary.errors++;
        result.details.errors.push({
          index: i,
          transaction,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[import-transactions] Error processing transaction ${i + 1}:`, error);
      }
    }

    // Update account balance if transactions were imported
    if (result.summary.imported > 0) {
      const newBalance = (account.balance || 0) + totalBalanceChange;
      
      const { error: updateError } = await supabaseClient
        .from('accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', body.account_id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[import-transactions] Error updating account balance:', updateError);
        result.details.account_updated = false;
      } else {
        result.details.account_updated = true;
        console.log(`[import-transactions] Account balance updated: ${account.balance} -> ${newBalance}`);
      }
    }

    console.log(`[import-transactions] Import complete: ${result.summary.imported}/${result.summary.total} succeeded, ${result.summary.errors} errors`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[import-transactions] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
