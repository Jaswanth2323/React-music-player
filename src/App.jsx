import React, { useRef, useState, useEffect } from "react";
import data from "./SongData";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMusic,
  faAngleLeft,
  faAngleRight,
  faPause,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import "./styles.css";
import LibrarySong from "./Librarysong";

function App() {
  const [songs, setSongs] = useState(data());
  const [currentSong, setCurrentSong] = useState(songs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState(false);
  const audioRef = useRef(null);
  const [songInfo, setSongInfo] = useState({
    currentTime: 0,
    duration: 0,
    animationPercentage: 0,
  });
  
  const timeUpdateHandler = (e) => {
    const current = e.target.currentTime;
    const duration = e.target.duration;
    //calculating percentage
    const roundedCurrent = Math.round(current);
    const roundedDuration = Math.round(duration);
    const animation = Math.round((roundedCurrent / roundedDuration) * 100);
    console.log();
    setSongInfo({
      currentTime: current,
      duration,
      animationPercentage: animation,
    });
  };
  const songEndHandler = async () => {
    let currentIndex = songs.findIndex((song) => song.id === currentSong.id);

    await setCurrentSong(songs[(currentIndex + 1) % songs.length]);

    if (isPlaying) audioRef.current.play();
  };

  // player
  const activeLibraryHandler = (nextPrev) => {
    const newSongs = songs.map((song) => {
      if (song.id === nextPrev.id) {
        return {
          ...song,
          active: true,
        };
      } else {
        return {
          ...song,
          active: false,
        };
      }
    });
    setSongs(newSongs);
    console.log("Hey from useEffect form player JS");
  };
  //Event Handlers
  const dragHandler = (e) => {
    audioRef.current.currentTime = e.target.value;
    setSongInfo({ ...songInfo, currentTime: e.target.value });
  };
  const playSongHandler = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(!isPlaying);
    } else {
      audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const getTime = (time) =>
    Math.floor(time / 60) + ":" + ("0" + Math.floor(time % 60)).slice(-2);
  const skipTrackHandler = async (direction) => {
    if (!songs.length) return; // Check if songs array is empty
    let currentIndex = songs.findIndex((song) => song.id === currentSong.id);
    if (currentIndex === -1) return; // Check if currentSong is defined in the songs array
    if (direction === "skip-forward") {
        await setCurrentSong(songs[(currentIndex + 1) % songs.length]);
        activeLibraryHandler(songs[(currentIndex + 1) % songs.length]);
    }
    if (direction === "skip-back") {
        if ((currentIndex - 1) % songs.length === -1) {
            await setCurrentSong(songs[songs.length - 1]);
            activeLibraryHandler(songs[songs.length - 1]);
            return;
        }
        await setCurrentSong(songs[(currentIndex - 1) % songs.length]);
        activeLibraryHandler(songs[(currentIndex - 1) % songs.length]);
    }
    if (isPlaying) audioRef.current.play();
};

  //adding the styles
  const trackAnim = {
    transform: `translateX(${songInfo.animationPercentage}%)`,
  };

  // end palyer

  return (
    <div>
      <navbar>
        <div className="navbar">
          <h1>Music App</h1>

          <button
            onClick={() => {
              setLibraryStatus(!libraryStatus);
            }}
          >
            Library
            <FontAwesomeIcon icon={faMusic} />
          </button>
        </div>
      </navbar>
      {/* song section */}
      <div>
        <div className="song-container">
          <img src={currentSong.cover} alt={currentSong.name} />
          <h2>{currentSong.name}</h2>
          <h3>{currentSong.artist}</h3>
        </div>
      </div>
      {/* player */}

      <div className="player">
        <div className="time-control">
          <p>{getTime(songInfo.currentTime)}</p>
          <div
            style={{
              background: `linear-gradient(to right, ${currentSong.color[0]}, ${currentSong.color[1]})`,
            }}
            className="track"
          >
            <input
              min={0}
              max={songInfo.duration || 0}
              value={songInfo.currentTime}
              onChange={dragHandler}
              type="range"
            />
            <div style={trackAnim} className="animate-track"></div>
          </div>
          <p>{songInfo.duration ? getTime(songInfo.duration) : "00:00"}</p>
        </div>
        <div className="play-control">
          <FontAwesomeIcon
            onClick={() => skipTrackHandler("skip-back")}
            size="2x"
            className="skip-back"
            icon={faAngleLeft}
          />
          {!isPlaying ? (
            <FontAwesomeIcon
              onClick={playSongHandler}
              size="2x"
              className="play"
              icon={faPlay}
            />
          ) : (
            <FontAwesomeIcon
              onClick={playSongHandler}
              size="2x"
              className="pause"
              icon={faPause}
            />
          )}

          <FontAwesomeIcon
            onClick={() => skipTrackHandler("skip-forward")}
            size="2x"
            className="skip-forward"
            icon={faAngleRight}
          />
        </div>
      </div>
      {/* library */}
      <div className={`library ${libraryStatus ? "active" : ""}`}>
        <h2>Library</h2>
        <div className="library-songs">
          {songs.map((song) => (
            <LibrarySong
              setSongs={setSongs}
              isPlaying={isPlaying}
              audioRef={audioRef}
              songs={songs}
              song={song}
              setCurrentSong={setCurrentSong}
              id={song.id}
              key={song.id}
            />
          ))}
        </div>
      </div>
      {/* audio play */}
      <audio
        onLoadedMetadata={timeUpdateHandler}
        onTimeUpdate={timeUpdateHandler}
        src={currentSong.audio}
        ref={audioRef}
        onEnded={songEndHandler}
      ></audio>
      {/* End App */}
    </div>
  );
}

export default App;
