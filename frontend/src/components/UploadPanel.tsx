import React, { useCallback, useRef, useState } from 'react';

interface Props {
  onUpload: (file1: File, file2: File) => void;
  disabled: boolean;
}

export default function UploadPanel({ onUpload, disabled }: Props) {
  const [files, setFiles] = useState<{ file1: File | null; file2: File | null }>({
    file1: null,
    file2: null,
  });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith('.las') || f.name.endsWith('.laz')
      );
      if (dropped.length >= 2) {
        setFiles({ file1: dropped[0], file2: dropped[1] });
      } else if (dropped.length === 1) {
        if (!files.file1) setFiles({ ...files, file1: dropped[0] });
        else setFiles({ ...files, file2: dropped[0] });
      }
    },
    [files]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length >= 2) {
      setFiles({ file1: selected[0], file2: selected[1] });
    } else if (selected.length === 1) {
      if (!files.file1) setFiles({ ...files, file1: selected[0] });
      else setFiles({ ...files, file2: selected[0] });
    }
  };

  const handleSubmit = () => {
    if (files.file1 && files.file2) {
      onUpload(files.file1, files.file2);
    }
  };

  return (
    <div className="upload-panel">
      <h2>Upload Point Clouds</h2>
      <p className="upload-subtitle">
        Select two LAS or LAZ files to compare elevation changes between epochs.
      </p>
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".las,.laz"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <svg className="drop-zone-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p>Drop two files here or click to browse</p>
      </div>
      <div className="file-list">
        <div className="file-item">
          <span className="file-label">Epoch 1</span>
          <span className={`file-name ${files.file1 ? 'selected' : ''}`}>
            {files.file1?.name || 'No file selected'}
          </span>
        </div>
        <div className="file-item">
          <span className="file-label">Epoch 2</span>
          <span className={`file-name ${files.file2 ? 'selected' : ''}`}>
            {files.file2?.name || 'No file selected'}
          </span>
        </div>
      </div>
      <button
        className="upload-btn"
        onClick={handleSubmit}
        disabled={!files.file1 || !files.file2 || disabled}
      >
        {disabled ? 'Processing...' : 'Begin Analysis'}
      </button>
    </div>
  );
}
