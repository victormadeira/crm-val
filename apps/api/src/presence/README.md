# Presence Module — DRAFT (não integrado)

Gateway WebSocket + service Redis para a Sala Virtual. **Não está importado no `AppModule`** porque as dependências de WebSocket ainda não foram instaladas neste monorepo.

O diretório `src/presence/**` está excluído do `tsc` via `tsconfig.json` pra não quebrar o build da API enquanto as libs estão ausentes.

## Para ativar

1. Instalar deps no workspace da API:

```bash
pnpm --filter @valparaiso/api add @nestjs/websockets @nestjs/platform-socket.io socket.io @nestjs-modules/ioredis
```

2. Remover a exclusão em `apps/api/tsconfig.json`:

```diff
-  "exclude": ["node_modules", "dist", "src/presence/**"]
+  "exclude": ["node_modules", "dist"]
```

3. Registrar em `apps/api/src/app.module.ts`:

```ts
import { RedisModule } from "@nestjs-modules/ioredis";
import { PresenceModule } from "./presence/presence.module";

@Module({
  imports: [
    // ... existentes
    RedisModule.forRoot({ type: "single", url: process.env.REDIS_URL }),
    PresenceModule,
  ],
})
```

4. Configurar `FRONTEND_URL` no `.env` (CORS do Gateway).

5. No frontend, setar `VITE_WS_URL` em `apps/web/.env.local`.

## Integração com serviços existentes

O `PresenceHooks` expõe métodos (`onChatOpened`, `onCallStarted`, etc.) que devem ser chamados pelos services existentes (`WhatsappService`, `AiService`, etc.) quando eventos de atendimento ocorrem. Integração fica pra próxima iteração.

## Migration Prisma

Arquivo `apps/api/prisma/presence_schema_addition.prisma` é referência — se for persistir presença em Postgres (além do Redis), concatenar no `schema.prisma` principal e rodar `prisma migrate dev`.
