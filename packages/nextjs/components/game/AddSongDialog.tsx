"use client";

import { useCallback, useState } from "react";

interface AddSongDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, author: string, url: string) => void;
  isLoading: boolean;
}

const AddSongDialog: React.FC<AddSongDialogProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = useCallback(() => {
    if (title.trim() && author.trim() && url.trim()) {
      onSubmit(title.trim(), author.trim(), url.trim());
      setTitle("");
      setAuthor("");
      setUrl("");
      onClose();
    }
  }, [title, author, url, onSubmit, onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [handleSubmit, onClose],
  );

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setTitle("");
      setAuthor("");
      setUrl("");
      onClose();
    }
  }, [isLoading, onClose]);

  const isDisabled = !title.trim() || !author.trim() || !url.trim() || isLoading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />

      {/* Dialog */}
      <div className="relative bg-base-100 rounded-xl shadow-2xl border border-base-content/10 w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎵</div>
              <h2 className="text-xl font-bold">Add Song</h2>
            </div>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Song Title</span>
              </label>
              <input
                type="text"
                placeholder="Enter song title..."
                className="input input-bordered w-full focus:input-primary"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                tabIndex={0}
                aria-label="Song title input"
                autoFocus
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Author Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter author name..."
                className="input input-bordered w-full focus:input-primary"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                tabIndex={0}
                aria-label="Author name input"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">YouTube URL</span>
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="input input-bordered w-full focus:input-primary"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                tabIndex={0}
                aria-label="Song URL input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button className="btn btn-ghost flex-1" onClick={handleClose} disabled={isLoading} tabIndex={0}>
              Cancel
            </button>
            <button
              className={`btn btn-primary flex-1 ${isLoading ? "loading" : ""}`}
              onClick={handleSubmit}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              tabIndex={0}
              aria-label="Submit song to be ranked"
            >
              {isLoading ? "Submitting..." : "Submit song to be ranked"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSongDialog;
