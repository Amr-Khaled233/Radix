import { z } from "@/lib/zod";

/**
 * Shared client/server schemas. Error messages are translation keys under
 * `admin.validation` so the UI shows them in the current dashboard language.
 */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "email" }));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, { message: "passwordMin" })
  .max(PASSWORD_MAX, { message: "passwordMax" });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "required" }),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, { message: "passwordMatch", path: ["confirm"] });

/** 0–4 score for the strength meter: length plus character variety. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= PASSWORD_MIN) score += 1;
  if (password.length >= 14) score += 1;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes >= 2) score += 1;
  if (classes >= 3 && password.length >= 12) score += 1;
  if (password.length < PASSWORD_MIN) score = Math.min(score, 1);
  return score as 0 | 1 | 2 | 3 | 4;
}
