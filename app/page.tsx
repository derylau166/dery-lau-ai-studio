'use client';
import React, { useState, FormEvent } from 'react';

// --- Definisi Pilihan ---
// Mapping Model yang Tampil di UI ke kode URL API
const modelMap: { [key: string]: string } = {
  'Seedream': 'seedream',
  'Nanobanana': 'nanobanana',
  'Imagen 4': 'imagen-4',
  'Flux': 'flux',
  'Dall-E5': 'dall-e5',
};

// Mapping Aspek Rasio yang Tampil di UI ke nilai Dimensi (Width:Height)
const ratioOptions: { [key: string]: { width: number, height: number } } = {
  'Square 1:1 (1024x1024)': { width: 1024, height: 1024 },
  'Portrait 9:16 (576x1024)': { width: 576, height: 1024 },
  'Landscape 16:9 (1024x576)': { width: 1024, height: 576 },
};

// Prompt dasar yang akan kita gunakan untuk uji coba
const defaultPrompt = 'a futuristic robot in a neon city, highly detailed';

export default function ImageGenerator() {
  // --- States ---
  const [model, setModel] = useState(Object.keys(modelMap)[0]);
  const [aspectRatio, setAspectRatio] = useState(Object.keys(ratioOptions)[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const baseURL = 'https://image.pollinations.ai/prompt/';

  // --- Fungsi Generator Gambar ---
  const generateImage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setImageUrl(''); // Hapus gambar lama saat proses dimulai

    // 1. Tentukan Dimensi dan Model
    const selectedRatio = ratioOptions[aspectRatio];
    const modelCode = modelMap[model];

    // 2. Encode Prompt
    const encodedPrompt = encodeURIComponent(defaultPrompt);
    
    // 3. Gabungkan semua parameter ke dalam URL
    // Kita gunakan waktu saat ini sebagai seed untuk memastikan URL unik setiap kali di-generate
    const seed = Date.now(); 
    
    const finalUrl = `${baseURL}${encodedPrompt}?width=${selectedRatio.width}&height=${selectedRatio.height}&model=${modelCode}&quality=hd&enhance=true&nologo=true&private=false&seed=${seed}`;

    // Pollinations AI terkadang lambat memuat gambar pertama kali. 
    // Kita berikan sedikit delay untuk memastikan loading state terlihat (opsional)
    setTimeout(() => {
        setImageUrl(finalUrl);
        setIsLoading(false);
    }, 1000); 
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-800">DERY LAU AI STUDIO (Dasar)</h1>
      
      {/* Formulir Generator */}
      <form onSubmit={generateImage} className="bg-white p-6 rounded-lg shadow-xl space-y-4">
        
        {/* Pilihan Model AI */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model AI</label>
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
          <label htmlFor="ratio" className="block text-sm font-medium text-gray-700">Aspek Rasio</label>
          <select
            id="ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-white"
          >
            {Object.keys(ratioOptions).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Tombol Generate */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
            isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        >
          {isLoading ? 'Sedang Memproses...' : 'Generate Gambar'}
        </button>
      </form>

      ---

      {/* Bagian Tampilan Gambar */}
      <div className="mt-10 text-center p-4 bg-gray-50 rounded-lg shadow-inner min-h-64 flex flex-col justify-center items-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Hasil</h2>
        
        {/* Loading State */}
        {isLoading && (
            <p className="text-gray-500">Menunggu gambar dari Pollinations AI...</p>
        )}

        {/* Tampilan Gambar */}
        {imageUrl && !isLoading && (
            <>
                <div className="relative inline-block border-4 border-gray-200 shadow-2xl rounded-lg overflow-hidden">
                    <img 
                        src={imageUrl} 
                        alt="Generated AI Image" 
                        className="mx-auto block object-contain max-w-full"
                        style={{ maxHeight: '500px' }} // Batasi tinggi agar tidak terlalu besar di layar
                    />
                </div>
                <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download="dery_lau_ai_image.png"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                    Klik untuk Download Gambar
                </a>
            </>
        )}
        
        {/* Pesan Awal */}
        {!imageUrl && !isLoading && (
             <p className="text-gray-500 italic">Pilih model dan rasio, lalu klik "Generate Gambar" di atas.</p>
        )}
      </div>
    </div>
  );
}