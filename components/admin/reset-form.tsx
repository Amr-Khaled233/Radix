"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { PASSWORD_MAX, PASSWORD_MIN, passwordStrength, resetSchema } from "@/lib/auth/schemas";
import { cn } from "@/lib/cn";
import { FormMessage, SubmitButton, TextField } from "./form-controls";

type Values = z.infer<typeof resetSchema>;

const STRENGTH_KEYS = ["weak", "weak", "fair", "good", "strong"] as const;

function StrengthMeter({ password }: { password: string }) {
  const t = useTranslations("admin.strength");
  const score = passwordStrength(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={cn("h-1 flex-1", step <= score ? "bg-accent" : "bg-line")} />
        ))}
      </div>
      <p className="type-label text-label mt-1.5" aria-live="polite">
        {t("label")}: {t(STRENGTH_KEYS[score])}
      </p>
    </div>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [invalidToken, setInvalidToken] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(resetSchema) });
  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = handleSubmit(async (values) => {
    setInvalidToken(false);
    const { error } = await authClient.resetPassword({ newPassword: values.password, token });
    if (error) {
      setInvalidToken(true);
      return;
    }
    router.replace("/admin/login?reset=1");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-fib-21">
      {invalidToken ? (
        <FormMessage tone="error">
          {t("reset.invalidToken")}{" "}
          <Link href="/admin/forgot-password" className="underline underline-offset-4">
            {t("reset.requestNew")}
          </Link>
        </FormMessage>
      ) : null}
      <TextField
        label={t("reset.newPassword")}
        type="password"
        autoComplete="new-password"
        dir="ltr"
        error={errors.password?.message}
        errorValues={{ min: PASSWORD_MIN, max: PASSWORD_MAX }}
        hint={<StrengthMeter password={password} />}
        {...register("password")}
      />
      <TextField
        label={t("reset.confirmPassword")}
        type="password"
        autoComplete="new-password"
        dir="ltr"
        error={errors.confirm?.message}
        {...register("confirm")}
      />
      <p className="type-body text-muted text-sm">{t("reset.signedOutNote")}</p>
      <SubmitButton pending={isSubmitting} pendingLabel={t("common.loading")}>
        {t("reset.submit")}
      </SubmitButton>
    </form>
  );
}
