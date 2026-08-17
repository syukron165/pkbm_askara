import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = "PKBM Askara <noreply@pkbmaskara.sch.id>";

export async function sendVerificationEmail(email: string, token: string, name: string) {
  // Use absolute URL from environment or hardcode domain for now
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pkbmaskara.sch.id";
  const setupUrl = `${baseUrl}/setup-password?token=${token}`;

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
  const resetUrl = `${baseUrl}/setup-password?token=${token}`; // we'll use the same setup page for both

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

export async function sendRegistrationStatusEmail(
  email: string,
  name: string,
  status: "APPROVED" | "REVISION" | "REJECTED",
  note: string
) {
  try {
    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Simulating registration status email send:", { email, status, note });
      return { success: true, simulated: true, data: { id: "simulated_id" } };
    }

    const statusMap = {
      APPROVED: {
        title: "Pendaftaran Disetujui",
        color: "#047857",
        message: "Selamat! Pendaftaran Anda di PKBM Askara telah disetujui."
      },
      REVISION: {
        title: "Pendaftaran Perlu Revisi",
        color: "#2563eb",
        message: "Pendaftaran Anda memerlukan revisi. Mohon perbaiki data/berkas Anda."
      },
      REJECTED: {
        title: "Pendaftaran Ditolak",
        color: "#e11d48",
        message: "Mohon maaf, pendaftaran Anda tidak dapat kami terima saat ini."
      }
    };

    const config = statusMap[status];

    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Informasi Status Pendaftaran PKBM Askara - ${config.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: ${config.color};">${config.title}</h2>
          <p>Yth. ${name},</p>
          <p>${config.message}</p>
          ${note ? `
            <div style="background-color: #f8fafc; border-left: 4px solid ${config.color}; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Catatan dari Admin:</p>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${note}</p>
            </div>
          ` : ""}
          <p>Terima kasih atas perhatian Anda.</p>
          <br/>
          <p>Salam,</p>
          <p><strong>Panitia PMB PKBM Askara</strong></p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Ini adalah email otomatis. Mohon jangan membalas pesan ini.</p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Resend Registration Status Error:", error);
    return { success: false, error };
  }
}

export async function sendAttendanceEmail(
  email: string,
  parentName: string,
  studentName: string,
  className: string,
  status: string,
  time: string,
  sessionTitle?: string
) {
  try {
    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Simulating attendance email send:", { email, studentName, status, time });
      return { success: true, simulated: true, data: { id: "simulated_id" } };
    }

    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Laporan Kehadiran - ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #047857;">Laporan Kehadiran PKBM Askara</h2>
          <p>Yth. Bapak/Ibu <strong>${parentName}</strong>,</p>
          <p>Berikut adalah informasi kehadiran putra/putri Anda hari ini:</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #047857; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Nama Siswa:</strong> ${studentName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Kelas/Paket:</strong> ${className}</p>
            ${sessionTitle ? `<p style="margin: 5px 0 0 0;"><strong>Sesi/Mata Pelajaran:</strong> ${sessionTitle}</p>` : ''}
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> <span style="font-weight: bold; color: ${status === 'HADIR' ? '#047857' : '#e11d48'}">${status}</span></p>
            <p style="margin: 5px 0 0 0;"><strong>Waktu Tercatat:</strong> ${time}</p>
          </div>
          <p>Terima kasih atas perhatian Anda.</p>
          <br/>
          <p>Salam,</p>
          <p><strong>Admin PKBM Askara</strong></p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Ini adalah email otomatis. Mohon jangan membalas pesan ini.</p>
        </div>
      `,
    });

    console.log("Resend Attendance Success:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Resend Attendance Error:", error);
    return { success: false, error };
  }
}
