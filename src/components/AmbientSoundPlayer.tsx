import React, { useEffect, useRef } from "react";

interface AmbientSoundPlayerProps {
  isPlaying: boolean;
  onStateChange?: (playing: boolean) => void;
}

export const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({
  isPlaying,
  onStateChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let active = true;
    audio.volume = 0.25;
    if (isPlaying) {
      void audio.play().catch(() => {
        if (active) onStateChange?.(false);
      });
    } else {
      audio.pause();
    }
    return () => {
      active = false;
      audio.pause();
    };
  }, [isPlaying, onStateChange]);

  return (
    <audio
      ref={audioRef}
      src="/audio/elysian-saxophone-jazz.wav"
      loop
      preload="none"
      onError={() => onStateChange?.(false)}
    />
  );
};
