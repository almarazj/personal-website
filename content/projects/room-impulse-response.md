---
title: "Room impulse response analyzer"
summary: "A desktop app that computes room acoustics parameters from a measured impulse response or a sine sweep, checked against commercial software."
year: 2023
context: Academic
domains: [Acoustics, DSP]
order: 10
stack: [Python, NumPy, pandas]
links:
  - label: Source
    url: https://github.com/almarazj/impulse-analyzer
cover: ./images/rir-gui.png
coverAlt: "Impulse response analyzer showing a decay curve and parameters per band"
coverCaption: "The analyzer after loading a measurement: its decay curve and the room parameters for each band."
---

A team project for the Acoustical Instruments and Measurements course, with three classmates.

## What it does

It takes a measured impulse response, or a recorded logarithmic sine sweep plus its inverse filter, and computes EDT, T20, T30, C50 and C80 per octave or third-octave band, and IACC from binaural recordings.
Decay curves come from Schroeder integration or a moving median filter, with the noise floor estimated from the tail, and results export to CSV from a Tkinter interface.

## Validation

We compared every parameter with Aurora and AARAE on the same measurements.
T20, T30 and EDT agree closely above 500 Hz and drift apart below it, where the reference tools also disagree with each other.
C80 agrees above 250 Hz, C50 shows the largest differences, and IACC follows AARAE across frequency.
