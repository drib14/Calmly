import React, { useRef, useState } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';

const MediaPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    setProgress((current / duration) * 100);
  };

  const toggleMute = () => {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-black aspect-video">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        loop
      />

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
          {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>

        <div className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer">
            <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }}></div>
        </div>

        <button onClick={toggleMute} className="text-white">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Center Play Button (if paused) */}
      {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Play size={24} className="text-white ml-1" fill="white" />
              </div>
          </div>
      )}
    </div>
  );
};

export default MediaPlayer;
