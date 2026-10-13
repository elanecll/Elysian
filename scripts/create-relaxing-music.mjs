// Original quiet jazz: a synthesized saxophone-style lead, soft keys and warm bass.
// Render the WAV master, then encode AAC using public/audio/README.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const output = process.argv[2] || "test-results/audio/elysian-saxophone-jazz.wav";
const rate = 24000;
const beat = 60 / 64;
const duration = 120;
const samples = new Float32Array(rate * duration);
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

function note(midi, start, length, volume, bass = false) {
  const first = Math.round(start * rate);
  const f = frequency(midi);
  for (let i = 0; i < Math.round(length * rate); i++) {
    const position = first + i;
    if (position >= samples.length) break;
    const t = i / rate;
    const phase = 2 * Math.PI * f * t;
    const envelope =
      (1 - Math.exp(-t * (bass ? 40 : 22))) *
      Math.exp(-t / (bass ? 0.8 : 1.8)) *
      Math.min(1, (length - t) / 0.3);
    const tone = bass
      ? Math.sin(phase) + 0.18 * Math.sin(phase * 2)
      : Math.sin(phase) +
        0.2 * Math.sin(phase * 2) * Math.exp(-t / 0.65) +
        0.045 * Math.sin(phase * 3) * Math.exp(-t / 0.4);
    samples[position] += tone * envelope * volume;
  }
}

// Breath-shaped attack, warm reed harmonics and delayed vibrato; no external samples.
function saxNote(midi, start, length, volume) {
  const first = Math.round(start * rate);
  const f = frequency(midi);
  let phase = 0;
  for (let i = 0; i < Math.round(length * rate); i++) {
    const position = first + i;
    if (position >= samples.length) break;
    const t = i / rate;
    const vibrato = Math.min(1, t / 0.65) * 0.0035 * Math.sin(2 * Math.PI * 4.6 * t);
    const scoop = -0.012 * Math.exp(-t / 0.075);
    phase += 2 * Math.PI * f * (1 + vibrato + scoop) / rate;
    const envelope = (1 - Math.exp(-t / 0.075)) * Math.min(1, (length - t) / 0.3);
    const breath = 0.92 + 0.08 * Math.sin(2 * Math.PI * 0.8 * t);
    const tone = Math.sin(phase) + 0.42 * Math.sin(2 * phase) +
      0.24 * Math.sin(3 * phase) + 0.1 * Math.sin(4 * phase) +
      0.045 * Math.sin(5 * phase);
    samples[position] += tone * envelope * breath * volume;
  }
}

const progression = [
  { bass: 36, chord: [52, 55, 59, 62], melody: [67, 71, 74, 71] }, // Cmaj9
  { bass: 33, chord: [55, 59, 60, 64], melody: [69, 72, 71, 67] }, // Am9
  { bass: 38, chord: [53, 57, 60, 64], melody: [65, 69, 72, 69] }, // Dm9
  { bass: 43, chord: [53, 57, 59, 64], melody: [67, 71, 69, 67] }, // G13
  { bass: 36, chord: [52, 55, 59, 62], melody: [64, 67, 71, 74] },
  { bass: 41, chord: [52, 57, 60, 64], melody: [69, 72, 76, 72] }, // Fmaj7
  { bass: 38, chord: [53, 57, 60, 64], melody: [69, 72, 69, 65] },
  { bass: 43, chord: [53, 57, 59, 64], melody: [67, 69, 71, 67] },
];
const phrasing = [0.45, 1 + 2 / 3, 2.45, 3 + 2 / 3];
for (let bar = 0; bar < 32; bar++) {
  const start = bar * 4 * beat;
  const part = progression[bar % progression.length];
  part.chord.forEach((pitch, index) =>
    note(pitch, start + index * 0.025, 4, 0.027),
  );
  if (bar % 2 === 0) {
    part.chord
      .slice(1)
      .forEach((pitch, index) =>
        note(pitch, start + 2.65 * beat + index * 0.02, 3, 0.014),
      );
  }
  note(part.bass, start, beat * 1.8, 0.045, true);
  note(part.bass + 7, start + 2 * beat, beat * 1.8, 0.03, true);
  part.melody.forEach((pitch, index) => {
    // Leave gentle pauses at the end of each phrase.
    if (bar % 4 === 3 && index > 1) return;
    saxNote(pitch - 12, start + phrasing[index] * beat, index === 0 ? 1.3 : 0.85, 0.065);
  });
}

const wet = new Float32Array(samples);
for (const [delay, gain] of [
  [0.19, 0.1],
  [0.41, 0.06],
  [0.73, 0.025],
]) {
  const offset = Math.round(delay * rate);
  for (let i = offset; i < samples.length; i++)
    wet[i] += samples[i - offset] * gain;
}
let peak = 0;
for (const sample of wet) peak = Math.max(peak, Math.abs(sample));
const level = 0.32 / peak;
const wav = Buffer.alloc(44 + samples.length * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(samples.length * 2, 40);
for (let i = 0; i < samples.length; i++) {
  const t = i / rate;
  const fade = Math.min(1, t / 3, (duration - t) / 5);
  wav.writeInt16LE(Math.round(wet[i] * level * fade * 32767), 44 + i * 2);
}
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, wav);
console.log(`Created ${duration}s original saxophone-style jazz at 64 BPM: ${output}`);
