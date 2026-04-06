import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      contractorId,
      projectBudget,
      projectDescription,
      projectRequirements,
      contractorExperience,
    } = body;

    if (!projectId || !contractorId || !projectBudget) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap. Project ID, Contractor ID, dan budget proyek diperlukan.' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const prompt = `Kamu adalah asisten AI ahli di bidang tender dan konstruksi di Indonesia. Seorang kontraktor lokal Indonesia meminta rekomendasi untuk mengajukan penawaran (bid) pada sebuah proyek.

INFORMASI PROYEK:
- Budget Proyek: Rp ${new Intl.NumberFormat('id-ID').format(projectBudget)}
- Deskripsi: ${projectDescription || 'Tidak tersedia'}
- Persyaratan: ${projectRequirements || 'Tidak tersedia'}

INFORMASI KONTRAKTOR:
- Pengalaman: ${contractorExperience || 'Tidak tersedia'} tahun

TUGAS:
Buatkan rekomendasi penawaran yang komprehensif dalam Bahasa Indonesia. Jawab dalam format JSON yang valid (tanpa markdown code block) dengan struktur berikut:
{
  "suggestedPrice": "Rp X - Rp Y (range harga yang kompetitif, biasanya 85-95% dari budget proyek)",
  "suggestedDuration": "Z hari (estimasi durasi yang realistis)",
  "proposalTemplate": "Template proposal yang profesional dan meyakinkan dalam Bahasa Indonesia, minimal 3 paragraf yang mencakup: pendahuluan, penawaran solusi, dan komitmen kerja",
  "keyPoints": [
    "Poin keunggulan 1 untuk kontraktor Indonesia",
    "Poin keunggulan 2",
    "Poin keunggulan 3",
    "Poin keunggulan 4",
    "Poin keunggulan 5"
  ]
}

TIPS PENTING - Sertakan dalam keyPoints:
- Keunggulan memahami regulasi konstruksi Indonesia (SNI, IMB/PBG, dll)
- Akses ke material dan tenaga kerja lokal dengan harga kompetitif
- Kemampuan berkoordinasi dengan pemerintah daerah setempat
- Pemahaman budaya kerja dan komunikasi lokal
- Fleksibilitas dalam adaptasi terhadap kondisi lapangan
- Keunggulan jaringan supplier lokal
- Tips untuk bersaing dengan pekerja asing (TKA)

Pastikan harga yang disarankan kompetitif namun tetap menguntungkan. Durasi harus realistis dan profesional.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah asisten AI TenderPro yang ahli dalam bidang tender dan konstruksi Indonesia. Selalu jawab dalam format JSON yang valid tanpa markdown code block. Gunakan Bahasa Indonesia.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      return NextResponse.json(
        { success: false, error: 'Gagal mendapatkan rekomendasi dari AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response - handle potential markdown code block wrapping
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

    let recommendation;
    try {
      recommendation = JSON.parse(cleanContent);
    } catch {
      // If JSON parsing fails, create a structured response from the raw text
      recommendation = {
        suggestedPrice: `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(projectBudget * 0.85))} - Rp ${new Intl.NumberFormat('id-ID').format(Math.round(projectBudget * 0.95))}`,
        suggestedDuration: `${Math.max(30, Math.round(projectBudget / 100000))} hari`,
        proposalTemplate: cleanContent,
        keyPoints: [
          'Paham regulasi konstruksi Indonesia (SNI, PBG, dll)',
          'Akses material dan tenaga kerja lokal dengan harga kompetitif',
          'Kemampuan koordinasi dengan pemerintah daerah',
          'Pemahaman budaya kerja dan komunikasi lokal',
          'Fleksibilitas adaptasi kondisi lapangan',
        ],
      };
    }

    return NextResponse.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error('AI Bid Assistant error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mendapatkan rekomendasi AI. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
