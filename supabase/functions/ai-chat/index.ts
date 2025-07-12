
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserFinancialData {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  categories: Array<{ name: string; amount: number; percentage: number }>;
  goals: Array<{ title: string; progress: number; target: number }>;
  totalBalance: number;
}

interface CRUDResult {
  success: boolean;
  message: string;
  data?: any;
}

interface ChatRequest {
  message: string;
  systemPrompt?: string;
  userData?: UserFinancialData;
  crudResult?: CRUDResult;
}

function buildFinancialPromptWithCRUD(userData: UserFinancialData, userMessage: string, crudResult?: CRUDResult): string {
  const { monthlyIncome, monthlyExpenses, savingsRate, categories, goals, totalBalance } = userData;
  
  const topCategories = categories
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(cat => `${cat.name}: R$ ${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`)
    .join(', ');

  const goalsProgress = goals
    .map(goal => `${goal.title}: ${((goal.progress / goal.target) * 100).toFixed(1)}% concluída (R$ ${goal.progress.toFixed(2)} de R$ ${goal.target.toFixed(2)})`)
    .join(', ');

  let crudContext = '';
  if (crudResult) {
    crudContext = `\n\nOPERAÇÃO CRUD EXECUTADA:
- Status: ${crudResult.success ? 'SUCESSO' : 'ERRO'}
- Resultado: ${crudResult.message}
${crudResult.data ? `- Dados: ${JSON.stringify(crudResult.data)}` : ''}

IMPORTANTE: A operação CRUD já foi executada. Comente sobre o resultado na sua resposta.`;
  }

  return `Você é um assistente financeiro especializado em finanças pessoais brasileiras com capacidades CRUD completas.
Você pode analisar dados, fornecer conselhos E TAMBÉM alterar dados do sistema quando solicitado.

DADOS FINANCEIROS DO USUÁRIO:
- Renda mensal: R$ ${monthlyIncome.toFixed(2)}
- Gastos mensais: R$ ${monthlyExpenses.toFixed(2)}
- Taxa de poupança: ${savingsRate.toFixed(1)}%
- Saldo total em contas: R$ ${totalBalance.toFixed(2)}
- Principais categorias de gastos: ${topCategories}
- Metas financeiras: ${goalsProgress}${crudContext}

CAPACIDADES CRUD DISPONÍVEIS:
Você pode executar operações nos dados:
- CRIAR: Novas transações, categorias, contas, cartões, metas
- LER: Consultar e filtrar dados existentes
- ATUALIZAR: Modificar transações, categorias, valores, etc.
- DELETAR: Excluir registros específicos

EXEMPLOS DE COMANDOS SUPORTADOS:
- "Altere todas as transações do McDonald's para a categoria Alimentação"
- "Mude a categoria das transações que contém 'Uber' para Transporte"
- "Crie uma nova categoria chamada Investimentos com cor azul"
- "Exclua a transação com descrição 'teste'"

PERGUNTA/COMANDO DO USUÁRIO: "${userMessage}"

INSTRUÇÕES PARA RESPOSTA:
- Responda sempre em português brasileiro
- Se uma operação CRUD foi executada, comente sobre o resultado
- Use linguagem clara, motivacional e prática
- Forneça conselhos específicos baseados nos dados apresentados
- Inclua números e percentuais quando relevante
- Seja encorajador mas realista
- Limite a resposta a no máximo 300 palavras
- Use formatação clara com tópicos quando apropriado

Se o usuário solicitar alterações nos dados, explique que a operação foi executada (se aplicável) e forneça orientações sobre o resultado.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const body = await req.json();
    console.log('Received request body:', body);
    
    const { message, systemPrompt, userData, crudResult }: ChatRequest = body;

    if (!message) {
      throw new Error('Message is required');
    }

    // Validar dados para evitar prompts maliciosos
    if (message.length > 500) {
      throw new Error('Message too long');
    }

    // Use systemPrompt if provided, otherwise build from userData
    let finalPrompt = systemPrompt;
    if (!finalPrompt && userData) {
      finalPrompt = buildFinancialPromptWithCRUD(userData, message, crudResult);
    } else if (!finalPrompt) {
      // Fallback prompt if no userData
      finalPrompt = `Você é um assistente financeiro especializado em finanças pessoais brasileiras.
      
PERGUNTA/COMANDO DO USUÁRIO: "${message}"

INSTRUÇÕES PARA RESPOSTA:
- Responda sempre em português brasileiro
- Use linguagem clara, motivacional e prática
- Seja encorajador mas realista
- Limite a resposta a no máximo 300 palavras`;
    }

    console.log('Using prompt:', finalPrompt.substring(0, 200) + '...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: finalPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      tokensUsed: data.usage?.total_tokens || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: error.message.includes('API key') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
