---
title: "Velvet noise in artificial reverberation"
summary: "An online listening study, presented at the VIII JAAS (UNTREF, 2025), that finds how sparse velvet noise can be as a reverb tail before it stops sounding like white noise."
year: 2025
context: Academic
domains: [DSP, Acoustics]
order: 8
stack: [Python, NumPy, MATLAB]
links:
  - label: Source
    url: https://github.com/almarazj/velvet-noise-reverberation
cover: ./images/velvet-thresholds.png
coverAlt: "Threshold pulse density against effective duration, for this study and two earlier ones, falling as the duration grows"
coverCaption: "Each point is the sparsest velvet noise listeners could not tell from white noise: the longer a signal's effective autocorrelation, the fewer pulses its reverb tail needs. Chart labels in Spanish."
---

## The question

Velvet noise, a sparse sequence of pulses, is a cheap substitute for white noise in artificial reverberation.
Earlier work put the density needed to sound smooth at about 1500 pulses per second.
Can a reverb tail use fewer, and does it depend on what is playing through it?

## Method

Three dry excerpts (synthetic drums, a female voice and a flute) were described by the minimum effective duration of their running autocorrelation: 3 ms, 31 ms and 109 ms.
Each was convolved with a synthetic impulse response with a 1 s reverberation time, whose tail was either white noise or velvet noise at seven densities.
28 listeners took an online forced-choice ABX test, and the threshold is where a linear fit of their correct answers crosses the 95% confidence level.

## Results

Drums needed 338 pulses per second, voice 31 and the flute only 1.3, far below the 1500 reported for velvet noise on its own.
Plotted against the effective duration, these thresholds and those of two earlier studies fall along the same line: the longer a signal's effective autocorrelation, the sparser the velvet noise can be.
That points to reverberation algorithms that adapt the pulse density to the music and save computation without an audible change.

Written with Shin-ichi Sato and Mariano Girola.
