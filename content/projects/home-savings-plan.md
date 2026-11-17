---
title: "Home savings plan platform"
summary: "Backend for a home savings plan: onboarding, contracts, indexed monthly installments, QR payments and reconciliation, delinquency and home allocation."
year: 2025
context: Work
domains: [Backend]
order: 3
live: true
confidential: true
stack: [Python, FastAPI, SQLAlchemy, MySQL, AWS, Docker, GitHub Actions]
cover: ./diagrams/home-savings-plan.svg
coverAlt: "Back office and portal call a FastAPI API that uses MySQL, a QR payments service in front of the bank, and PDF documents in S3, with scheduled jobs for reconciliation"
coverCaption: "The backend as deployed: back office and subscriber portal share one API, which reaches the bank only through the QR payments service."
---

## The product

A savings plan lets subscribers pay monthly installments, indexed to a unit of value, until they are allocated a home by raffle or bid.
The system runs that whole lifecycle for a back office and a subscriber portal.

## What I did

I worked on the backend for a year, owning features end to end, and on the MySQL schema and its stored procedures.
- Payment reconciliation for QR payments through a bank's API, with error handling and expiry of unpaid debts.
- Advance payments: manual, cancelled, regenerated and settled.
- The subscriber portal: dashboard, current account, receipts, documents and notifications.
- Notifications for raffles and group events, with PDF attachments.
- PDF receipts and contracts generated from templates.
- Delinquency reports and audits of every sensitive procedure.
- Roles and permissions, password recovery, and home allocation through delivery.

## How it runs

FastAPI on Python, MySQL on RDS with migrations run from GitHub Actions, PDFs with WeasyPrint, scheduled jobs with APScheduler, and logs in S3.

## How I'd harden the payments

Payments are where a mistake costs real money, so this is where I would invest next:
- Receive the bank's payment notifications into a queue and apply them with idempotent workers keyed by the bank's payment ID, so a notification delivered twice is applied once.
- Write each payment and its follow-ups (receipt, notification) in one transaction with an outbox table and publish from there, so a crash between steps cannot leave a payment without its receipt.
- Keep the scheduled reconciliation as a safety net that compares the bank's records with ours and flags differences instead of fixing them silently.
- Retry calls to the bank with backoff behind a circuit breaker, and send what still fails to a dead-letter queue with an alert.
- Cache read-heavy values such as the current unit of value, and move reports to a read replica.
