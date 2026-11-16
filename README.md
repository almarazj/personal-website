# personal-website

Source of my personal site: a static site built with Astro and hosted on AWS.

## How it works

- `content/` holds everything personal (profile, experience, projects) as Markdown, and `src/` holds the code that renders it.
  A schema in `src/content.config.ts` checks the content at build time, so a wrong field never reaches the site.
- The site is plain static files in a private S3 bucket, served through CloudFront; all of it is one CloudFormation stack in `infra/site.yml`.
- Pull requests are checked by GitHub Actions; every push to `main` triggers CodeBuild, which builds the site, uploads it to S3 and refreshes the CDN.
