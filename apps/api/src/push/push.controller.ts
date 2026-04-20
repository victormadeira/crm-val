import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  UsePipes,
} from "@nestjs/common";
import {
  RegisterPushTokenSchema,
  UnregisterPushTokenSchema,
  type RegisterPushTokenInput,
  type UnregisterPushTokenInput,
} from "@valparaiso/shared";
import { CurrentAuth } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { PushService } from "./push.service";

@Controller("push")
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post("tokens")
  @UsePipes(new ZodValidationPipe(RegisterPushTokenSchema))
  register(
    @Body() body: RegisterPushTokenInput,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.push.registerToken(auth.userId, body);
  }

  @Delete("tokens")
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(UnregisterPushTokenSchema))
  async unregister(
    @Body() body: UnregisterPushTokenInput,
    @CurrentAuth() auth: AuthContext
  ): Promise<void> {
    await this.push.unregisterToken(auth.userId, body);
  }
}
