import { useEffect, useMemo, useState } from "react";
import { Button, useToast } from "@lh/shared";
import FileDropZone from "./FileDropZone";
import VideoRecorder from "./VideoRecorder";
import VideoPlayer from "./VideoPlayer";
import { publicServices } from "../lib/public-services";
import { compressImage, convertHeicToJpeg } from "../lib/image-utils";

function formatMb(mb) {
  return `${Number(mb || 0)}MB`;
}

function formatAcceptedTypes(fileTypes) {
  return String(fileTypes || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function statusTone(status) {
  if (status === "approved") return "text-green-700 bg-green-100";
  if (status === "rejected") return "text-red-700 bg-red-100";
  if (status === "pending") return "text-amber-700 bg-amber-100";
  if (status === "uploading") return "text-blue-700 bg-blue-100";
  return "text-gray-700 bg-gray-100";
}

function waitForOnline() {
  if (navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => {
    const onOnline = () => {
      window.removeEventListener("online", onOnline);
      resolve();
    };
    window.addEventListener("online", onOnline);
  });
}

function uploadToS3(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress(progress);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

const DocumentUploadCard = ({ requirement, submission, onUploadComplete, onDelete, currentStage }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [openVideoPlayer, setOpenVideoPlayer] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const [sizeInfo, setSizeInfo] = useState(null);
  const [retryInfo, setRetryInfo] = useState(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isUnderReview = currentStage === "documents_under_review";
  const isLocked = submission?.status === "approved";
  const isVideoRequirement = requirement?.code === "vehicle_video";
  const acceptedTypes = useMemo(() => {
    return String(requirement?.fileTypes || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .join(",");
  }, [requirement?.fileTypes]);

  const validateFile = (file) => {
    if (!file) return "No file selected.";
    const allowed = String(requirement?.fileTypes || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (allowed.length && !allowed.includes(String(file.type || "").toLowerCase())) {
      return "File type is not allowed for this requirement.";
    }

    const maxBytes = Number(requirement?.maxSizeMb || 0) * 1024 * 1024;
    if (maxBytes > 0 && file.size > maxBytes) {
      return `File exceeds ${requirement.maxSizeMb}MB limit.`;
    }
    return null;
  };

  const handleUpload = async (file, durationSec = null) => {
    const originalSize = file.size;
    let uploadFile = file;
    if (String(file.type || "").startsWith("image/")) {
      try {
        uploadFile = await convertHeicToJpeg(uploadFile);
        uploadFile = await compressImage(uploadFile, { maxWidth: 2048, maxHeight: 2048, quality: 0.85 });
        setSizeInfo({
          originalBytes: originalSize,
          compressedBytes: uploadFile.size,
        });
      } catch {
        setSizeInfo(null);
      }
    } else {
      setSizeInfo(null);
    }

    const validationError = validateFile(uploadFile);
    if (validationError) {
      toast({ title: "Invalid file", description: validationError, variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const payload = {
        requirementCode: requirement.code,
        fileName: uploadFile.name,
        fileType: uploadFile.type,
        fileSizeBytes: uploadFile.size,
      };
      const uploadResult =
        submission?.status === "rejected" && submission?.id
          ? await publicServices.requestDocumentReuploadUrl(submission.id, payload)
          : await publicServices.requestDocumentUploadUrl(payload);

      let lastError = null;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          if (!navigator.onLine) {
            setRetryInfo("Waiting for connection...");
            await waitForOnline();
            setRetryInfo(`Connection restored. Retrying (${attempt}/${maxRetries})...`);
          } else if (attempt > 1) {
            setRetryInfo(`Retrying upload (${attempt}/${maxRetries})...`);
          } else {
            setRetryInfo(null);
          }
          await uploadToS3(uploadResult.uploadUrl, uploadFile, setUploadProgress);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) throw lastError;

      await publicServices.confirmDocumentUpload(uploadResult.documentId, durationSec);

      if (String(uploadFile.type || "").startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(uploadFile));
      } else {
        setPreviewUrl("");
      }

      toast({ title: "Upload complete", description: `${requirement.name} uploaded successfully.` });
      await onUploadComplete?.();
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Upload failed. Check your connection and retry.",
        variant: "destructive",
      });
    } finally {
      setRetryInfo(null);
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-brand-shadeBlue">{requirement.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatAcceptedTypes(requirement.fileTypes)} - Max {formatMb(requirement.maxSizeMb)}
          </p>
          {requirement.maxDurationSec ? (
            <p className="text-xs text-gray-500">Max duration: {requirement.maxDurationSec} seconds</p>
          ) : null}
        </div>
        {requirement.isRequired ? (
          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">Required</span>
        ) : (
          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-500">Optional</span>
        )}
      </div>

      <div className="mt-4">
        {!submission ? (
          isUnderReview ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              This document is currently read-only while your submission is under review.
            </div>
          ) : (
          isVideoRequirement ? (
            <VideoRecorder
              maxDurationSec={Number(requirement.maxDurationSec || 120)}
              minDurationSec={30}
              onUseVideo={handleUpload}
            />
          ) : (
            <FileDropZone accept={acceptedTypes} disabled={uploading || isLocked} onFileSelected={handleUpload} />
          ))
        ) : (
          <div className="rounded-lg border p-3 bg-gray-50">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-800 truncate">{submission.fileName}</p>
              <span className={`text-xs px-2 py-1 rounded ${statusTone(submission.status)}`}>
                {submission.status}
              </span>
            </div>

            {previewUrl && !isVideoRequirement ? (
              <img
                src={previewUrl}
                alt={submission.fileName}
                loading="lazy"
                className="mt-3 w-28 h-28 object-cover rounded border"
              />
            ) : null}
            {isVideoRequirement ? (
              <div className="mt-2 text-xs text-gray-600">
                {submission.durationSec ? `Duration: ${submission.durationSec}s` : "Video uploaded"}
              </div>
            ) : null}
            {submission.status === "rejected" ? (
              <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                <p className="font-semibold">Rejected</p>
                <p>{submission.reviewerNotes || "Please re-upload this document."}</p>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                disabled={uploading || isLocked || (isUnderReview && submission.status !== "rejected")}
                onClick={() => {
                  if (isVideoRequirement) {
                    setOpenVideoPlayer(false);
                    setVideoSrc("");
                    onDelete?.(submission.id).then?.(() => {
                      toast({ title: "Ready to record", description: "Please record a fresh vehicle video." });
                    });
                    return;
                  }
                  const fileInput = document.createElement("input");
                  fileInput.type = "file";
                  fileInput.accept = acceptedTypes;
                  fileInput.onchange = (event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUpload(file);
                  };
                  fileInput.click();
                }}
              >
                Replace
              </Button>
              <Button
                variant="outline"
                disabled={uploading || isLocked || (isUnderReview && submission.status !== "rejected")}
                onClick={() => onDelete?.(submission.id)}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const result = await publicServices.getDriverDocumentDownloadUrl(submission.id);
                    if (result?.downloadUrl) {
                      if (isVideoRequirement) {
                        setVideoSrc(result.downloadUrl);
                        setOpenVideoPlayer(true);
                      } else {
                        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
                      }
                    }
                  } catch (error) {
                    toast({
                      title: "Unable to open file",
                      description: error?.response?.data?.message || "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {isVideoRequirement ? "Play" : "View"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {uploading ? (
        <div className="mt-3">
          <div className="h-2 rounded bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-brand-blue transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
          {retryInfo ? <p className="text-xs text-amber-700 mt-1">{retryInfo}</p> : null}
        </div>
      ) : null}
      {sizeInfo ? (
        <p className="mt-2 text-xs text-gray-600">
          Compressed image: {(sizeInfo.originalBytes / (1024 * 1024)).toFixed(2)}MB {"->"}{" "}
          {(sizeInfo.compressedBytes / (1024 * 1024)).toFixed(2)}MB
        </p>
      ) : null}
      {isOffline ? <p className="mt-2 text-xs text-amber-700">Offline: uploads will wait for connection.</p> : null}
      {isUnderReview && submission && submission.status !== "rejected" ? (
        <p className="mt-2 text-xs text-gray-500">Read-only while under review.</p>
      ) : null}
      {openVideoPlayer && videoSrc ? <VideoPlayer src={videoSrc} onClose={() => setOpenVideoPlayer(false)} /> : null}
    </div>
  );
};

export default DocumentUploadCard;
