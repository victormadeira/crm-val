import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
  path: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Filter global — nunca vaza stack trace pro cliente. Erros esperados
 * (HttpException, Prisma known errors) viram respostas estruturadas;
 * qualquer outra coisa cai em 500 genérico e é logada.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request & { id?: string }>();

    const base: Omit<ErrorBody, "statusCode" | "error" | "message"> = {
      path: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      const body: ErrorBody = {
        ...base,
        statusCode: status,
        error: HttpStatus[status] ?? "Error",
        message:
          typeof resp === "string"
            ? resp
            : ((resp as { message?: string | string[] }).message ?? exception.message),
      };
      res.status(status).json(body);
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const map: Record<string, { status: number; message: string }> = {
        P2002: { status: HttpStatus.CONFLICT, message: "Registro duplicado" },
        P2025: { status: HttpStatus.NOT_FOUND, message: "Registro não encontrado" },
        P2003: { status: HttpStatus.BAD_REQUEST, message: "Violação de chave estrangeira" },
      };
      const m = map[exception.code] ?? {
        status: HttpStatus.BAD_REQUEST,
        message: "Erro no banco de dados",
      };
      res.status(m.status).json({
        ...base,
        statusCode: m.status,
        error: HttpStatus[m.status],
        message: m.message,
        code: exception.code,
      });
      return;
    }

    // Erro genérico — loga com detalhe mas responde opaco.
    this.logger.error(
      `Unhandled ${exception instanceof Error ? exception.stack : String(exception)}`
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Internal Server Error",
      message: "Erro interno",
    });
  }
}
