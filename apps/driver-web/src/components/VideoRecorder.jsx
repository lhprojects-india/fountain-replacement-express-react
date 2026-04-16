import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@lh/shared";

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const VideoRecorder = ({ maxDurationSec = 120, minDurationSec = 30, onUseVideo }) => {
  const [facingMode, setFacingMode] = useState("environment");
  const [permissionError, setPermissionError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [unsupported, setUnsupported] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const warning = isRecording && elapsed >= maxDurationSec - 30;
  const progress = Math.min(100, Math.round((elapsed / maxDurationSec) * 100));
  const canUse = recordedBlob && elapsed >= minDurationSec;

  const recorderMimeType = useMemo(() => {
    if (typeof MediaRecorder === "undefined") return "";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) return "video/webm;codecs=vp9";
    if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
    if (MediaRecorder.isTypeSupported("video/mp4")) return "video/mp4";
    return "";
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const initializeCamera = async (mode = facingMode) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError("Camera is not supported on this device.");
      return;
    }
    try {
      setPermissionError("");
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsReady(true);
    } catch (error) {
      setIsReady(false);
      setPermissionError("Camera permission denied. You can use your camera app fallback below.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await initializeCamera();
    }
    if (!streamRef.current) return;
    if (typeof MediaRecorder === "undefined" || !recorderMimeType) {
      setUnsupported(true);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startAfter = prefersReduced ? 0 : 3;
    if (startAfter > 0) {
      setCountdown(startAfter);
      return;
    }

    const recorder = new MediaRecorder(streamRef.current, { mimeType: recorderMimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    setElapsed(0);
    setRecordedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");

    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };

    recorder.start(300);
    setIsRecording(true);
  };

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          // start recording now (no countdown)
          setTimeout(() => {
            setCountdown(0);
            // avoid recursion: call core start after countdown completes
            (async () => {
              if (!streamRef.current) await initializeCamera();
              if (!streamRef.current) return;
              if (typeof MediaRecorder === "undefined" || !recorderMimeType) {
                setUnsupported(true);
                return;
              }
              const recorder = new MediaRecorder(streamRef.current, { mimeType: recorderMimeType });
              mediaRecorderRef.current = recorder;
              chunksRef.current = [];
              setElapsed(0);
              setRecordedBlob(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl("");

              recorder.ondataavailable = (event) => {
                if (event.data?.size) chunksRef.current.push(event.data);
              };

              recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
              };

              recorder.start(300);
              setIsRecording(true);
            })();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown, recorderMimeType, previewUrl]);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRecording) return undefined;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= maxDurationSec) {
          stopRecording();
          return maxDurationSec;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, maxDurationSec]);

  const toggleCamera = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    await initializeCamera(nextMode);
  };

  if (unsupported) {
    return (
      <div className="rounded-lg border p-4 bg-gray-50">
        <p className="text-sm text-gray-700">In-app recording is not supported on this browser.</p>
        <p className="text-xs text-gray-500 mt-1">
          Use camera fallback to record and upload a video file.
        </p>
        <input
          className="mt-3 block w-full text-sm"
          type="file"
          accept="video/*"
          capture="environment"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onUseVideo?.(file, null);
          }}
        />
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="rounded-lg border p-3 bg-gray-50">
        <video src={previewUrl} controls className="w-full rounded bg-black" />
        <p className="text-xs mt-2 text-gray-600">
          Duration: {formatTimer(elapsed)} (minimum {formatTimer(minDurationSec)})
        </p>
        {!canUse ? (
          <p className="text-xs text-amber-700 mt-1">
            Minimum duration not met. Please record at least {formatTimer(minDurationSec)}.
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <Button onClick={() => onUseVideo?.(recordedBlob, elapsed)} disabled={!canUse}>
            Use This Video
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRecordedBlob(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl("");
              setElapsed(0);
            }}
          >
            Re-record
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 bg-gray-50">
      {!isReady ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">Allow camera access to record your vehicle video.</p>
          {permissionError ? <p className="text-xs text-red-700">{permissionError}</p> : null}
          <Button variant="outline" onClick={() => initializeCamera()}>
            Retry Camera Access
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full rounded bg-black" />
            {!isRecording ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-black/60 text-white text-xs rounded p-3 max-w-sm">
                  <p>Position your phone to show the full vehicle.</p>
                  <p>Walk slowly around the vehicle.</p>
                  <p>Video must be 30 seconds to 2 minutes.</p>
                  <p>Tap Start Recording when ready.</p>
                </div>
              </div>
            ) : null}
            {countdown > 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-black/70 text-white flex items-center justify-center text-3xl font-bold">
                  {countdown}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className={warning ? "text-amber-700 font-medium" : "text-gray-700"}>
                {formatTimer(elapsed)} / {formatTimer(maxDurationSec)}
              </span>
              {warning ? <span className="text-amber-700">30 seconds remaining</span> : null}
            </div>
            <div className="h-2 rounded bg-gray-200 overflow-hidden mt-2">
              <div className="h-full bg-brand-blue transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} disabled={countdown > 0}>
                {countdown > 0 ? "Starting..." : "Start Recording"}
              </Button>
            ) : (
              <Button onClick={stopRecording}>Stop Recording</Button>
            )}
            <Button variant="outline" onClick={toggleCamera} disabled={isRecording}>
              Switch Camera
            </Button>
          </div>
          {permissionError ? <p className="text-xs mt-2 text-red-700">{permissionError}</p> : null}
        </>
      )}
    </div>
  );
};

export default VideoRecorder;
