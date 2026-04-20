import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  RequestMethod,
  ValidationPipe,
  VersioningType,
  Logger,
} from "@nestjs/common";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    // Webhook da Meta precisa do body raw pra validar HMAC — o handler
    // do WhatsApp habilita rawBody via `@RawBody()` no controller próprio
    // usando um parser por rota.
    rawBody: true,
    bufferLogs: true,
  });

  app.use(helmet());
  app.use((req: Request & { id?: string }, _res: Response, next: NextFunction) => {
    req.id = (req.headers["x-request-id"] as string) ?? randomUUID();
    next();
  });

  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Webhooks Meta ficam FORA do prefixo "api/v1" — a URL pública é
  // /webhooks/meta (Caddy encaminha direto) e precisa ser exatamente essa.
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "webhooks/(.*)", method: RequestMethod.GET },
      { path: "webhooks/(.*)", method: RequestMethod.POST },
    ],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "v",
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.enableShutdownHooks();

  await app.listen(env.PORT);
  Logger.log(`API online em http://localhost:${env.PORT}/api/v1/health`, "Bootstrap");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[bootstrap] falhou:", err);
  process.exit(1);
});
