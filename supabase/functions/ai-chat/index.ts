
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

function buildSystemPrompt(userData: UserFinancialData, crudResult?: CRUDResult): string {
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
- Principais categorias de gastos: ${topCategories || 'Nenhuma categoria encontrada'}
- Metas financeiras: ${goalsProgress || 'Nenhuma meta encontrada'}${crudContext}

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

function getDefaultSystemPrompt(): string {
  return `Você é um assistente financeiro especializado em finanças pessoais brasileiras.

INSTRUÇÕES PARA RESPOSTA:
- Responda sempre em português brasileiro
- Use linguagem clara, motivacional e prática
- Seja encorajador mas realista
- Limite a resposta a no máximo 300 palavras
- Forneça dicas práticas sobre gestão financeira`;
}

serve(async (req) => {
  console.log('Request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not found in environment');
      throw new Error('Groq API key not configured. Please add GROQ_API_KEY to your Supabase Edge Function secrets.');
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid JSON in request body');
    }
    
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const { message, systemPrompt, userData, crudResult }: ChatRequest = body;

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    // Validate message length
    if (message.length > 1000) {
      throw new Error('Message too long. Please keep messages under 1000 characters.');
    }

    // Build system prompt - user message is now passed as a separate user role message
    let systemPromptContent = systemPrompt;
    if (!systemPromptContent && userData) {
      systemPromptContent = buildSystemPrompt(userData, crudResult);
    } else if (!systemPromptContent) {
      systemPromptContent = getDefaultSystemPrompt();
    }

    console.log('Using system prompt length:', systemPromptContent.length);

    // Use proper message roles to prevent prompt injection
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPromptContent },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY configuration.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else {
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Groq API response:', JSON.stringify(data, null, 2));
    
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('No response content from Groq API:', data);
      throw new Error('No response generated by AI. Please try again.');
    }

    console.log('AI response generated successfully, length:', aiResponse.length);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      tokensUsed: data.usage?.total_tokens || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Log detailed error server-side only
    console.error('Error in ai-chat function:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('API key') ? 401 : 
                      errorMessage.includes('Rate limit') ? 429 : 500;
    
    // Return generic error to client - no stack traces exposed
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
