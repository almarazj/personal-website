---
title: "Livestock brokerage platform"
summary: "A platform for a cattle commission house that replaced WhatsApp, spreadsheets and paper; I owned the fattening side of the business end to end."
year: 2026
context: Work
domains: [Backend]
order: 2
live: true
confidential: true
stack: [Python, FastAPI, PostgreSQL, Alembic, Docker, AWS, GitHub Actions]
cover: ./diagrams/livestock-brokerage.svg
coverAlt: "Web app and chat bot reach a FastAPI API through Caddy; the API uses PostgreSQL and stores lot videos in S3, and a scheduler purges expired videos"
coverCaption: "The platform as deployed: two clients, one API, and lot videos kept in S3 until a scheduled job expires them."
---

## The problem

A livestock commission house in Argentina ran its two businesses, slaughter and fattening, on WhatsApp, spreadsheets and paper.
Every deal went through several people, and prices, commissions and documents were rebuilt by hand each time.

## What I did

I was part of a small team that built the platform, and I owned the fattening side of the business end to end.
It centers on a marketplace of cattle lots: lots are published with videos that upload to S3, are validated asynchronously and expire after a retention period, and are shared through stable links.

## How it runs

FastAPI and PostgreSQL with Alembic migrations, in Docker on AWS, deployed from GitHub Actions.

## How I'd scale it

Today it runs as one API on a single host, which fits its traffic.
If the marketplace grew, these are the changes I would make, in order:
- Serve lot videos through CloudFront with signed URLs, so playback never touches the API.
- Move video validation and transcoding to a queue (SQS) with workers, so uploads return at once and a slow video cannot hold an API worker; jobs that keep failing land in a dead-letter queue to retry.
- Cache the marketplace listing and lot pages in Redis, invalidated when a lot changes, since lots are read far more often than they are written.
- Run several API instances behind a load balancer, which the stateless API already allows, and send reporting queries to a read replica.
