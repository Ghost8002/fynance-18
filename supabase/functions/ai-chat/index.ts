import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserFinancialData {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  categories: Array<{ id: string; name: string; color: string; type: string }>;
  goals: Array<{ id: string; title: string; progress: number; target: number }>;
  accounts: Array<{ id: string; name: string; balance: number; type: string }>;
  totalBalance: number;
  debtsSummary?: { totalPending: number; count: number; sample: string };
  receivablesSummary?: { totalPending: number; count: number; sample: string };
}

interface ChatRequest {
  message: string;
  userData?: UserFinancialData;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  stream?: boolean;
}

// Tool definitions for CRUD operations
const tools = [
  {
    type: "function",
    function: {
      name: "create_transaction",
      description: "Criar uma nova transação financeira (despesa ou receita)",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descrição da transação" },
          amount: { type: "number", description: "Valor da transação em reais" },
          date: { type: "string", description: "Data da transação (YYYY-MM-DD). Use data de hoje se não especificado." },
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: income (receita) ou expense (despesa)" },
          category_name: { type: "string", description: "Nome da categoria" },
          account_name: { type: "string", description: "Nome da conta (opcional)" }
        },
        required: ["description", "amount", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_transactions_by_filter",
      description: "Atualizar transações que correspondem a um filtro (ex: mudar categoria de transações do McDonald's para Alimentação)",
      parameters: {
        type: "object",
        properties: {
          filter_description: { type: "string", description: "Texto que deve estar na descrição das transações" },
          new_category_name: { type: "string", description: "Nova categoria para as transações" }
        },
        required: ["filter_description", "new_category_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_transaction",
      description: "Excluir uma transação específica",
      parameters: {
        type: "object",
        properties: {
          description_contains: { type: "string", description: "Texto na descrição da transação a ser excluída" },
          confirm: { type: "boolean", description: "Confirmação para excluir" }
        },
        required: ["description_contains"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_category",
      description: "Criar uma nova categoria de transações",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da categoria" },
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: income (receita) ou expense (despesa)" },
          color: { type: "string", description: "Cor em hexadecimal (ex: #3B82F6)" }
        },
        required: ["name", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_goal",
      description: "Criar uma nova meta financeira",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da meta" },
          target_amount: { type: "number", description: "Valor alvo da meta" },
          deadline: { type: "string", description: "Data limite (YYYY-MM-DD)" },
          description: { type: "string", description: "Descrição da meta" }
        },
        required: ["title", "target_amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_goal",
      description: "Atualizar uma meta existente (adicionar progresso, mudar valor, etc)",
      parameters: {
        type: "object",
        properties: {
          goal_title: { type: "string", description: "Título da meta a ser atualizada" },
          add_amount: { type: "number", description: "Valor a adicionar ao progresso" },
          new_target: { type: "number", description: "Novo valor alvo (opcional)" },
          new_deadline: { type: "string", description: "Nova data limite (opcional)" }
        },
        required: ["goal_title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_account",
      description: "Criar uma nova conta bancária/carteira",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da conta" },
          type: { type: "string", enum: ["checking", "savings", "investment", "wallet"], description: "Tipo da conta" },
          balance: { type: "number", description: "Saldo inicial" },
          bank: { type: "string", description: "Nome do banco (opcional)" }
        },
        required: ["name", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_transactions",
      description: "Listar transações com filtros opcionais",
      parameters: {
        type: "object",
        properties: {
          category_name: { type: "string", description: "Filtrar por categoria" },
          description_contains: { type: "string", description: "Filtrar por texto na descrição" },
          type: { type: "string", enum: ["income", "expense"], description: "Filtrar por tipo" },
          limit: { type: "number", description: "Número máximo de resultados" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_debt",
      description: "Registrar uma nova dívida (conta a pagar)",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descrição da dívida" },
          amount: { type: "number", description: "Valor em reais" },
          due_date: { type: "string", description: "Data de vencimento (YYYY-MM-DD)" },
          status: { type: "string", enum: ["pending", "paid", "overdue"], description: "Status (use pending para nova)" },
          category_name: { type: "string", description: "Nome da categoria (opcional)" },
          account_name: { type: "string", description: "Nome da conta (opcional)" },
          notes: { type: "string", description: "Observações (opcional)" }
        },
        required: ["description", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_debts",
      description: "Listar dívidas (contas a pagar) com filtros opcionais",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "paid", "overdue"], description: "Filtrar por status" },
          description_contains: { type: "string", description: "Texto na descrição" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_debt",
      description: "Atualizar uma dívida (ex: marcar como paga)",
      parameters: {
        type: "object",
        properties: {
          debt_description: { type: "string", description: "Texto na descrição da dívida para encontrar" },
          debt_id: { type: "string", description: "ID da dívida (se conhecido)" },
          status: { type: "string", enum: ["pending", "paid", "overdue"], description: "Novo status" },
          paid_date: { type: "string", description: "Data do pagamento (YYYY-MM-DD) quando status=paid" },
          amount: { type: "number", description: "Novo valor (opcional)" },
          due_date: { type: "string", description: "Nova data de vencimento (opcional)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_receivable",
      description: "Registrar um recebível (conta a receber)",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descrição do recebível" },
          amount: { type: "number", description: "Valor em reais" },
          due_date: { type: "string", description: "Data prevista de recebimento (YYYY-MM-DD)" },
          status: { type: "string", enum: ["pending", "received"], description: "Status (use pending para novo)" },
          category_name: { type: "string", description: "Nome da categoria (opcional)" },
          account_name: { type: "string", description: "Nome da conta (opcional)" },
          notes: { type: "string", description: "Observações (opcional)" }
        },
        required: ["description", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_receivables",
      description: "Listar recebíveis (contas a receber) com filtros opcionais",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "received"], description: "Filtrar por status" },
          description_contains: { type: "string", description: "Texto na descrição" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_receivable",
      description: "Atualizar um recebível (ex: marcar como recebido)",
      parameters: {
        type: "object",
        properties: {
          receivable_description: { type: "string", description: "Texto na descrição do recebível para encontrar" },
          receivable_id: { type: "string", description: "ID do recebível (se conhecido)" },
          status: { type: "string", enum: ["pending", "received"], description: "Novo status" },
          received_date: { type: "string", description: "Data do recebimento (YYYY-MM-DD) quando status=received" },
          amount: { type: "number", description: "Novo valor (opcional)" },
          due_date: { type: "string", description: "Nova data prevista (opcional)" }
        }
      }
    }
  }
];

function buildSystemPrompt(userData: UserFinancialData): string {
  const { monthlyIncome, monthlyExpenses, savingsRate, categories, goals, accounts, totalBalance, debtsSummary, receivablesSummary } = userData;
  
  const topCategories = categories
    .slice(0, 10)
    .map(cat => `${cat.name} (${cat.type}, id: ${cat.id})`)
    .join(', ');

  const goalsProgress = goals
    .map(goal => `${goal.title}: ${((goal.progress / goal.target) * 100).toFixed(1)}% (R$ ${goal.progress.toFixed(2)} de R$ ${goal.target.toFixed(2)}, id: ${goal.id})`)
    .join(', ');

  const accountsList = accounts
    .map(acc => `${acc.name}: R$ ${acc.balance.toFixed(2)} (${acc.type}, id: ${acc.id})`)
    .join(', ');

  const debtsText = debtsSummary
    ? `- Dívidas a pagar: ${debtsSummary.count} itens, total R$ ${debtsSummary.totalPending.toFixed(2)}. Exemplos: ${debtsSummary.sample || 'nenhuma'}`
    : '';

  const receivablesText = receivablesSummary
    ? `- Recebíveis: ${receivablesSummary.count} itens, total R$ ${receivablesSummary.totalPending.toFixed(2)}. Exemplos: ${receivablesSummary.sample || 'nenhum'}`
    : '';

  const today = new Date().toISOString().split('T')[0];

  return `Você é um assistente financeiro inteligente especializado em finanças pessoais brasileiras.
Você pode analisar dados, fornecer conselhos personalizados E executar operações CRUD quando solicitado.

DATA DE HOJE: ${today}

DADOS FINANCEIROS DO USUÁRIO:
- Renda mensal: R$ ${monthlyIncome.toFixed(2)}
- Gastos mensais: R$ ${monthlyExpenses.toFixed(2)}
- Taxa de poupança: ${savingsRate.toFixed(1)}%
- Saldo total: R$ ${totalBalance.toFixed(2)}
- Categorias disponíveis: ${topCategories || 'Nenhuma categoria'}
- Contas: ${accountsList || 'Nenhuma conta'}
- Metas: ${goalsProgress || 'Nenhuma meta'}
${debtsText}
${receivablesText}

CAPACIDADES (ferramentas CRUD):
Use as ferramentas quando o usuário solicitar:
- Transações: criar, listar, alterar categoria em lote, excluir (create_transaction, list_transactions, update_transactions_by_filter, delete_transaction)
- Categorias e contas: criar (create_category, create_account)
- Metas: criar e atualizar (create_goal, update_goal)
- Dívidas (contas a pagar): criar, listar, atualizar status/pagamento (create_debt, list_debts, update_debt)
- Recebíveis (contas a receber): criar, listar, atualizar status/recebimento (create_receivable, list_receivables, update_receivable)

INSTRUÇÕES:
- Responda em português brasileiro
- Use as ferramentas para qualquer operação CRUD solicitada
- Para datas não especificadas, use a data de hoje
- Forneça conselhos práticos baseados nos dados
- Seja encorajador e motivacional
- Limite respostas a 250 palavras
- Use formatação markdown quando apropriado`;
}

function getDefaultSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0];
  return `Você é um assistente financeiro inteligente especializado em finanças pessoais brasileiras.
DATA DE HOJE: ${today}

Você tem acesso a ferramentas para gerenciar dados financeiros do usuário.
Responda em português brasileiro de forma clara e motivacional.
Limite respostas a 250 palavras.`;
}

serve(async (req) => {
  console.log('Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found');
      throw new Error('API key not configured');
    }

    const body: ChatRequest = await req.json();
    const { message, userData, chatHistory = [], stream = true } = body;

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required');
    }

    if (message.length > 2000) {
      throw new Error('Message too long');
    }

    // Sanitize input
    const sanitizedMessage = message
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\[INST\]|\[\/INST\]|\[\[.*?\]\]/gi, '')
      .replace(/system:|assistant:|user:/gi, '')
      .trim();

    if (!sanitizedMessage) {
      throw new Error('Invalid message');
    }

    const systemPrompt = userData ? buildSystemPrompt(userData) : getDefaultSystemPrompt();

    // Build messages array with history and current message
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: sanitizedMessage }
    ];

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        tools: tools,
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Stream response back to client
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    const toolCalls = data.choices?.[0]?.message?.tool_calls;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      toolCalls: toolCalls,
      tokensUsed: data.usage?.total_tokens || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
