# Arquitetura do Módulo de Sala Virtual (Presença em Tempo Real)

## 1. Visão Geral

O módulo "Sala Virtual" é uma extensão do CRM Valparaíso projetada para fornecer aos supervisores e gestores uma visão em tempo real do estado da equipe de atendimento (corretores, SAC e agentes de IA). Em vez de um metaverso 3D complexo, a solução adota uma abordagem pragmática: um backend de presença sólido acoplado a uma interface 2D isométrica simples (estilo Habbo Hotel simplificado).

O objetivo principal é responder rapidamente:
- Quem está online e atendendo agora?
- Qual o status de cada atendente (ocioso, em conversa, pausa)?
- Há quanto tempo estão nesse status?
- Quais leads/tickets estão sendo tratados no momento?

## 2. Stack Tecnológica

A arquitetura se integra perfeitamente à stack existente do CRM para evitar duplicação de infraestrutura e garantir consistência de dados e autenticação.

### Backend (NestJS + Prisma + Redis)
- **WebSocket Gateway (Socket.io):** Gerencia conexões persistentes com os clientes. Utiliza *rooms* baseadas no `tenantId` para isolar o tráfego de eventos entre diferentes instâncias do CRM.
- **Redis:** Atua como *store* de estado em memória para manter a presença (quem está online, em qual aba, status atual) e como *pub/sub* para escalar os WebSockets horizontalmente, se necessário.
- **Prisma (PostgreSQL):** Persiste logs de auditoria de status (ex: tempo total em pausa, tempo total em atendimento) para relatórios históricos.
- **AsyncLocalStorage:** Mantém o escopo do tenant em todas as requisições e eventos de socket.

### Frontend (React 18 + Vite + Zustand + Canvas/SVG)
- **Zustand:** Gerencia o estado global de presença no cliente, sincronizando com os eventos do WebSocket.
- **Canvas/SVG (Isométrico 2D):** Renderiza a "sala" visual. Utiliza sprites estáticos com animações CSS/Canvas mínimas (ex: balão de "digitando", ícone de "telefone" para chamadas).
- **TailwindCSS + Framer Motion:** Para a interface de detalhes (painel lateral que abre ao clicar em um avatar) e transições suaves.

## 3. Modelo de Dados (Presença)

O estado de presença de um usuário (humano ou IA) é efêmero e armazenado no Redis.

```typescript
interface UserPresence {
  userId: string;          // ID do Corretor, SAC ou Bot
  tenantId: string;        // ID do Tenant
  role: 'corretor' | 'sac' | 'bot';
  status: PresenceStatus;  // Estado atual
  statusUpdatedAt: string; // Timestamp da última mudança de status
  currentActivity?: {
    type: 'whatsapp' | 'ticket' | 'ligacao';
    targetId: string;      // ID do Lead ou Ticket
    targetName: string;    // Nome do Lead/Cliente
    startedAt: string;     // Início da atividade atual
  };
  position: {              // Posição na sala isométrica
    x: number;
    y: number;
  };
}

type PresenceStatus = 
  | 'online_idle'      // Online, mas sem atividade ativa
  | 'busy_chat'        // Atendendo via chat (WhatsApp/IG)
  | 'busy_call'        // Em ligação
  | 'away_break'       // Em pausa (banheiro, café)
  | 'offline';         // Desconectado
```

## 4. Fluxo de Eventos (WebSocket)

1. **Conexão (`connection`):**
   - O cliente conecta ao namespace `/presence`.
   - O middleware de autenticação valida o token JWT e extrai `userId` e `tenantId`.
   - O socket entra na room `tenant:${tenantId}`.
   - O backend emite `presence:sync` com o estado atual de todos os usuários da room.

2. **Atualização de Status (`presence:update`):**
   - O cliente emite este evento quando o usuário muda de aba, abre um chat no WhatsApp, ou clica em "Pausa".
   - O backend atualiza o Redis e faz broadcast (`presence:updated`) para a room.

3. **Desconexão (`disconnect`):**
   - O backend marca o usuário como `offline` no Redis (com um TTL de *grace period* para evitar *flapping* em reloads de página).
   - Faz broadcast da saída para a room.

## 5. Arquitetura do Frontend (Sala Isométrica)

A interface é dividida em duas camadas principais:

### 5.1. O "Grid" Isométrico (A Sala)
- Uma malha 2D projetada isometricamente (rotação de 45 graus, inclinação).
- Cada atendente recebe uma coordenada `(x, y)` fixa ou semi-aleatória na sala.
- **Avatares:** Sprites simples (ex: bonecos sentados em mesas).
- **Indicadores Visuais:**
  - Balão de reticências (...) = `busy_chat`
  - Ícone de telefone = `busy_call`
  - Ícone de xícara de café = `away_break`
  - Avatar escurecido/transparente = `offline`

### 5.2. O Painel de Detalhes (HUD)
- Ao clicar em um avatar na sala, um painel lateral (Drawer/Sidebar) desliza.
- **Informações exibidas:**
  - Nome, Foto e Papel.
  - Status atual e cronômetro (ex: "Em atendimento há 04:12").
  - Lead/Ticket atual em foco.
  - Fila de espera do atendente (quantos leads aguardando resposta).
  - Métricas rápidas do dia (leads fechados, tempo médio de resposta).

## 6. Integração com o CRM Existente

Para que a sala reflita a realidade sem exigir input manual dos corretores:

1. **Hook no Zustand (`useApp` / `useWhatsApp`):**
   - Quando o corretor seleciona uma conversa no painel do WhatsApp (`setSelectedLead`), o frontend dispara um evento de socket atualizando a `currentActivity`.
2. **Integração com Roteamento IA:**
   - Quando o `RouterIA` aloca um novo lead para um corretor, o backend emite um evento que atualiza a fila visível no painel de detalhes da sala.
3. **Agentes de IA:**
   - Os bots (ex: `ChatbotIA`) são tratados como usuários virtuais. O backend de mensageria atualiza o status do bot no Redis sempre que ele processa uma mensagem, fazendo-o "piscar" na sala virtual.

## 7. Considerações de Performance e Escalabilidade

- **Redis Pub/Sub:** Essencial se o backend NestJS for escalado para múltiplas instâncias. Garante que um supervisor conectado na Instância A veja a atualização de um corretor conectado na Instância B.
- **Throttling de Eventos:** Eventos de digitação (`typing`) devem ser limitados (ex: *debounce* de 1 segundo) para não sobrecarregar o WebSocket.
- **Renderização:** O uso de Canvas HTML5 ou SVGs otimizados com React garante que a renderização de 30-50 avatares não cause *lag* no navegador do supervisor.

## 8. Próximos Passos de Implementação

1. Criar o `PresenceGateway` no NestJS.
2. Configurar o Redis Module para gerenciar o estado efêmero.
3. Criar o store Zustand `usePresenceStore` no frontend.
4. Desenvolver o componente `IsometricRoom` (Canvas/SVG).
5. Desenvolver o componente `AvatarDetailsPanel`.
6. Conectar os hooks de navegação do CRM aos eventos de presença.
