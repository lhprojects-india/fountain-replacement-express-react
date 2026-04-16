# Week 6 — Day 3: In-App Video Recording

## Context

Yesterday we built the document upload UI for images and PDFs. One critical requirement is that the vehicle video must be recorded in-app (not uploaded from gallery) to ensure authenticity. Today we build the camera/video recording component.

**Previous day**: Document upload UI — drag-drop, upload progress, image previews, file validation.

**What we're building today**: In-browser video recording using the MediaRecorder API with duration limits, preview, and upload integration.

## Today's Focus

1. Camera access and video recording component
2. Recording controls (start, stop, countdown timer)
3. Duration limits (1-2 minutes max)
4. Recording preview and re-record
5. Video upload to S3

## Detailed Changes

### Backend

#### 1. Video-specific upload handling

Update `document.service.js` `requestUploadUrl` to handle video specifics:
- For video requirements: allow `video/mp4` and `video/webm`
- Set larger presigned URL expiry (30 minutes for larger files)
- Add `durationSec` field validation on confirm (client reports duration)

Update `confirmUpload` to accept `durationSec`:
```
POST /api/driver/documents/confirm — { documentId, durationSec? }
```

Validate: if requirement has `maxDurationSec`, reject if `durationSec` exceeds it.

### Frontend (Driver Web)

#### 1. `apps/driver-web/src/components/VideoRecorder.jsx`

Full video recording component:

**States:**
1. **Permission request**: "Allow camera access to record your vehicle video"
   - Request `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })`
   - Handle permission denied gracefully

2. **Ready to record**: Camera preview live
   - [Start Recording] button
   - Camera switch button (front/back on mobile)
   - Instructions: "Record a 1-2 minute video walking around your vehicle"

3. **Recording**: Live camera feed with overlay
   - Timer: "0:45 / 2:00" counting up
   - Progress bar showing time used vs max
   - [Stop Recording] button
   - Auto-stop at max duration (120 seconds)
   - Warning flash at 1:30 ("30 seconds remaining")
   - Minimum duration: 30 seconds

4. **Preview**: Playback of recorded video
   - Video player with controls
   - Duration display
   - [Use This Video] + [Re-Record] buttons

5. **Uploading**: Progress bar for S3 upload

**Implementation notes:**

```javascript
// MediaRecorder setup
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm',
});

const chunks = [];
mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
  setRecordedVideo(blob);
  setPreviewUrl(URL.createObjectURL(blob));
};
```

**Camera facing mode toggle:**
```javascript
const [facingMode, setFacingMode] = useState('environment');
const toggleCamera = () => {
  setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  // Restart stream with new facing mode
};
```

**Timer component:**
```javascript
const [elapsed, setElapsed] = useState(0);
const MAX_DURATION = 120; // seconds

useEffect(() => {
  if (!isRecording) return;
  const interval = setInterval(() => {
    setElapsed(prev => {
      if (prev >= MAX_DURATION) {
        stopRecording();
        return MAX_DURATION;
      }
      return prev + 1;
    });
  }, 1000);
  return () => clearInterval(interval);
}, [isRecording]);
```

#### 2. Integration with DocumentUploadCard

For video requirements (`code === 'vehicle_video'`):
- Replace the file upload zone with the VideoRecorder component
- On "Use This Video": trigger the standard upload flow (request URL, upload blob, confirm)
- Show video thumbnail after upload

#### 3. Video preview after upload

For previously uploaded videos:
- Show video thumbnail (first frame or placeholder)
- "Play" button → opens video player in a modal
- "Re-record" button → opens VideoRecorder again

The download URL (presigned) is used as the video source.

#### 4. `apps/driver-web/src/components/VideoPlayer.jsx`

Simple modal video player:
```jsx
function VideoPlayer({ src, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <video src={src} controls autoPlay className="w-full rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}
```

#### 5. Mobile-specific considerations

- **iOS Safari**: MediaRecorder support varies. Detect support:
  ```javascript
  const isSupported = typeof MediaRecorder !== 'undefined';
  ```
  If not supported: fallback to file input with `capture="environment"`:
  ```html
  <input type="file" accept="video/*" capture="environment" />
  ```
  This opens the native camera app on iOS.

- **Orientation**: Lock to landscape if possible for vehicle recording
- **File size**: Video can be large. Show estimated upload time based on file size

#### 6. Recording guidelines overlay

When the camera is active but before recording starts, show translucent overlay text:
- "Position your phone to show the full vehicle"
- "Walk slowly around the vehicle"
- "Video must be 30 seconds to 2 minutes"
- "Tap 'Start Recording' when ready"

## Acceptance Criteria

- [ ] Camera permission request works (with graceful fallback on deny)
- [ ] Live camera preview displays
- [ ] Front/back camera toggle works on mobile
- [ ] Recording starts and timer counts up
- [ ] Auto-stop at max duration (120s)
- [ ] Warning at 30 seconds remaining
- [ ] Minimum duration enforced (30s)
- [ ] Preview plays recorded video
- [ ] Re-record discards previous recording
- [ ] Upload to S3 works for video blob
- [ ] Upload progress displayed
- [ ] iOS fallback to native camera works
- [ ] Previously uploaded videos can be played
- [ ] Duration stored in DocumentSubmission

## What's Next (Day 4)

Tomorrow we build the **document submission flow** — the process where the driver marks all documents as ready for review, which transitions the application to `documents_under_review` and notifies the admin team.
