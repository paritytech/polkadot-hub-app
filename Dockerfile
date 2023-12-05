FROM node:latest

ARG VCS_REF=master
ARG BUILD_DATE=""
ARG REGISTRY_PATH="harbor.parity-mgmt.parity.io/parity-internal"
ARG PROJECT_NAME=""

LABEL io.parity.image.authors="cicd-team@parity.io" \
    io.parity.image.vendor="Parity Technologies" \
    io.parity.image.title="${REGISTRY_PATH}/${PROJECT_NAME}" \
    io.parity.image.description="${PROJECT_NAME}" \
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
