import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodTypeAny, z } from "zod";

/**
 * ZodValidationPipe — instanciado com um schema Zod do pacote
 * @valparaiso/shared. Converte erros de parsing em 400 com detalhes
 * por campo (sem vazar stack).
 */
export class ZodValidationPipe<T extends ZodTypeAny>
  implements PipeTransform<unknown, z.infer<T>>
{
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const res = this.schema.safeParse(value);
    if (!res.success) {
      throw new BadRequestException({
        message: "Payload inválido",
        fieldErrors: res.error.flatten().fieldErrors,
      });
    }
    return res.data;
  }
}
