import { Dialog, DialogContent } from "@lh/shared";

const VideoPlayer = ({ src, onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <video src={src} controls autoPlay className="w-full rounded-lg bg-black" />
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;
