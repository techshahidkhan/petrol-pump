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
    // Compress by drawing to canvas
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
        <div className="relative">
          <img src={preview} alt="Meter reading" className="w-full max-w-xs rounded-xl border shadow-sm" />
          <button
            onClick={clear}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
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
            className="flex-1 flex flex-col items-center gap-2 p-6 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <Camera className="w-8 h-8 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">{t("take_photo")}</span>
          </button>
          <button
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.removeAttribute("capture");
                fileRef.current.click();
              }
            }}
            className="flex-1 flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{t("upload_photo")}</span>
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
