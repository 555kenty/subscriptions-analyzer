"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ onFileSelect, isLoading = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setProgress(0);

      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) {
            clearInterval(progressRef.current!);
            return 90;
          }
          return p + 10;
        });
      }, 200);

      onFileSelect(file);
    },
    [onFileSelect]
  );

  // Complete progress bar when loading finishes
  if (!isLoading && progress > 0 && progress < 100) {
    setProgress(100);
    if (progressRef.current) clearInterval(progressRef.current);
  }

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label="File upload drop zone. Click or drag and drop a file to upload."
        onClick={() => !isLoading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isLoading) {
            inputRef.current?.click();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative w-full rounded-2xl border-2 border-dashed bg-white",
          "transition-all duration-200 ease-out cursor-pointer select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          isDragging
            ? "border-indigo-400 bg-indigo-50 scale-[1.01]"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50",
          isLoading ? "pointer-events-none" : "",
          "shadow-sm",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          className="sr-only"
          onChange={onInputChange}
          disabled={isLoading}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          {/* Upload icon */}
          <div
            className={[
              "flex items-center justify-center w-14 h-14 rounded-xl transition-colors duration-200",
              isDragging
                ? "bg-indigo-100 text-indigo-500"
                : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            <UploadCloud size={28} strokeWidth={1.5} aria-hidden="true" />
          </div>

          {!selectedFile ? (
            <div>
              <p className="text-sm font-medium text-slate-700">
                <span className="text-indigo-600">Click to upload</span> or drag and drop
              </p>
              <p className="mt-1 text-xs text-slate-400">CSV or PDF up to 50 MB</p>
            </div>
          ) : (
            /* Selected file pill */
            <div className="flex items-center gap-3 w-full max-w-xs bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <FileText size={20} className="shrink-0 text-indigo-500" aria-hidden="true" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                aria-label={`Remove ${selectedFile.name}`}
                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X size={14} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Loading progress bar */}
        {isLoading && (
          <div
            className="absolute bottom-0 left-0 right-0 px-6 pb-4"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Loader2
                size={13}
                className="animate-spin text-indigo-500 shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs text-slate-500 font-medium">Uploading…</span>
              <span className="ml-auto text-xs text-slate-400 tabular-nums">
                {progress}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
