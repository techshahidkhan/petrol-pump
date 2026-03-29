"use client";
import { useState, useRef } from "react";
import { Camera, Upload, X, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/useLanguage";

interface ImageUploadProps {
  onUpload: (dataUrl: string) => void;
  value?: string | null;
}

export default function ImageUpload({ onUpload, value }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h * maxSize) / w; w = maxSize; }
          else { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPreview(dataUrl);
        onUpload(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative inline-block animate-scale-in">
          <img src={preview} alt="Meter reading" className="w-full max-w-xs rounded-2xl border border-gray-200/50 shadow-lg" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent rounded-b-2xl" />
          <button
            onClick={clear}
            className="absolute top-2 right-2 bg-gradient-to-br from-red-500 to-rose-500 text-white rounded-full p-1.5 shadow-lg shadow-red-200/50 hover:scale-110 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-full p-1.5 shadow-lg shadow-green-200/50">
            <Check className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.setAttribute("capture", "environment");
                fileRef.current.click();
              }
            }}
            className="flex-1 flex flex-col items-center gap-2.5 p-5 border-2 border-dashed border-orange-200 rounded-2xl bg-gradient-to-br from-orange-50/50 to-amber-50/50 hover:from-orange-100/60 hover:to-amber-100/60 hover:border-orange-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200/50">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-orange-700">{t("take_photo")}</span>
          </button>
          <button
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.removeAttribute("capture");
                fileRef.current.click();
              }
            }}
            className="flex-1 flex flex-col items-center gap-2.5 p-5 border-2 border-dashed border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50/50 to-slate-50/50 hover:from-gray-100/60 hover:to-slate-100/60 hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md shadow-gray-200/50">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-600">{t("upload_photo")}</span>
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
