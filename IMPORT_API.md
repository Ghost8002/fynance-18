# API de Importação de Transações

Esta API permite importar transações em formato JSON diretamente para o sistema através de uma requisição HTTP.

## 🔗 Endpoint

```
POST https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/import-transactions
```

## 🔐 Autenticação

A API requer autenticação via JWT token do Supabase. Você precisa incluir o token nos headers da requisição.

### Headers Obrigatórios

```
Authorization: Bearer <SEU_JWT_TOKEN>
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3YWN0Y3dkc2ZreXRxbXNka2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjM5MDIsImV4cCI6MjA2NzkzOTkwMn0.Ejwws4kG6SHSaycTJItrRbfHbSIXdlu8OLg07VXr3n8
Content-Type: application/json
```

### Como obter o JWT Token

1. **Pelo navegador (após login):**
   - Abra o DevTools (F12)
   - Vá para Application > Local Storage
   - Procure por chaves do Supabase que contenham "auth"
   - O token JWT estará lá

2. **Pelo código JavaScript:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

## 📝 Formato da Requisição

### Body (JSON)

```json
{
  "account_id": "uuid-da-conta",
  "transactions": [
    {
      "date": "2025-01-15",
      "description": "Supermercado Extra",
      "amount": 250.50,
      "type": "expense",
      "category": "Alimentação",
      "tags": ["supermercado", "mercado"]
    },
    {
      "date": "2025-01-16",
      "description": "Salário Janeiro",
      "amount": 5000.00,
      "type": "income",
      "category": "Salário",
      "tags": ["trabalho"]
    }
  ]
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `account_id` | string (uuid) | ID da conta onde as transações serão importadas |
| `transactions` | array | Array de objetos de transação |

### Estrutura de cada Transação

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `date` | string | ✅ Sim | Data no formato YYYY-MM-DD |
| `description` | string | ✅ Sim | Descrição da transação |
| `amount` | number | ✅ Sim | Valor da transação (sempre positivo) |
| `type` | string | ✅ Sim | Tipo: "income" (receita) ou "expense" (despesa) |
| `category` | string | ❌ Não | Nome da categoria (se não existir, será ignorado) |
| `tags` | array | ❌ Não | Array de strings com tags |

## 📤 Respostas da API

### Sucesso Total (200 OK)

```json
{
  "success": true,
  "summary": {
    "total": 2,
    "imported": 2,
    "errors": 0,
    "duplicates": 0
  },
  "details": {
    "imported_ids": ["uuid1", "uuid2"],
    "errors": [],
    "account_updated": true
  }
}
```

### Sucesso Parcial (200 OK)

```json
{
  "success": true,
  "summary": {
    "total": 3,
    "imported": 2,
    "errors": 1,
    "duplicates": 0
  },
  "details": {
    "imported_ids": ["uuid1", "uuid2"],
    "errors": [
      {
        "index": 2,
        "transaction": {
          "date": "2025-13-45",
          "description": "Invalid",
          "amount": 100,
          "type": "expense"
        },
        "error": "Invalid date format. Expected: YYYY-MM-DD"
      }
    ],
    "account_updated": true
  }
}
```

### Erro de Autenticação (401 Unauthorized)

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Erro de Validação (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Invalid request body. Expected: { account_id: string, transactions: Transaction[] }"
}
```

## 🚀 Exemplos de Uso

### cURL

```bash
curl -X POST https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/import-transactions \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3YWN0Y3dkc2ZreXRxbXNka2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjM5MDIsImV4cCI6MjA2NzkzOTkwMn0.Ejwws4kG6SHSaycTJItrRbfHbSIXdlu8OLg07VXr3n8" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "sua-conta-uuid",
    "transactions": [
      {
        "date": "2025-01-15",
        "description": "Café da Manhã",
        "amount": 25.50,
        "type": "expense",
        "category": "Alimentação"
      }
    ]
  }'
```

### JavaScript (fetch)

```javascript
const importTransactions = async (accountId, transactions) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    'https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/import-transactions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3YWN0Y3dkc2ZreXRxbXNka2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjM5MDIsImV4cCI6MjA2NzkzOTkwMn0.Ejwws4kG6SHSaycTJItrRbfHbSIXdlu8OLg07VXr3n8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: accountId,
        transactions: transactions,
      }),
    }
  );

  return await response.json();
};

// Uso
const result = await importTransactions('sua-conta-uuid', [
  {
    date: '2025-01-15',
    description: 'Supermercado',
    amount: 150.00,
    type: 'expense',
    category: 'Alimentação',
    tags: ['mercado']
  }
]);

console.log(result);
```

### Python (requests)

```python
import requests

def import_transactions(jwt_token, account_id, transactions):
    url = "https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/import-transactions"
    
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3YWN0Y3dkc2ZreXRxbXNka2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjM5MDIsImV4cCI6MjA2NzkzOTkwMn0.Ejwws4kG6SHSaycTJItrRbfHbSIXdlu8OLg07VXr3n8",
        "Content-Type": "application/json"
    }
    
    data = {
        "account_id": account_id,
        "transactions": transactions
    }
    
    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Uso
result = import_transactions(
    jwt_token="SEU_JWT_TOKEN",
    account_id="sua-conta-uuid",
    transactions=[
        {
            "date": "2025-01-15",
            "description": "Almoço",
            "amount": 45.00,
            "type": "expense",
            "category": "Alimentação"
        }
    ]
)

print(result)
```

## 🤖 Integração com ChatGPT

Você pode pedir ao ChatGPT para gerar e enviar transações diretamente:

**Exemplo de prompt:**

```
Crie 5 transações de exemplo para o mês de janeiro e envie para esta API:
https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/import-transactions

Use este formato JSON:
{
  "account_id": "MINHA_CONTA_UUID",
  "transactions": [...]
}

Headers necessários:
- Authorization: Bearer MEU_TOKEN
- apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso (total ou parcial) |
| 401 | Token JWT inválido ou ausente |
| 500 | Erro no servidor (veja o campo `error` na resposta) |

## 📊 Comportamentos Importantes

1. **Categorias:** Se uma categoria não existir, a transação será importada sem categoria
2. **Valores:** O sistema converte automaticamente valores negativos/positivos baseado no `type`
3. **Saldo:** O saldo da conta é atualizado automaticamente após importação bem-sucedida
4. **Erros Parciais:** Se algumas transações falharem, as bem-sucedidas serão mantidas
5. **Validação:** Cada transação é validada individualmente

## 🔒 Segurança

- ✅ Autenticação JWT obrigatória
- ✅ Validação de propriedade da conta
- ✅ Validação de dados de entrada
- ✅ Logs detalhados para auditoria
- ✅ CORS habilitado para chamadas web

## 📝 Notas

- A API processa até 1000 transações por requisição (recomendado)
- Transações duplicadas devem ser gerenciadas pelo cliente
- O token JWT expira após 1 hora (padrão Supabase)
- Erros não interrompem o processamento de outras transações
