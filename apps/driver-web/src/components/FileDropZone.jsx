import { useRef, useState } from "react";
import { Button } from "@lh/shared";

const FileDropZone = ({ accept, disabled = false, onFileSelected }) => {
  const inputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const pickFile = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const pickCamera = () => {
    if (disabled) return;
    cameraInputRef.current?.click();
  };

  const handleFiles = (fileList) => {
    if (!fileList || !fileList.length || disabled) return;
    const [file] = fileList;
    onFileSelected?.(file);
  };

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-4 text-center transition ${
        isDragActive ? "border-brand-blue bg-blue-50" : "border-gray-300"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-brand-blue"}`}
      onClick={pickFile}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        handleFiles(event.dataTransfer?.files);
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pickFile();
        }
      }}
    >
      <p className="text-sm text-gray-700">
        {isDragActive ? "Drop file here" : "Click to upload or drag and drop"}
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <Button variant="outline" onClick={(event) => event.preventDefault()} disabled={disabled}>
          Choose File
        </Button>
        <Button
          variant="outline"
          onClick={(event) => {
            event.preventDefault();
            pickCamera();
          }}
          disabled={disabled}
        >
          Use Camera
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
};

export default FileDropZone;
