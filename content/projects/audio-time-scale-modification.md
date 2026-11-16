---
title: "Audio time-scale modification"
summary: "Stretches audio in time without changing its pitch, treating harmonic and percussive sounds separately so drums stay sharp."
year: 2022
context: Academic
domains: [DSP]
order: 11
stack: [Python, NumPy]
links:
  - label: Source
    url: https://github.com/almarazj/audio-time-scale-modification
cover: ./diagrams/audio-time-scale-modification.svg
coverAlt: "Block diagram: HPSS splits the input, OLA stretches the percussive part and a phase vocoder the harmonic part"
coverCaption: "Harmonic and percussive sounds are stretched separately, so drums stay sharp while tones keep their pitch."
---

A median filter splits the signal into harmonic and percussive parts.
The harmonic part goes through a phase vocoder and the percussive part through overlap-add, and the two are summed back.
The result was compared against existing time-stretching algorithms.
