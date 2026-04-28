"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

export default function MediaUploader({ 
  onUpload, 
  type = "image" 
}: { 
  onUpload: (url: string) => void;
  type?: "image" | "video";
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Client-side Supabase (gunakan ANON key, aman karena ada RLS policy)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Validasi tipe & ukuran
      const isVideo = type === "video";
      const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) throw new Error(`Ukuran file > ${isVideo ? "100MB" : "20MB"}`);

      const ext = file.name.split(".").pop();
      const safeName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const fileName = `${type}s/${Date.now()}-${Math.random().toString(36).substring(7)}-${safeName}.${ext}`;

      // Simulasi progress (Supabase SDK belum expose progress, tapi ini UX friendly)
      const interval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 300);

      const { error: uploadErr } = await supabase.storage
        .from("uploads")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      clearInterval(interval);
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
      setProgress(100);
      onUpload(data.publicUrl);
    } catch (err: any) {
      setError(err.message || "Upload gagal");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={type === "image" ? "image/*" : "video/*"}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={uploading}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-3 px-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
      >
        {uploading ? `⏳ Mengupload... ${progress}%` : `📁 Pilih ${type === "image" ? "Gambar" : "Video"}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">❌ {error}</p>}
    </div>
  );
}