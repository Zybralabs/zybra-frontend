import React from "react";

type ModalProps = {
  onClose: () => void;
  children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className="flex fixed justify-center items-center top-0 left-0 right-0 bottom-0 z-10">
      <div
        className="absolute w-screen h-screen top-0 left-0 right-0 bottom-0 bg-black/50 z-[11]"
        onClick={onClose}
      ></div>
      <div className="z-[12] max-w-full">{children}</div>
    </div>
  );
};

