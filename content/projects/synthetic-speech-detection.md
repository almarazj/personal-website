---
title: "Synthetic speech detection"
summary: "Compared anti-spoofing models at telling real Latin American Spanish speech from synthetic speech, and measured how accent and noise affect detection."
year: 2024
context: Work
domains: [ML, DSP]
order: 6
stack: [Python, PyTorch, scikit-learn, pandas, CUDA, Gradio, Docker]
cover: ./images/speech-detection-scores.png
coverAlt: "Score densities: real speech peaks near +8, while StarGAN, CycleGAN, Diff, TTS and mixed attacks sit between -15 and -5"
coverCaption: "Detector scores on HABLA, a Latin American Spanish dataset: real speech separates cleanly from every kind of synthetic attack. Chart labels in Spanish."
---

## The problem

Sintetica builds text-to-speech voices in Rioplatense Spanish.
The same technology makes voice deepfakes easier, so the team wanted a detector for synthetic speech in Spanish, where most anti-spoofing work is in English.
The project was part of a colleague's undergraduate thesis, and I joined it during my internship.

## What I did

- Compared existing anti-spoofing models and their options on Spanish data, starting from models built for the English ASVspoof benchmark.
- Built the dataset tooling: splits, duplicate detection, protocol checks and test sets segmented by signal-to-noise ratio.
- Ran the statistics: SNR and duration distributions, Kolmogorov-Smirnov and Mann-Whitney tests, Kruskal-Wallis across accents with effect sizes, and SNR-score correlations.
- Shipped a Gradio app in Docker that scores a batch of files and exports the results.

## Results

On HABLA, a Latin American Spanish dataset, the detector reached an equal error rate of 0.74%, between 0.50% and 1.03% across accents.
On Sintetica's own voices it was 8.94%, and rose to 23.46% once noise lowered the SNR: robust to accent, sensitive to noise.
