import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface VideoUploaderProps {
  userId: string;
  onUpload: (url: string) => void;
}

export default function VideoUploader({ userId, onUpload }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        setError('Video must be under 50MB');
        return;
      }
      setError('');
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop() || 'mp4';
    const path = `${userId}/${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('proof-videos')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('proof-videos').getPublicUrl(path);
      onUpload(data.publicUrl);
    } catch (err: any) {
      if (typeof err === 'string') {
        setError(err);
      } else if (err?.message) {
        setError(err.message);
      } else if (err?.error_description) {
        setError(err.error_description);
      } else {
        setError('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  if (preview) {
    return (
      <div className="w-full flex flex-col gap-3">
        <video src={preview} controls className="w-full rounded-xl max-h-[200px] object-cover bg-black" />
        <button 
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white font-inter font-semibold py-3 rounded-xl hover:bg-[#2A2A2A] transition-colors"
        >
          {uploading ? 'Uploading...' : 'Confirm Video'}
        </button>
        {error && <div className="text-red-400 text-sm">{error}</div>}
      </div>
    );
  }

  return (
    <label className="w-full mb-6 border-2 border-dashed border-[#2A2A2A] rounded-xl flex flex-col items-center justify-center p-6 bg-[#1A1A1A] hover:border-[#00E87A] transition-colors cursor-pointer">
      <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
      <div className="text-3xl mb-2">📹</div>
      <div className="text-[#aaa] font-inter text-sm font-semibold">Upload 30s proof video</div>
      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
    </label>
  );
}
