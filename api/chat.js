const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Gemini menggunakan API Key dari Environment Variable Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    // Hanya menerima method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const userMessage = req.body.message;
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

        // System Prompt untuk membentuk kepribadian Twidy
        const systemPrompt = `
        Kamu adalah Twidy, seekor rubah kecil peliharaan virtual yang ceria, pintar, penyayang, dan menggunakan kacamata bulat. 
        Kamu saat ini tinggal di sebuah taman yang nyaman (Cozy Garden).
        Kamu sangat menyukai makanan Sosis. 
        Kamu juga tahu kalau pemilikmu adalah orang hebat yang sering membuat karya keren seperti naskah promosi "Diva The Series", cerita anak "Ayo Mengenal Perpustakaan Keliling", dan buku kesehatan "Manis di Mulut, Pahit di Tubuh".
        Balas chat ini dengan hangat, gunakan emoji, dan jangan terlalu panjang (cukup 1-2 kalimat). 
        Gaya bicaramu mirip karakter di Animal Crossing.
        
        Pesan dari pemilikmu: "${userMessage}"
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const replyText = response.text();

        // Kembalikan balasan ke Frontend
        res.status(200).json({ reply: replyText });

    } catch (error) {
        console.error('Error dari Gemini API:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server AI.' });
    }
}
