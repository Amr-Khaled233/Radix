"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFormatter, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormSection, TextInput } from "@/components/admin/fields";
import { useAction } from "@/components/admin/use-action";
import { useFieldError } from "@/components/admin/use-field-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authClient } from "@/lib/auth/client";
import { passwordSchema, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/schemas";
import { PhotoCropField } from "@/components/admin/media/photo-crop-field";
import type { MediaItem } from "@/lib/media/types";
import { updateProfile } from "./actions";

type ProfileUser = {
  name: string;
  email: string;
  image: string | null;
  preferredLocale: "en" | "ar";
  preferredTheme: "system" | "light" | "dark";
};

export function ProfileView({ user }: { user: ProfileUser }) {
  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <DetailsForm user={user} />
      <div className="space-y-6">
        <PasswordForm />
        <Sessions />
      </div>
    </div>
  );
}

function DetailsForm({ user }: { user: ProfileUser }) {
  const t = useTranslations("admin");
  const tTheme = useTranslations("theme");
  const fieldError = useFieldError();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { run, pending } = useAction();
  const [image, setImage] = useState<string | null>(user.image);
  const form = useForm<Omit<ProfileUser, "email" | "image">>({
    defaultValues: { name: user.name, preferredLocale: user.preferredLocale, preferredTheme: user.preferredTheme },
  });

  const submit = form.handleSubmit((values) =>
    run(() => updateProfile({ ...values, image }), {
      onSuccess: () => {
        setTheme(values.preferredTheme);
        form.reset(values);
        router.refresh();
      },
    }),
  );

  const imageItem: MediaItem | null = image
    ? ({ id: "profile", kind: "image", url: image, alt: { en: user.name, ar: user.name } } as MediaItem)
    : null;

  return (
    <form onSubmit={submit} noValidate>
      <FormSection title={t("profile.details")}>
        <TextInput
          label={t("profile.name")}
          error={fieldError(form.formState.errors.name)}
          {...form.register("name", { required: "required" })}
        />
        <p className="text-muted text-sm" dir="ltr">
          {user.email}
        </p>
        <PhotoCropField
          label={t("profile.photo")}
          value={imageItem}
          alt={{ en: user.name, ar: user.name }}
          onChange={(item) => setImage(item?.url ?? null)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="preferredLocale"
            render={({ field }) => (
              <div className="space-y-1.5">
                <p className="text-foreground text-sm font-semibold">{t("profile.language")}</p>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label={t("profile.language")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("locale.en")}</SelectItem>
                    <SelectItem value="ar">{t("locale.ar")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="preferredTheme"
            render={({ field }) => (
              <div className="space-y-1.5">
                <p className="text-foreground text-sm font-semibold">{t("profile.theme")}</p>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label={t("profile.theme")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["system", "light", "dark"] as const).map((theme) => (
                      <SelectItem key={theme} value={theme}>
                        {tTheme(theme)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? t("actions.saving") : t("actions.save")}
        </Button>
      </FormSection>
    </form>
  );
}

const passwordFormSchema = z
  .object({
    current: z.string().min(1, "required"),
    password: passwordSchema,
    confirm: z.string(),
    revokeOthers: z.boolean(),
  })
  .refine((v) => v.password === v.confirm, { message: "passwordMatch", path: ["confirm"] });

function PasswordForm() {
  const t = useTranslations("admin");
  const fieldError = useFieldError();
  const form = useForm<z.input<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { current: "", password: "", confirm: "", revokeOthers: true },
  });
  const errors = form.formState.errors;

  const submit = form.handleSubmit(async (values) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.current,
      newPassword: values.password,
      revokeOtherSessions: values.revokeOthers,
    });
    if (error) {
      toast.error(error.status === 429 ? t("login.rateLimited") : t("profile.wrongPassword"));
      return;
    }
    toast.success(t("profile.passwordChanged"));
    form.reset();
  });

  const lengthError = (e: { message?: string } | undefined) =>
    e?.message === "passwordMin"
      ? t("validation.passwordMin", { min: PASSWORD_MIN })
      : e?.message === "passwordMax"
        ? t("validation.passwordMax", { max: PASSWORD_MAX })
        : fieldError(e);

  return (
    <form onSubmit={submit} noValidate>
      <FormSection title={t("profile.password")}>
        <TextInput
          label={t("profile.currentPassword")}
          type="password"
          autoComplete="current-password"
          dir="ltr"
          error={fieldError(errors.current)}
          {...form.register("current")}
        />
        <TextInput
          label={t("profile.newPassword")}
          type="password"
          autoComplete="new-password"
          dir="ltr"
          error={lengthError(errors.password)}
          {...form.register("password")}
        />
        <TextInput
          label={t("profile.confirmPassword")}
          type="password"
          autoComplete="new-password"
          dir="ltr"
          error={fieldError(errors.confirm)}
          {...form.register("confirm")}
        />
        <Controller
          control={form.control}
          name="revokeOthers"
          render={({ field }) => (
            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              {t("profile.revokeOthers")}
            </label>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("actions.saving") : t("actions.save")}
        </Button>
      </FormSection>
    </form>
  );
}

type SessionRow = { id: string; token: string; userAgent?: string | null; createdAt: Date | string };

function describeAgent(agent: string | null | undefined) {
  if (!agent) return null;
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Chrome\//.test(agent)
      ? "Chrome"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Safari\//.test(agent)
          ? "Safari"
          : null;
  const os = /Windows/.test(agent)
    ? "Windows"
    : /Mac OS X/.test(agent)
      ? "macOS"
      : /Android/.test(agent)
        ? "Android"
        : /iPhone|iPad/.test(agent)
          ? "iOS"
          : /Linux/.test(agent)
            ? "Linux"
            : null;
  return [browser, os].filter(Boolean).join(" · ") || null;
}

function Sessions() {
  const t = useTranslations("admin.profile");
  const format = useFormatter();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  const load = async () => {
    const [list, current] = await Promise.all([authClient.listSessions(), authClient.getSession()]);
    setSessions((list.data as SessionRow[] | null) ?? []);
    setCurrentToken(current.data?.session.token ?? null);
  };

  useEffect(() => {
    let active = true;
    void Promise.all([authClient.listSessions(), authClient.getSession()]).then(([list, current]) => {
      if (!active) return;
      setSessions((list.data as SessionRow[] | null) ?? []);
      setCurrentToken(current.data?.session.token ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <FormSection title={t("sessions")}>
      {sessions === null ? null : (
        <ul className="divide-line border-line divide-y border">
          {sessions.map((session) => {
            const isCurrent = session.token === currentToken;
            return (
              <li key={session.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div>
                  <p className="text-foreground font-semibold">
                    {describeAgent(session.userAgent) ?? t("unknownDevice")}
                    {isCurrent ? <span className="type-label text-label ms-2">{t("thisDevice")}</span> : null}
                  </p>
                  <p className="text-muted text-xs">
                    {t("lastActive", {
                      date: format.dateTime(new Date(session.createdAt), { dateStyle: "medium", timeStyle: "short" }),
                    })}
                  </p>
                </div>
                {!isCurrent ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await authClient.revokeSession({ token: session.token });
                      await load();
                    }}
                  >
                    {t("revoke")}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {sessions && sessions.length > 1 ? (
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await authClient.revokeOtherSessions();
            toast.success(t("signedOutOthers"));
            await load();
          }}
        >
          {t("signOutOthers")}
        </Button>
      ) : null}
    </FormSection>
  );
}
