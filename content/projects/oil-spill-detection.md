---
title: "Oil spill detection MVP"
summary: "A computer vision MVP that detects oil spills in field images for an energy company, built on a fine-tuned YOLO detector."
year: 2025
context: Work
domains: [ML]
order: 7
confidential: true
stack: [Python, PyTorch, YOLO, Gradio, Docker]
cover: ./diagrams/oil-spill-detection.svg
coverAlt: "Field images are labelled, preprocessed and used to fine-tune YOLO, evaluated against a zero-shot baseline and shown in a Gradio demo"
coverCaption: "From field images to a demo: labelled data fine-tunes YOLO, which is then compared against a zero-shot baseline."
---

## The question

Can an energy company spot oil spills in field images automatically, and is a general-purpose model enough or does it need training?

## What I did

- Weighed zero-shot detection and segmentation against a trained detector, and chose YOLO.
- Labelled the images and built their preprocessing.
- Designed the MVP and built a Gradio demo to compare models side by side.

## Results

The best fine-tuned model reached mAP50 0.95, with 0.93 precision and 0.90 recall.
