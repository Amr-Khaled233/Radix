import { z } from "zod";

/** Contact form (shared by the browser form and the Server Action). Messages are keys under site.contact.errors. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "name").max(120, "tooLong"),
  email: z.string().trim().toLowerCase().pipe(z.email("email")).pipe(z.string().max(200, "tooLong")),
  company: z.string().trim().max(160, "tooLong").optional().default(""),
  phone: z.string().trim().max(40, "tooLong").optional().default(""),
  categoryIds: z.array(z.uuid()).max(10).default([]),
  message: z.string().trim().min(10, "message").max(5000, "tooLong"),
  /** Honeypot: real visitors never fill this hidden field. */
  website: z.string().max(0).optional().default(""),
  locale: z.enum(["en", "ar"]),
});
export type ContactInput = z.input<typeof contactSchema>;
