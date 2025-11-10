FROM node:23

# metadata
ARG VCS_REF
ARG BUILD_DATE
ARG PROJECT_NAME="polkadot-hub-app"

LABEL io.parity.image.authors="cicd-team@parity.io" \
    io.parity.image.vendor="Parity Technologies" \
    io.parity.image.title="${PROJECT_NAME}" \
    io.parity.image.description="Polkadot Hub App is a self-hosted web app for managing offices, meeting rooms, events, and people profiles." \
    io.parity.image.source="https://github.com/paritytech/${PROJECT_NAME}/blob/${VCS_REF}/Dockerfile" \
    io.parity.image.documentation="https://github.com/paritytech/${PROJECT_NAME}/blob/${VCS_REF}/README.md" \
    io.parity.image.revision="${VCS_REF}" \
    io.parity.image.created="${BUILD_DATE}"

# Working directory in the container
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . ./

EXPOSE 3000

CMD ["yarn", "production:run"]
