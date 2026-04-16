import { Resend } from "resend";
import type { EmailProvider } from "../emailProvider";
import { RESEND_API_KEY } from "@/lib/core/env";

export const resendEmailProvider: EmailProvider = {
  async sendPasswordReset(to, resetLink) {
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set, skipping email sending");
      return;
    }

    const resend = new Resend(RESEND_API_KEY!);

    const { error } = await resend.emails.send({
      from: "Authentication App <no-reply@resend.dev>",
      to,
      subject: "Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click here to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    if (error) {
      console.error("Failed to send password reset email via Resend", error);
      throw error;
    }
  },
};
