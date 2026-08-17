import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = "PKBM Askara <noreply@pkbmaskara.sch.id>";

export async function sendVerificationEmail(email: string, token: string, name: string) {
  // Use absolute URL from environment or hardcode domain for now
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pkbmaskara.sch.id";
  const setupUrl = `${baseUrl}/auth/setup-password?token=${token}`;

  try {
    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Simulating email send:", { email, setupUrl });
      return { success: true, simulated: true, data: { id: "simulated_id" } };
    }

    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Konfirmasi Akun PKBM Askara - Setup Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #047857;">Selamat datang di PKBM Askara, ${name}!</h2>
          <p>Akun Anda telah berhasil dibuat. Untuk mulai menggunakan layanan portal akademik kami, silakan atur kata sandi Anda dengan mengklik tautan di bawah ini:</p>
          <a href="${setupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Setup Password Baru</a>
          <p>Atau *copy-paste* tautan berikut ke browser Anda:</p>
          <p><a href="${setupUrl}">${setupUrl}</a></p>
          <p>Tautan ini hanya berlaku untuk satu kali penggunaan.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Ini adalah email otomatis. Mohon jangan membalas pesan ini.</p>
        </div>
      `,
    });

    console.log("Resend Success:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Resend Error:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pkbmaskara.sch.id";
  const resetUrl = `${baseUrl}/auth/setup-password?token=${token}`; // we'll use the same setup page for both

  try {
    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Simulating reset email send:", { email, resetUrl });
      return { success: true, simulated: true, data: { id: "simulated_id" } };
    }

    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Permintaan Reset Password - PKBM Askara",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #047857;">Halo, ${name}</h2>
          <p>Kami menerima permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah untuk membuat kata sandi baru:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Reset Password</a>
          <p>Tautan ini akan kedaluwarsa dalam waktu 1 jam.</p>
          <p>Jika Anda tidak meminta perubahan ini, Anda dapat mengabaikan email ini.</p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Resend Reset Error:", error);
    return { success: false, error };
  }
}
