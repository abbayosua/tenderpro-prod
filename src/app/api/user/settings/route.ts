import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── In-Memory Settings Store ───────────────────────────────────────────────
// Settings keyed by userId since we can't add columns to the DB easily.
// This is a server-side Map; data persists only while the process is running.

const settingsStore = new Map<string, UserSettings>();

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'id' | 'en';
  currency: 'IDR';
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  theme: 'system',
  language: 'id',
  currency: 'IDR',
};

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const notificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
});

const updateSettingsSchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
  notifications: notificationSettingsSchema.optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['id', 'en']).optional(),
  currency: z.literal('IDR').optional(),
});

const profileUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email('Format email tidak valid').optional(),
  phone: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

// ─── GET — Fetch user settings + profile ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID wajib diisi' },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        verificationStatus: true,
        contractor: {
          select: {
            companyName: true,
            companyType: true,
            specialization: true,
            city: true,
            province: true,
            description: true,
          },
        },
        owner: {
          select: {
            companyName: true,
            companyType: true,
            city: true,
            province: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 },
      );
    }

    // Return stored settings or defaults
    const settings = settingsStore.get(userId) ?? { ...DEFAULT_SETTINGS };

    return NextResponse.json({
      success: true,
      data: {
        user,
        settings,
      },
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pengaturan' },
      { status: 500 },
    );
  }
}

// ─── PUT — Update user settings ───────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const { userId, ...updateFields } = parsed.data;

    // Verify user exists
    const existingUser = await db.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 },
      );
    }

    // Get current settings (or defaults)
    const currentSettings = settingsStore.get(userId)
      ? { ...settingsStore.get(userId)! }
      : { ...DEFAULT_SETTINGS };

    // Merge notification settings
    if (updateFields.notifications) {
      currentSettings.notifications = {
        ...currentSettings.notifications,
        ...updateFields.notifications,
      };
    }

    // Update other fields
    if (updateFields.theme) currentSettings.theme = updateFields.theme;
    if (updateFields.language) currentSettings.language = updateFields.language;
    if (updateFields.currency) currentSettings.currency = updateFields.currency;

    // Store back
    settingsStore.set(userId, currentSettings);

    return NextResponse.json({
      success: true,
      data: {
        settings: currentSettings,
      },
      message: 'Pengaturan berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui pengaturan' },
      { status: 500 },
    );
  }
}

// ─── PATCH — Update user profile only ─────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const { userId, ...profileData } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 },
      );
    }

    // Check email uniqueness if changing
    if (profileData.email && profileData.email !== existingUser.email) {
      const emailExists = await db.user.findFirst({
        where: { email: profileData.email, NOT: { id: userId } },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email sudah digunakan' },
          { status: 400 },
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: profileData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
      },
      message: 'Profil berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui profil' },
      { status: 500 },
    );
  }
}
