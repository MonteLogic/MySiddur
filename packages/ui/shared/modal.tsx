// Modal.tsx
// Modal.tsx
'use client';

// Modal.tsx
'use client';

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, maxWidth = 'max-w-2xl', className = '' }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root') || document.body;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className={`z-50 w-full ${maxWidth} rounded-md bg-white p-6 shadow-md ${className}`}>
        {children}
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;