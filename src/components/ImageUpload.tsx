import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  loading?: boolean;
}

export function ImageUpload({ onUpload, loading = false }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl transition-all ${
          dragActive
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-slate-600 bg-slate-900/30'
        } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />

        {!preview ? (
          <div
            onClick={handleButtonClick}
            className="flex flex-col items-center justify-center py-12 px-6 cursor-pointer hover:bg-slate-800/30 transition-colors rounded-xl"
          >
            <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl mb-4">
              <Upload className="text-cyan-400" size={32} />
            </div>
            <p className="text-lg font-medium text-slate-200 mb-2">
              Drop image here or click to upload
            </p>
            <p className="text-sm text-slate-400">
              Supports: JPG, PNG, GIF, WebP (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="relative rounded-lg overflow-hidden bg-slate-800/50">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain"
              />
              {!loading && (
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 p-2 bg-red-600/90 hover:bg-red-600 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedFile && !loading && (
        <button
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30 text-lg"
        >
          <ImageIcon size={22} />
          Extract Text from Image
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="animate-spin text-cyan-400" size={24} />
          <span className="text-slate-300 font-medium">Processing image...</span>
        </div>
      )}
    </div>
  );
}
