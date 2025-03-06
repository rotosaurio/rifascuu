import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOutsideClick = true,
  showCloseButton = true,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Size classes for the modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOutsideClick) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl overflow-hidden transform transition-all`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {showCloseButton && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
