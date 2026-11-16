---
title: "QR payments service"
summary: "One service that talks to a bank's QR payments API, so several internal systems create and track payments the same way."
year: 2026
context: Work
domains: [Backend]
order: 5
live: true
confidential: true
stack: [Python, FastAPI, Docker, AWS, pytest]
cover: ./diagrams/qr-payments-service.svg
coverAlt: "Several internal systems call one QR payments service, which talks to the bank and forwards payment notifications back"
coverCaption: "One service between the internal systems and the bank, so every system creates and tracks QR payments the same way."
---

## What it does

Several systems in a group of companies charge their customers with QR codes.
Instead of each one integrating the bank on its own, this service normalizes that communication: it creates payment requests, reports their status in one shared model and forwards payment notifications to each system.

## What I did

I took it from a first version to production: schema validation on every request and response, retries for calls to the bank, idempotent cancellation, and per-environment configuration with secrets in AWS Secrets Manager.
