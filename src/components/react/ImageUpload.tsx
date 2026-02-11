import { useState, useCallback, useId } from 'react';
import { MAX_IMAGES_PER_SECTION } from '../../config/constants';

interface ImageFile {
  file: File;
  preview: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUpload({ images, onChange, maxImages = MAX_IMAGES_PER_SECTION, disabled = false }: ImageUploadProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || disabled) return;

      const newImages: ImageFile[] = [];
      const remainingSlots = maxImages - images.length;

      Array.from(files)
        .slice(0, remainingSlots)
        .forEach((file) => {
          if (file.type.startsWith('image/')) {
            const preview = URL.createObjectURL(file);
            newImages.push({ file, preview });
          }
        });

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    },
    [images, onChange, maxImages, disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback(
    (index: number) => {
      const newImages = [...images];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      onChange(newImages);
    },
    [images, onChange]
  );

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
          `}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id={inputId}
            disabled={disabled}
          />
          <label
            htmlFor={inputId}
            className={`block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-slate-500">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm">
                <span className="font-medium text-slate-700">Drop screenshots here</span> or click to upload
              </p>
              <p className="mt-1 text-xs text-slate-400">
                PNG, JPG, or WebP (max {maxImages} images)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img.preview}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-slate-200"
              />
              {!disabled && (
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                  type="button"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {images.length} of {maxImages} images uploaded
        </p>
      )}
    </div>
  );
}
