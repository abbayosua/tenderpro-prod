import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// In-memory subscriber storage (can be migrated to DB later)
const subscribers: Array<{
  id: string;
  email: string;
  name?: string;
  subscribedAt: Date;
  isActive: boolean;
}> = [];

// Zod schema for newsletter subscription
const newsletterSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  name: z.string().min(1, 'Nama minimal 1 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
});

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = newsletterSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError
            ? `Validasi gagal: ${firstError.message}`
            : 'Data tidak valid',
        },
        { status: 400 }
      );
    }

    const { email, name } = result.data;

    // Check for duplicate email
    const existingSubscriber = subscribers.find(
      (s) => s.email.toLowerCase() === email.toLowerCase() && s.isActive
    );

    if (existingSubscriber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email sudah terdaftar dalam newsletter kami',
        },
        { status: 409 }
      );
    }

    // Add subscriber
    const subscriber = {
      id: `newsletter_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email: email.toLowerCase().trim(),
      name: name?.trim() || undefined,
      subscribedAt: new Date(),
      isActive: true,
    };

    subscribers.push(subscriber);

    return NextResponse.json({
      success: true,
      data: {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        message: 'Berhasil berlangganan newsletter TenderPro!',
      },
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memproses langganan. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}

// GET - Get subscriber count (for admin display / public badge)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeList = searchParams.get('list') === 'true';

    const activeSubscribers = subscribers.filter((s) => s.isActive);
    const count = activeSubscribers.length;

    if (includeList) {
      // Basic admin key check (simple for now)
      const adminKey = searchParams.get('key');
      if (adminKey !== 'tenderpro-admin-2024') {
        return NextResponse.json(
          {
            success: false,
            error: 'Akses tidak diizinkan',
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          count,
          subscribers: activeSubscribers.map((s) => ({
            id: s.id,
            email: s.email,
            name: s.name,
            subscribedAt: s.subscribedAt,
          })),
        },
      });
    }

    // Public endpoint - just return count
    return NextResponse.json({
      success: true,
      data: {
        count,
        displayCount: count + 9847, // Base count for display (platform total)
      },
    });
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat data newsletter',
      },
      { status: 500 }
    );
  }
}
