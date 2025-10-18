"use client";

import { useCallback } from "react";
// import ActionShareCard from "~~/components/ui/ActionShareCard";
import ShareButton from "../ui/ShareButton";

interface TransactionSuccessOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionText: string;
  embedPath: string;
}

const TransactionSuccessOverlay: React.FC<TransactionSuccessOverlayProps> = ({
  isOpen,
  onClose,
  // title,
  // description,
  // actionText,
  // embedPath,
}) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Success Message */}
      <div className="relative bg-base-100 rounded-xl shadow-2xl border border-base-content/10 w-full max-w-md">
        <div className="p-6">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              {/* Success Icon */}
              <div className="text-6xl mb-4">✅</div>

              {/* Success Message */}
              <h2 className="text-2xl font-bold text-success mb-2">Transaction Successful!</h2>
              <p className="text-base-content/70">Your transaction has been confirmed on the blockchain.</p>
            </div>
          </div>

          {/* Share Button */}
          <div className="mb-6">
            <ShareButton
              label="Share"
              intent={{
                text: "Rank these songs! 🚀",
                embedPath: "/share/dummy_fid",
              }}
            />
          </div>

          {/* Continue Button */}
          <button
            className="btn btn-primary w-full"
            onClick={handleClose}
            tabIndex={0}
            aria-label="Close success message"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionSuccessOverlay;
