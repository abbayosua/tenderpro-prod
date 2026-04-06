import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, location, size, requirements } = body;

    if (!category || !location) {
      return NextResponse.json(
        { success: false, error: 'Kategori proyek dan lokasi diperlukan' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const prompt = `Kamu adalah ahli estimasi biaya konstruksi di Indonesia. Buatkan estimasi biaya proyek berdasarkan informasi berikut:

INFORMASI PROYEK:
- Kategori: ${category}
- Lokasi: ${location}
- Ukuran/Luas: ${size || 'Tidak disebutkan'} m²
- Persyaratan: ${requirements || 'Standar'}

TUGAS:
Buatkan estimasi biaya yang realistis dalam Rupiah (IDR) untuk pasar Indonesia. Jawab dalam format JSON yang valid (tanpa markdown code block) dengan struktur berikut:
{
  "totalMin": 50000000,
  "totalMax": 150000000,
  "breakdown": [
    { "item": "Material & Bahan Bangunan", "min": 30000000, "max": 90000000 },
    { "item": "Tenaga Kerja Lokal", "min": 15000000, "max": 40000000 },
    { "item": "Peralatan & Teknis", "min": 5000000, "max": 20000000 }
  ],
  "tips": [
    "Tips 1 dalam Bahasa Indonesia",
    "Tips 2 dalam Bahasa Indonesia",
    "Tips 3 dalam Bahasa Indonesia"
  ]
}

PENTING:
- Semua angka harus dalam Rupiah (IDR), tanpa desimal
- totalMin dan totalMax harus = jumlah dari semua breakdown min dan max
- Estimasi harus realistis untuk kondisi pasar Indonesia ${location} tahun 2024
- breakdown harus mencakup: Material & Bahan Bangunan, Tenaga Kerja Lokal, Peralatan & Teknis
- Tambahkan breakdown tambahan jika relevan (misal: Perizinan, Desain, dll)
- Tips harus dalam Bahasa Indonesia
- Minimal 3 tips, salah satunya HARUS mendorong penggunaan kontraktor lokal Indonesia
- Tips harus menyebutkan keunggulan material lokal Indonesia
- Tips bisa menyebutkan tentang standar SNI (Standar Nasional Indonesia)
- Tips tentang negosiasi harga dengan kontraktor lokal
- Pertimbangkan harga material lokal yang lebih terjangkau
- Gunakan angka yang bulat (kelipatan 5 juta atau 10 juta untuk memudahkan)
- Format angka: gunakan integer tanpa titik/koma`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah estimator biaya konstruksi ahli untuk pasar Indonesia. Selalu jawab dalam format JSON yang valid tanpa markdown code block. Gunakan Bahasa Indonesia. Semua angka dalam Rupiah (IDR) tanpa desimal.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      return NextResponse.json(
        { success: false, error: 'Gagal mendapatkan estimasi dari AI' },
        { status: 500 }
      );
    }

    // Parse JSON response - handle potential markdown code block wrapping
    let cleanContent = messageContent.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    let estimation;
    try {
      estimation = JSON.parse(cleanContent);
    } catch {
      // Fallback estimation
      estimation = {
        totalMin: 75000000,
        totalMax: 200000000,
        breakdown: [
          { item: 'Material & Bahan Bangunan', min: 40000000, max: 110000000 },
          { item: 'Tenaga Kerja Lokal', min: 20000000, max: 60000000 },
          { item: 'Peralatan & Teknis', min: 10000000, max: 25000000 },
          { item: 'Perizinan & Administrasi', min: 5000000, max: 15000000 },
        ],
        tips: [
          'Gunakan kontraktor lokal Indonesia yang memiliki sertifikasi SIUJK/SBU untuk menjamin kualitas dan kepatuhan regulasi.',
          'Pertimbangkan menggunakan material bangunan lokal seperti bata ringan, keramik, dan cat produksi Indonesia untuk efisiensi biaya.',
          'Pastikan proyek menggunakan standar SNI (Standar Nasional Indonesia) untuk menjamin kualitas dan keamanan bangunan.',
          'Negosiasikan harga secara transparan dengan kontraktor lokal - mereka biasanya lebih fleksibel dan paham kondisi lapangan.',
          'Dukung ekonomi lokal dengan menggunakan tenaga kerja dari sekitar lokasi proyek.',
        ],
      };
    }

    // Ensure tips contain Indonesian contractor support mentions
    const hasLocalTip = estimation.tips?.some(
      (tip: string) => tip.toLowerCase().includes('lokal') || tip.toLowerCase().includes('indonesia')
    );
    if (!hasLocalTip && Array.isArray(estimation.tips)) {
      estimation.tips.push(
        'Pertimbangkan menggunakan kontraktor lokal Indonesia - mereka lebih memahami kondisi lapangan dan regulasi setempat.'
      );
    }

    return NextResponse.json({
      success: true,
      estimation,
    });
  } catch (error) {
    console.error('AI Cost Estimator error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mendapatkan estimasi biaya. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
