# 🔐 Configuração OAuth para ChatGPT

Este documento explica como configurar o ChatGPT Custom GPT para usar autenticação OAuth 2.0 com a API de importação de transações.

---

## 📋 **Visão Geral**

O sistema implementa o **OAuth 2.0 Password Grant Flow**, permitindo que o ChatGPT:
1. Solicite credenciais do usuário (email e senha)
2. Obtenha automaticamente um JWT token
3. Use o token em todas as requisições subsequentes
4. Renove o token automaticamente quando expirar

---

## 🔧 **Endpoints Disponíveis**

### **1. Obter Token de Acesso**
```
POST https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/oauth-token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=seu@email.com&password=suasenha
```

**Resposta de Sucesso (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**Erros Possíveis**:
- `400` - `unsupported_grant_type` ou `invalid_request`
- `401` - `invalid_grant` (credenciais inválidas)
- `500` - `server_error`

---

### **2. Importar Transações**
```
POST https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/import-transactions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "account_id": "uuid-da-conta",
  "transactions": [...]
}
```

---

## 🎯 **Schema OpenAPI para ChatGPT**

Cole este schema no campo "Schema" do seu Custom GPT:

```yaml
openapi: 3.1.0
info:
  title: API de Importação de Transações Financeiras
  description: API para importar transações financeiras em lote, autenticada via OAuth 2.0
  version: 1.0.0
servers:
  - url: https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1
    description: Servidor de produção Supabase

paths:
  /oauth-token:
    post:
      summary: Obter token de acesso OAuth 2.0
      description: Endpoint para autenticação via Password Grant Flow
      operationId: getOAuthToken
      requestBody:
        required: true
        content:
          application/x-www-form-urlencoded:
            schema:
              type: object
              required:
                - grant_type
                - username
                - password
              properties:
                grant_type:
                  type: string
                  enum: [password]
                  description: Tipo de concessão OAuth (sempre "password")
                username:
                  type: string
                  format: email
                  description: Email do usuário
                password:
                  type: string
                  format: password
                  description: Senha do usuário
      responses:
        '200':
          description: Token obtido com sucesso
          content:
            application/json:
              schema:
                type: object
                required:
                  - access_token
                  - token_type
                  - expires_in
                properties:
                  access_token:
                    type: string
                    description: JWT token de acesso
                  token_type:
                    type: string
                    enum: [Bearer]
                  expires_in:
                    type: integer
                    description: Tempo de expiração em segundos
                  refresh_token:
                    type: string
                    description: Token para renovação
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - error_description
                properties:
                  error:
                    type: string
                  error_description:
                    type: string
        '401':
          description: Credenciais inválidas
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - error_description
                properties:
                  error:
                    type: string
                  error_description:
                    type: string

  /import-transactions:
    post:
      summary: Importar transações financeiras em lote
      description: Importa múltiplas transações financeiras de uma só vez para uma conta específica
      operationId: importTransactions
      security:
        - OAuth2PasswordFlow: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - account_id
                - transactions
              properties:
                account_id:
                  type: string
                  format: uuid
                  description: ID da conta onde as transações serão importadas
                  example: "123e4567-e89b-12d3-a456-426614174000"
                transactions:
                  type: array
                  description: Lista de transações a serem importadas
                  minItems: 1
                  maxItems: 100
                  items:
                    type: object
                    required:
                      - type
                      - description
                      - amount
                      - date
                    properties:
                      type:
                        type: string
                        enum: [income, expense]
                        description: Tipo da transação (receita ou despesa)
                      description:
                        type: string
                        minLength: 1
                        maxLength: 500
                        description: Descrição da transação
                        example: "Compra no supermercado"
                      amount:
                        type: number
                        minimum: 0.01
                        description: Valor da transação (sempre positivo)
                        example: 150.50
                      date:
                        type: string
                        format: date
                        description: Data da transação no formato YYYY-MM-DD
                        example: "2025-01-15"
                      category:
                        type: string
                        minLength: 1
                        maxLength: 100
                        description: Nome da categoria (será criada se não existir)
                        example: "Alimentação"
                      notes:
                        type: string
                        maxLength: 1000
                        description: Observações adicionais sobre a transação
                        example: "Compra mensal"
      responses:
        '200':
          description: Transações importadas com sucesso
          content:
            application/json:
              schema:
                type: object
                required:
                  - success
                  - imported
                  - message
                properties:
                  success:
                    type: boolean
                    example: true
                  imported:
                    type: integer
                    description: Número de transações importadas
                    example: 5
                  message:
                    type: string
                    example: "5 transações importadas com sucesso"
        '400':
          description: Erro de validação nos dados enviados
          content:
            application/json:
              schema:
                type: object
                required:
                  - success
                  - error
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "account_id é obrigatório"
        '401':
          description: Token de autenticação inválido ou ausente
          content:
            application/json:
              schema:
                type: object
                required:
                  - success
                  - error
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "Não autorizado"
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                required:
                  - success
                  - error
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: "Erro ao processar importação"

components:
  securitySchemes:
    OAuth2PasswordFlow:
      type: oauth2
      flows:
        password:
          tokenUrl: https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/oauth-token
          scopes: {}
```

---

## ⚙️ **Configuração no ChatGPT Custom GPT**

### **Passo 1: Acessar Configurações de Autenticação**
1. Vá para o editor do seu Custom GPT
2. Na seção **"Actions"**, adicione ou edite a action
3. Role até **"Authentication"**

### **Passo 2: Configurar OAuth**
Selecione as seguintes opções:

- **Authentication Type**: `OAuth`
- **Client ID**: Deixe em branco (não usado no password flow)
- **Client Secret**: Deixe em branco
- **Authorization URL**: `https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/oauth-token` (obrigatório mesmo não sendo usado)
- **Token URL**: `https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/oauth-token`
- **Scope**: Deixe em branco
- **Token Exchange Method**: `Basic authorization header`

### **Passo 3: Cole o Schema**
- Cole o schema OpenAPI acima no campo **"Schema"**

### **Passo 4: Salvar e Testar**
- Clique em **"Save"**
- O ChatGPT pedirá suas credenciais na primeira vez que você usar

---

## 🧪 **Testando Manualmente**

### **Teste 1: Obter Token**
```bash
curl -X POST https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/oauth-token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=seu@email.com&password=suasenha"
```

**Resposta esperada**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

### **Teste 2: Importar Transações**
```bash
curl -X POST https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/import-transactions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "uuid-da-sua-conta",
    "transactions": [
      {
        "type": "expense",
        "description": "Teste via OAuth",
        "amount": 50.00,
        "date": "2025-01-15",
        "category": "Testes"
      }
    ]
  }'
```

---

## 🔍 **Monitoramento e Logs**

### **Visualizar Logs das Edge Functions**

**OAuth Token Logs**:
https://supabase.com/dashboard/project/vwactcwdsfkytqmsdkde/functions/oauth-token/logs

**Import Transactions Logs**:
https://supabase.com/dashboard/project/vwactcwdsfkytqmsdkde/functions/import-transactions/logs

### **O que procurar nos logs**:
- ✅ `OAuth token request received` - Requisição recebida
- ✅ `Authentication successful for user: {id}` - Login bem-sucedido
- ❌ `Authentication failed: {message}` - Falha no login
- ❌ `Invalid username or password` - Credenciais incorretas

---

## 🛡️ **Segurança**

### **Boas Práticas**:
1. ✅ **Use HTTPS**: Sempre habilitado no Supabase
2. ✅ **Token JWT**: Expira automaticamente em 1 hora
3. ✅ **Validação de dados**: Implementada na edge function
4. ⚠️ **Rate Limiting**: Considere implementar proteção contra força bruta

### **Considerações Importantes**:
- 🔐 O ChatGPT armazena credenciais com segurança
- ⏱️ Token expira em 1 hora (configurável no Supabase)
- 🔄 ChatGPT solicitará novas credenciais quando expirar
- 👤 Considere criar usuários específicos para API com permissões limitadas

---

## 📚 **Exemplos de Uso no ChatGPT**

Depois de configurar, você pode usar assim:

```
Usuário: Importe 5 transações de teste para janeiro de 2025
ChatGPT: [Solicita credenciais se necessário]
ChatGPT: [Autentica automaticamente]
ChatGPT: Transações importadas com sucesso! ✅
```

```
Usuário: Adicione despesas de supermercado da semana passada
ChatGPT: [Usa token existente]
ChatGPT: Adicionei 3 transações de supermercado 🛒
```

---

## 🆘 **Troubleshooting**

### **Erro: "Invalid username or password"**
- ✅ Verifique se o email está correto
- ✅ Confirme a senha no sistema
- ✅ Verifique se o usuário está ativo no Supabase

### **Erro: "Token expired"**
- ✅ ChatGPT pedirá novas credenciais automaticamente
- ✅ Ou forneça credenciais manualmente

### **Erro: "account_id não encontrado"**
- ✅ Use o endpoint GET /accounts para listar contas disponíveis
- ✅ Copie o UUID correto da conta

### **Função não aparece no ChatGPT**
- ✅ Verifique se o schema foi colado corretamente
- ✅ Confirme que a função está no ar: https://vwactcwdsfkytqmsdkde.supabase.co/functions/v1/oauth-token
- ✅ Aguarde alguns minutos para propagação

---

## 🎯 **Próximos Passos**

1. ✅ Configure o ChatGPT seguindo este guia
2. 🧪 Teste a autenticação manualmente
3. 🤖 Use o ChatGPT para importar transações
4. 📊 Monitore os logs para garantir funcionamento
5. 🔒 Considere implementar rate limiting para produção

---

**Dúvidas?** Consulte os logs das edge functions ou teste manualmente com cURL!
