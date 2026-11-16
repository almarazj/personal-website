---
title: "Wall sound insulation predictor"
summary: "Predicts the airborne sound insulation of a single wall from its dimensions and material, comparing four prediction methods."
year: 2021
context: Academic
domains: [Acoustics]
order: 12
stack: [MATLAB]
links:
  - label: Source
    url: https://github.com/almarazj/simple-wall-acoustic-isolation
cover: ./images/wall-insulation-gui.png
coverAlt: "Transmission loss of a brick wall by mass law, Davy, Sharp and ISO 12354-1"
coverCaption: "The four prediction methods side by side for a brick wall, per frequency band."
---

Given a wall's material and dimensions, it computes the sound reduction index per band with the corrected mass law, Davy, Sharp and ISO 12354-1, plots them against the critical frequency and exports them to Excel.
