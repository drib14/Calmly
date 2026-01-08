import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';
import clsx from 'clsx';

const MediaPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef(null);

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
      resetControlsTimeout();
    }
  };

  const handleTimeUpdate = () => {
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    if (duration > 0) {
        setProgress((current / duration) * 100);
    }
  };

  const toggleMute = (e) => {
      e?.stopPropagation();
      if (videoRef.current) {
          videoRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
      }
  };

  const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) setShowControls(false);
      }, 3000);
  };

  const handleInteraction = () => {
      setShowControls(true);
      resetControlsTimeout();
  };

  useEffect(() => {
      return () => {
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
  }, [isPlaying]);

  return (
    <div
        className="relative group rounded-xl overflow-hidden bg-black aspect-video touch-none"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={handleInteraction}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        loop
        playsInline
      />

      {/* Custom Controls Overlay */}
      <div
          className={clsx(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-center space-x-4 transition-opacity duration-300",
              showControls || !isPlaying ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
      >
        <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform p-2">
          {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>

        <div className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer relative group/progress">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }}></div>
        </div>

        <button onClick={toggleMute} className="text-white p-2">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Center Play Button (if paused) */}
      {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <Play size={28} className="text-white ml-1" fill="white" />
              </div>
          </div>
      )}
    </div>
  );
};

export default MediaPlayer;
