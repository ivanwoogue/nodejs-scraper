FROM mcr.microsoft.com/playwright:v1.54.0-noble

# Optional: switch to root only when necessary
USER root

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . /app/

RUN yarn playwright install

# Default user for running Playwright
# This user is created by the Playwright image and prevents any potential permission issues running browsers like Sandbox errors and security risks if container is compromised.
USER pwuser

# Default command (overridable by docker-compose or `docker run`)
CMD ["/bin/bash"]


# References:
# https://playwright.dev/docs/docker#recommended-docker-configuration