# personal-website

Personal site of a backend developer: portfolio and resume, in English only.
A simple static site done well: no backend, no admin panel; content is edited in the repo, usually with an agent.

## Docs

- `README.md`: a short public overview of how the site works.
- `docs/design.md`: read before touching any UI; tokens, typography and each component's chosen behavior.

## Content and code

- `content/` holds everything personal (profile, experience, projects); `src/` holds only code and never hardcodes personal data.
- `src/content.config.ts` is the schema `content/` must satisfy; a mismatch fails the build.

## Stack

- Astro, static output only; interactive pieces are islands loaded with `client:visible`, so the rest ships zero JS.
- Hosting: private S3 bucket behind CloudFront (Origin Access Control); a CloudFront Function maps directory paths to their `index.html`, and missing paths get `404.html`.
- Infra: one CloudFormation stack, `infra/site.yml`.
- Deploy: CodeBuild on every pushed `v*` tag (for example `v1.2.0`), through a CodeConnections GitHub connection (IAM OIDC providers are blocked by the project SCPs).
- CI: GitHub Actions lints, runs the unit and E2E suites on every pull request, and lints the template with cfn-lint.

## Commands

- `pnpm dev`, `pnpm lint` (astro check + eslint), `pnpm build`, `pnpm test` (Vitest for logic), `pnpm e2e` (Playwright against the built site), `pnpm check` (all three).
- Tests check structure and behavior, never personal content (unit tests use a made-up profile), so `content/` can change without touching tests.
- Infra changes are applied by hand, never from CI:
  `aws cloudformation deploy --stack-name personal-website --template-file infra/site.yml --capabilities CAPABILITY_IAM --parameter-overrides ConnectionArn=<arn> Repository=almarazj/personal-website DomainName=juanalmaraz.dev CertificateArn=<arn>`
- The GitHub connection was created once with `aws codeconnections create-connection` and authorized in the console.
- CloudFront only reads certificates from `us-east-1`, where this account allows ACM but not CloudFormation, so the certificate lives outside the stack.
  It was requested once with `aws acm request-certificate --region us-east-1 --domain-name juanalmaraz.dev --subject-alternative-names www.juanalmaraz.dev --validation-method DNS`; ACM renews it on its own while its validation CNAMEs stay in Cloudflare.
- DNS is on Cloudflare: the apex and `www` are CNAMEs to the distribution with the proxy off, so CloudFront terminates TLS.

## Constraints

- AWS project Region is `us-east-2` (CloudFront is global); use the CLI profile `juanalmaraz`.
- Everything stays within the AWS free tier; the `monthly-1usd` budget alert is the guardrail.
  Any change that adds a billable resource needs explicit approval first.

## Git flow

- `main` is always deployable; a release is a semver `vX.Y.Z` tag on `main`, pushed by hand.
- Work happens on short-lived branches named `<type>/<slug>` (for example `feat/hero`) and merges through a pull request.
- One pull request per atomic change, with a green CI before merging.
