"use client";

import { useCallback, useState } from "react";

interface AddSongCardProps {
  onAddSong: (title: string, author: string, url: string) => void;
  isLoading: boolean;
}

const AddSongCard: React.FC<AddSongCardProps> = ({ onAddSong, isLoading }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = useCallback(() => {
    if (title.trim() && author.trim() && url.trim()) {
      onAddSong(title.trim(), author.trim(), url.trim());
      setTitle("");
      setAuthor("");
      setUrl("");
    }
  }, [title, author, url, onAddSong]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isDisabled = !title.trim() || !author.trim() || !url.trim() || isLoading;

  return (
    <div className="card bg-gradient-to-br from-accent/10 to-secondary/10 shadow-xl border border-accent/20">
      <div className="card-body p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="text-2xl sm:text-3xl">🎵</div>
          <h2 className="card-title text-lg sm:text-xl">Add Your Song</h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-sm sm:text-base">Song Title</span>
            </label>
            <input
              type="text"
              placeholder="Enter song title..."
              className="input input-bordered w-full focus:input-primary min-h-[44px] text-sm sm:text-base"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              tabIndex={0}
              aria-label="Song title input"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-sm sm:text-base">Author Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter author name..."
              className="input input-bordered w-full focus:input-primary min-h-[44px] text-sm sm:text-base"
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
              <span className="label-text font-medium text-sm sm:text-base">Song URL</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com/song.mp3"
              className="input input-bordered w-full focus:input-primary min-h-[44px] text-sm sm:text-base"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              tabIndex={0}
              aria-label="Song URL input"
            />
            <label className="label">
              <span className="label-text-alt text-xs sm:text-sm text-base-content/60">
                Link to the song (YouTube, SoundCloud, etc.)
              </span>
            </label>
          </div>

          <button
            className={`btn btn-accent w-full min-h-[44px] text-sm sm:text-base ${isLoading ? "loading" : ""}`}
            onClick={handleSubmit}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            tabIndex={0}
            aria-label="Add song to the game"
          >
            {isLoading ? "Adding..." : "Add Song"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSongCard;
