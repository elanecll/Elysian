# Elysian saxophone-style jazz

`elysian-saxophone-jazz.wav` is an original two-minute instrumental created for this project, with a synthesized saxophone-style lead, soft piano-style keys, warm bass and gentle swing at 64 BPM. It contains no third-party recordings or samples and is not a cover of “Stuck on You”.

The website plays this local asset at 25% volume when the customer enables the music control. It loops, pauses when switched off, and resumes when switched on again.

To recreate the asset on macOS with Node 24:

```sh
node scripts/create-relaxing-music.mjs
cp test-results/audio/elysian-saxophone-jazz.wav public/audio/elysian-saxophone-jazz.wav
```

The previous `elysian-soft-jazz.m4a` asset is retained but is no longer used by the player.
