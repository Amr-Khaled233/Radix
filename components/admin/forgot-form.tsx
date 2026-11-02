"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { forgotSchema } from "@/lib/auth/schemas";
import { FormMessage, SubmitButton, TextField } from "./form-controls";

type Values = z.infer<typeof forgotSchema>;

export function ForgotForm() {
  const t = useTranslations("admin");
  const [done, setDone] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/admin/reset-password" });
    if (error?.status === 429) {
      setRateLimited(true);
      return;
    }
    // Same response whether or not the account exists (no user enumeration).
    setDone(true);
  });

  if (done) {
    return (
      <div className="space-y-fib-21">
        <FormMessage tone="info">{t("forgot.sent")}</FormMessage>
        <Link href="/admin/login" className="type-body text-foreground text-sm underline underline-offset-4">
          {t("common.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-fib-21">
      {rateLimited ? <FormMessage tone="error">{t("login.rateLimited")}</FormMessage> : null}
      <TextField
        label={t("common.email")}
        type="email"
        autoComplete="username"
        dir="ltr"
        error={errors.email?.message}
        {...register("email")}
      />
      <SubmitButton pending={isSubmitting} pendingLabel={t("common.loading")}>
        {t("forgot.submit")}
      </SubmitButton>
      <p>
        <Link href="/admin/login" className="type-body text-foreground text-sm underline underline-offset-4">
          {t("common.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
