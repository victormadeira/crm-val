import { z } from "zod";
import { USER_ROLES } from "../enums";

export const LoginInputSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(8).max(200),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(20),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(USER_ROLES),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTtl: z.number().int(),
  refreshTtl: z.number().int(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: AuthTokensSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
