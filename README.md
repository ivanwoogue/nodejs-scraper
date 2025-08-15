# Amazon Scraper

A Node.js scraper that searches Amazon and extracts product information. Given any number of search terms, it retrieves the first 5 items from each search result, capturing only the title and price of each product.

## Features

- Scrapes Amazon search results for unlimited search terms
- Extracts first 5 products per search query
- Captures product title and price only
- Concurrent processing with rate limiting
- Retry mechanism for failed requests
- Docker support for consistent environments
- Type-safe with Zod validation

## Tech Stack

- **Node.js** - Runtime environment
- **Playwright** - Web scraping and browser automation
- **Zod** - Schema validation
- **p-limit** - Concurrency control
- **p-retry** - Retry logic
- **Docker** - Containerization
- **Fixture** - Test data management

## Installation and Setup

```bash
# Install dependencies
yarn install

# Run the docker container. You can execute the commands in this container.
yarn playwright-root
```

## Helpful commands:

**Note:** These can ran inside the Docker container as long as DEBUG in .env is false
```bash
yarn dev
# Executes the scraper

yarn playwright test
# Runs the end-to-end tests.

yarn playwright test --ui
# Starts the interactive UI mode.

yarn playwright test --project=chromium
# Runs the tests only on Desktop Chrome.

yarn playwright test example
# Runs the tests in a specific file.

yarn playwright test --debug
# Runs the tests in debug mode.

yarn playwright codegen
# Auto generate tests with Codegen.
```
