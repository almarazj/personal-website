---
title: "juanalmaraz.dev"
summary: "This site: a static portfolio built with Astro, where content and code live apart so an agent can update it through pull requests, deployed to AWS on every merge."
year: 2026
context: Personal
domains: [Backend]
order: 1
live: true
stack: [Astro, TypeScript, S3, CloudFront, CloudFormation, CodeBuild, GitHub Actions, Playwright, Vitest]
links:
  - label: Source
    url: https://github.com/almarazj/personal-website
cover: ./diagrams/personal-website.svg
coverAlt: "An edit to content/ becomes a pull request checked by GitHub Actions; merging to main triggers CodeBuild, which uploads the built site to a private S3 bucket that CloudFront serves to visitors"
coverCaption: "An update is a pull request: checks run on GitHub, and a merge rebuilds the site and refreshes the CDN, with no server in between."
---

## Why

A portfolio is updated a few times a year, so it should cost nothing to run and be easy to change.
Everything personal lives in Markdown and YAML under `content/`, checked by a schema at build time, so an update is a small pull request that an agent can write.

## How it runs

Astro builds plain static pages, which sit in a private S3 bucket behind CloudFront.
Every merge to `main` triggers CodeBuild, which builds the site, uploads it and refreshes the CDN; the infrastructure is one CloudFormation stack.
Pull requests are checked by GitHub Actions with Vitest and Playwright end-to-end tests, and the footer links each page to the commit it was built from.
