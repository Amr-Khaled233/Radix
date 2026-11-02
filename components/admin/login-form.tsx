"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { loginSchema } from "@/lib/auth/schemas";
import { FormMessage, SubmitButton, TextField } from "./form-controls";

type Values = z.infer<typeof loginSchema>;

export function LoginForm({ notice }: { notice?: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email: values.email, password: values.password });
    if (signInError) {
      // Generic message for every failure (wrong password, unknown or deactivated account).
      setError(signInError.status === 429 ? t("login.rateLimited") : t("login.invalid"));
      return;
    }
    router.replace("/admin");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-fib-21">
      {notice ? <FormMessage tone="info">{notice}</FormMessage> : null}
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <TextField
        label={t("common.email")}
        type="email"
        autoComplete="username"
        dir="ltr"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label={t("common.password")}
        type="password"
        autoComplete="current-password"
        dir="ltr"
        error={errors.password?.message}
        {...register("password")}
      />
      <SubmitButton pending={isSubmitting} pendingLabel={t("common.loading")}>
        {t("login.submit")}
      </SubmitButton>
      <p>
        <Link href="/admin/forgot-password" className="type-body text-foreground text-sm underline underline-offset-4">
          {t("login.forgot")}
        </Link>
      </p>
    </form>
  );
}
