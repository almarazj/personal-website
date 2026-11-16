---
title: "Simple ABX"
summary: "A self-hosted web platform for blind ABX listening tests."
year: 2025
context: Personal
domains: [Backend, Acoustics]
order: 9
stack: [Python, FastAPI, Firestore, Cloud Storage, Cloud Run, Docker]
links:
  - label: Source
    url: https://github.com/almarazj/simple-abx
cover: ./diagrams/simple-abx.svg
coverAlt: "Listener pages and an admin dashboard call a FastAPI API on Cloud Run, which keeps trial order and answers in Firestore and signs URLs so audio streams straight from Cloud Storage"
coverCaption: "Audio never passes through the API: it signs a URL and the listener's browser streams the file from storage, so the API only handles trials and answers."
---

Participants hear A, B and X and say whether X is A or B, with seamless switching between the three.
The platform records anonymous demographic data, can allow a "can't tell" answer, and shows live statistics of the results.
FastAPI with Jinja templates, in Docker on Cloud Run: trials and answers live in Firestore, and audio streams straight from Cloud Storage through signed URLs. It was deployed for public listening tests.
