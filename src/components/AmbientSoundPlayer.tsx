import React, { useEffect, useRef } from 'react';

interface AmbientSoundPlayerProps {
  isPlaying: boolean;
  onStateChange?: (playing: boolean) => void;
}

export const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({ isPlaying }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }

    return () => {
      stopAmbientSound();
    };
  }, [isPlaying]);

  const startAmbientSound = () => {
    if (isRunningRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      isRunningRef.current = true;

      // Soft warm background drone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const droneGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(108, ctx.currentTime); // Meditative low harmonic

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(162, ctx.currentTime); // Harmonic fifth

      droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
      droneGain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 3);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      // Gentle singing bowl/chime frequencies
      const frequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25];

      const playChime = () => {
        if (!isRunningRef.current || !audioCtxRef.current) return;
        const currentCtx = audioCtxRef.current;
        if (currentCtx.state === 'suspended') {
          currentCtx.resume();
        }

        const noteFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
        const chimeOsc = currentCtx.createOscillator();
        const chimeGain = currentCtx.createGain();

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(noteFreq, currentCtx.currentTime);

        chimeGain.gain.setValueAtTime(0.0001, currentCtx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.025, currentCtx.currentTime + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.00001, currentCtx.currentTime + 4.5);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(currentCtx.destination);

        chimeOsc.start(currentCtx.currentTime);
        chimeOsc.stop(currentCtx.currentTime + 5);
      };

      setTimeout(playChime, 800);

      intervalRef.current = window.setInterval(() => {
        if (Math.random() > 0.2) {
          playChime();
        }
      }, 5000);

    } catch (e) {
      console.warn('Web Audio API not supported or interaction blocked:', e);
    }
  };

  const stopAmbientSound = () => {
    isRunningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
  };

  return null;
};

