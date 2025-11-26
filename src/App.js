// src/App.js
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // custom audio state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setTracks([]);
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);

    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          query
        )}&media=music&limit=25`
      );

      if (!res.ok) throw new Error("Could not fetch songs");

      const data = await res.json();

      const mapped =
        data.results?.map((item) => ({
          id: item.trackId,
          title: item.trackName,
          artist: item.artistName,
          artwork:
            item.artworkUrl100?.replace("100x100bb", "300x300bb") ||
            item.artworkUrl100,
          audioUrl: item.previewUrl,
        })) || [];

      setTracks(mapped);
      if (mapped.length) setCurrentTrack(mapped[0]);
      else setError("No songs found. Try a different search.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
  };

  const isFavorite = (track) => favorites.some((f) => f.id === track.id);

  const toggleFavorite = (track) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === track.id);
      return exists ? prev.filter((f) => f.id !== track.id) : [track, ...prev];
    });
  };

  // autoplay when track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    const audio = audioRef.current;
    audio.currentTime = 0;
    setProgress(0);

    const play = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };
    play();
  }, [currentTrack]);

  // audio events
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(duration);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const value = Number(e.target.value);
    audioRef.current.currentTime = value;
    setProgress(value);
  };

  const formatTime = (sec) => {
    if (!sec || Number.isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="app">
      <div className="shell">
        {/* TOP BAR */}
        <header className="top">
          <div>
            <div className="brand">React Music Player 🎧</div>
            <div className="tagline">
              Search, favourite and play tracks – smooth custom player with
              30s previews.
            </div>
          </div>
          <span className="pill">Online preview</span>
        </header>

        {/* SEARCH */}
        <form className="search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search songs or artists… e.g. Peniviti, Arijit Singh, Alan Walker"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {loading && (
          <div className="loading-row">
            <div className="spinner" />
            <span>Finding tracks…</span>
          </div>
        )}

        {/* FAVOURITES */}
        {favorites.length > 0 && (
          <div className="favs">
            <div className="favs-label">Favourites</div>
            <div className="favs-row">
              {favorites.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handlePlayTrack(track)}
                  className={`fav-chip ${
                    currentTrack?.id === track.id ? "fav-chip-active" : ""
                  }`}
                >
                  <span className="fav-dot">●</span>
                  <span className="fav-title">{track.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="grid">
          {/* PLAYER PANEL */}
          <section className="panel player-panel">
            {currentTrack ? (
              <>
                <div className="player-header">
                  <div>
                    <div className="eyebrow">Now playing</div>
                    <h2 className="track-main-title">{currentTrack.title}</h2>
                    <p className="track-main-artist">{currentTrack.artist}</p>
                  </div>
                  <button
                    type="button"
                    className={`fav-btn ${
                      isFavorite(currentTrack) ? "fav-btn-active" : ""
                    }`}
                    onClick={() => toggleFavorite(currentTrack)}
                  >
                    {isFavorite(currentTrack) ? "♥" : "♡"}
                  </button>
                </div>

                <div className="player-body">
                  <img
                    src={currentTrack.artwork}
                    alt={currentTrack.title}
                    className="player-art"
                  />

                  {/* REAL AUDIO (HIDDEN) */}
                  <audio
                    ref={audioRef}
                    src={currentTrack.audioUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    className="hidden-audio"
                  />

                  {/* CUSTOM PLAYER BAR */}
                  <div className="custom-player">
                    <button
                      type="button"
                      className={`play-btn ${isPlaying ? "playing" : ""}`}
                      onClick={togglePlayPause}
                    >
                      <span className="play-icon">
                        {isPlaying ? "❚❚" : "►"}
                      </span>
                    </button>

                    <div className="progress-area">
                      <div className="time-row">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration || 30)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={duration || 30}
                        step="0.1"
                        value={progress}
                        onChange={handleSeek}
                      />
                    </div>
                  </div>

                  <p className="note">
                    30s preview · powered by iTunes Search API.
                  </p>
                </div>
              </>
            ) : (
              <div className="empty">
                <p>Search for a song and choose one from the list to start.</p>
              </div>
            )}
          </section>

          {/* LIST PANEL */}
          <section className="panel list-panel">
            <div className="list-header">
              <h3>Results</h3>
              <span className="count">
                {tracks.length ? `${tracks.length} tracks` : "No tracks yet"}
              </span>
            </div>

            <div className="list-scroll">
              {tracks.length === 0 && (
                <p className="empty-list">
                  Results will appear here after you search.
                </p>
              )}

              {tracks.map((track) => {
                const active = currentTrack?.id === track.id;
                const fav = isFavorite(track);

                return (
                  <div
                    key={track.id}
                    className={`row ${active ? "row-active" : ""}`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <img
                      src={track.artwork}
                      className="row-art"
                      alt={track.title}
                    />
                    <div className="row-text">
                      <div className="row-title">{track.title}</div>
                      <div className="row-artist">{track.artist}</div>
                    </div>

                    <button
                      type="button"
                      className={`row-fav ${fav ? "row-fav-on" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track);
                      }}
                    >
                      {fav ? "♥" : "♡"}
                    </button>

                    <span className="row-indicator">
                      {active ? "❚❚" : "►"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
