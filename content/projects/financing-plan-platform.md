---
title: "Financing plan platform"
summary: "A reusable financing plan backend, rebuilt from scratch with a hexagonal architecture and versioned migrations; I designed most of its database."
year: 2026
context: Work
domains: [Backend]
order: 4
live: true
confidential: true
stack: [Python, FastAPI, SQLAlchemy, Alembic, MySQL, AWS, Docker, pytest]
cover: ./diagrams/financing-plan-platform.svg
coverAlt: "Hexagonal architecture: HTTP API and scheduled jobs drive the domain, which reaches MySQL, payments, email and storage through ports"
coverCaption: "The domain sits in the middle; the database, payments, email and storage are adapters behind ports, so each can be swapped, or mocked in tests."
---

## Why a rewrite

The first platform kept its business rules in stored procedures that were changed by hand.
The rewrite moves them into a hexagonal application: the domain in the middle, and the database, payments, email and storage behind ports.

## What I did

I wrote about three quarters of the code and led the database design: all 39 Alembic migrations, from the initial schema to payments, interest, functional units and notifications.
- Subscriptions, plans, current accounts and installments.
- Payments, interest generation and payment reconciliation, with scheduled jobs.
- Functional units, from creation to assignment and delivery, and a service for stage transitions.
- Balance and interest notifications by email through SES, with PDF receipts and a preview.
- A test suite with unit, integration and contract tests, where payments and AWS are mocked behind their ports.

## How it runs

Python 3.13, FastAPI, Pydantic v2 and SQLAlchemy 2 on MySQL, with uv, ruff and mypy, in Docker on AWS.
