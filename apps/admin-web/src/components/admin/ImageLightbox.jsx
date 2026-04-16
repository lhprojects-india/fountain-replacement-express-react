import { Dialog, DialogContent } from "@lh/shared";

const ImageLightbox = ({ src, onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <div className="flex justify-center">
          <img src={src} alt="Document preview" className="max-h-[80vh] w-auto rounded" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
