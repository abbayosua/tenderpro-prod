import { NextResponse } from 'next/server';

// In-memory email log for reference (simulated)
interface SentEmail {
  id: string;
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  sentAt: string;
}

const sentEmails: SentEmail[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, template, data } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'Field "to" dan "subject" wajib diisi' },
        { status: 400 }
      );
    }

    const messageId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Log the email (simulated email sending)
    const emailEntry: SentEmail = {
      id: messageId,
      to,
      subject,
      template: template || 'default',
      data: data || {},
      sentAt: new Date().toISOString(),
    };

    sentEmails.push(emailEntry);

    // Log to console for debugging
    console.log(`📧 Email terkirim [simulasi]: ${subject} → ${to}`);

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Email berhasil dikirim (simulasi)',
    });
  } catch (error) {
    console.error('Gagal mengirim email:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengirim email' },
      { status: 500 }
    );
  }
}

// GET: View sent emails (for debugging/admin)
export async function GET() {
  return NextResponse.json({
    success: true,
    emails: sentEmails.slice(-50), // Return last 50 emails
    total: sentEmails.length,
  });
}
