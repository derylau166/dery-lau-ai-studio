'use client';
import React, { useState, FormEvent } from 'react';

// --- Definisi Pilihan ---
const styles = ['Photorealitis', 'Digital Art', 'Anime', 'Psychadelic', 'Macabre', 'Surrealism', 'Chaotic'];

// DIUBAH: Mengganti Seedream dan Nanobanana dengan model yang lebih stabil atau umum.
// Catatan: Nama model ini mungkin perlu disesuaikan jika API Pollinations punya nama spesifik lain.
const modelMap: { [key: string]: string } = {
  'Stable Diffusion XL': 'stable-diffusion-xl', 
  'Imagen 4 (Alternative)': 'imagen-4', 
  'Flux (Fast)': 'flux',
  'Dall-E5 (Hypothetical)': 'dall-e5',
  'Kandinsky 3.0': 'kandinsky-3-0',
};

const ratioOptions: { [key: string]: { width: number, height: number } } = {
  'Square 1:1 (1024x1024)': { width: 1024, height: 1024 },
  'Portrait 9:16 (576x1024)': { width: 576, height: 1024 },
  'Landscape 16:9 (1024x576)': { width: 1024, height: 576 },
};

export default function ImageGenerator() {
  // --- States ---
  const [prompt, setPrompt] = useState('a futuristic robot in a neon city, highly detailed');
  const [style, setStyle] = useState(styles[0]);
  const [model, setModel] = useState(Object.keys(modelMap)[0]);
  const [aspectRatio, setAspectRatio] = useState(Object.keys(ratioOptions)[0]);
  
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const baseURL = 'https://image.pollinations.ai/prompt/';

  // --- Fungsi Generator Gambar ---
  const generateImage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt.trim()) {
        alert("Prompt tidak boleh kosong!");
        return;
    }

    // 1. Tentukan Parameter
    const selectedRatio = ratioOptions[aspectRatio];
    const modelCode = modelMap[model];

    // 2. Gabungkan Prompt dan Style
    const fullPrompt = `${prompt}, in a ${style} style, high quality, 4k`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    
    // 3. Gabungkan semua parameter ke dalam URL
    const seed = Math.floor(Math.random() * 999999); 
    const cacheBuster = Date.now(); 
    
    // URL API Pollinations
    const apiURL = `${baseURL}${encodedPrompt}?width=${selectedRatio.width}&height=${selectedRatio.height}&model=${modelCode}&quality=hd&enhance=true&nologo=true&private=false&seed=${seed}`;

    // URL yang akan ditampilkan di elemen <img> (dengan cacheBuster)
    const finalDisplayURL = `${apiURL}&cb=${cacheBuster}`; 

    // Mulai proses
    setIsLoading(true);
    setImageUrl(''); 
    
    // Langsung set URL gambar ke state
    setImageUrl(finalDisplayURL); 
  };

  // Fungsi untuk menangani saat gambar selesai dimuat (atau gagal)
  const handleImageLoad = () => {
    // Matikan status loading setelah gambar berhasil dimuat browser
    setIsLoading(false);
  }
  
  const handleImageError = () => {
    // Matikan status loading jika gambar gagal dimuat
    setIsLoading(false);
    console.error("Gagal memuat gambar. Coba ganti prompt atau Model AI.");
    alert("Gagal memuat gambar dari Pollinations AI. Coba ganti Model AI lain karena model saat ini mungkin tidak aktif.");
  }


  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-800">DERY LAU AI STUDIO</h1>
      
      <form onSubmit={generateImage} className="bg-white p-6 rounded-lg shadow-xl space-y-6">
        
        {/* Input Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">1. Prompt Gambar (Deskripsi)</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={3}
            placeholder="Masukkan deskripsi gambar yang Anda inginkan..."
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Pilihan Style */}
        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700">2. Pilihan Style</label>
          <select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-white"
          >
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pilihan Model AI (Sudah Diperbarui) */}
            <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">3. Model AI</label>
            <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-white"
            >
                {Object.keys(modelMap).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            </div>

            {/* Pilihan Aspek Rasio */}
            <div>
            <label htmlFor="ratio" className="block text-sm font-medium text-gray-700">4. Aspek Rasio</label>
            <select
                id="ratio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-white"
            >
                {Object.keys(ratioOptions).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            </div>
        </div>
        
        {/* Tombol Generate */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white transition duration-150 ease-in-out ${
            isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        >
          {isLoading ? 'Sabar ya lagi nungguin aku (Mungkin ngopi dulu yuk)' : 'Generate Gambar AI'}
        </button>
      </form>

      ---

      {/* Bagian Tampilan Gambar */}
      <div className="mt-10 text-center p-4 bg-gray-50 rounded-lg shadow-inner min-h-64 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Hasil Generator</h2>
        
        {/* Loading State */}
        {isLoading && (
            <div className="p-10 bg-gray-200 rounded-lg w-full max-w-sm h-64 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-600 font-medium">AI sedang bekerja keras...</p>
                <p className="text-sm text-gray-500 mt-1">Gunakan model 'Flux' untuk hasil tercepat.</p>
            </div>
        )}

        {/* Tampilan Gambar */}
        {imageUrl && (
            <div 
                key={imageUrl} 
                className="w-full"
            >
                <div className="relative inline-block border-4 border-gray-200 shadow-2xl rounded-lg overflow-hidden">
                    <img 
                        src={imageUrl} 
                        alt={`Generated AI Image: ${prompt}`} 
                        className="mx-auto block object-contain max-w-full"
                        style={{ maxHeight: '600px' }}
                        onLoad={handleImageLoad} 
                        onError={handleImageError} 
                    />
                </div>
                <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download="dery_lau_ai_image.png"
                    className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition"
                >
                    Download Gambar (.png)
                </a>
            </div>
        )}
        
        {/* Pesan Awal */}
        {!imageUrl && !isLoading && (
             <p className="text-gray-500 italic">Masukkan prompt dan atur parameter untuk memulai.</p>
        )}
      </div>
    </div>
  );
}