# Quick Start

1.  `git clone git@github.com:paritytech/parity-portal-hq.git && cd parity-portal-hq`

2.  Run the following command, which will run the docker compose configuration from the `docker-compose-demo.yml` file, which uses `ghcr.io/piggydoughnut/hqapp:latest` image. This runs a demo app with preset configuration.

    ```
     DATABASE_URI=postgresql://test:test@postgres/test \
     JWT_SECRET=very-secret \
     PORT=3000 \
     APP_HOST=http://localhost:3000 \
     NODE_ENV=production \
     bash ./start.sh --demo

    ```

3.  Go to http://localhost:3000

## 1. Prerequisites

The quickest and easiest way to run HQ is using Docker. You can find Docker installation instructions [here](https://docs.docker.com/get-docker/).

If you don't want to use Docker you can run the project from source.

## 2. Run the project

### Quick configure

1.  `cp .example.env .env`

    Main variables to set: `DATABASE_URI`, `JWT_SECRET`, `PORT`, `APP_HOST`, and `SUPERUSERS`

2.  `cp config-default config`

    Your project configuration folder. Adjust to your needs.
    Todo: add link to configuration explanation doc

### Docker

    docker compose -f docker-compose.yml up

or use the start script (does exactly the same)

    bash start.sh

Check Docker Application logs

    docker-compose logs -f app

Check Docker Database logs

    docker-compose logs -f postgres

### Run From Source

Make sure to set `DATABASE_URI` in `.env`

    yarn && yarn migrations:up && yarn production:run

## 3. Configuration

### 3.1 Database

#### 3.1.1 Credentials

The current database credentials are set to sample credentials inside `docker-compose.yml` file. Change them to secure credentials.

It is important to create a separate database user to interact with your database and not leave it to the default user with maximum privileges.

#### 3.1.2 Local data location

Your postgres database will persist its state between container restarts. It is mapped to a local `./postgres_data` directory. The `postgres_data` directory will be in the same directory where you run `docker compose` from.

You can change this folder by editing `docker-compose.yml` file and specify your own local directory instead of `./postgres_data`. Look for the line with `./postgres_data:/var/lib/postgresql/data`

#### 3.1.3 Remote database

If you already have your own database setup you can just set `DATABASE_URI` to point to your database inside `.env` file and pull the latest image.

`DATABASE_URI=postgresql://postgresuser:postgrespassword@host/postgresdatabasename`

Then run Docker like this:

    docker run ghcr.io/piggydoughnut/hqapp:latest

## 4. Development

### 4.1 Building Source with Docker

To use the current source code instead of the published image, use `docker-compose-dev.yml`.

    docker compose -f docker-compose-dev.yml build --no-cache

    bash start.sh --dev

### 4.2 Building source with hot reload

    yarn && yarn migrations:up && yarn hotreload

### 4.3 Publish new Docker version

1.  Build the image using Dockerfile

        docker build ./ --no-cache -t ghcr.io/username/containername:v-[VERSION_NUMBER] -t ghcr.io/username/containername:latest

2.  Login to the Github Container Registry. [Creating a personal access token(classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)

        docker login --username your-user-name --password your-github-token ghcr.io

3.  Push the image with its tags

        docker push ghcr.io/username/containername:latest

        docker push ghcr.io/username/containername:v-[VERSION_NUMBER]
