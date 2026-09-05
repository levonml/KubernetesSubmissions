#!/bin/bash
set -e

APP_NAME=$1
DOCKER_USER=$2
IMAGE="$DOCKER_USER/$APP_NAME"

if [ -z "$APP_NAME" ] || [ -z "$DOCKER_USER" ]; then
    echo "Usage: ./deploy.sh <app-name> <docker-user>"
    echo "Example: ./deploy.sh pong-o mydockeruser"
    exit 1
fi

echo "Building $IMAGE..."
docker build -t "$IMAGE" .

echo "Pushing $IMAGE..."
docker push "$IMAGE"

echo "Deployment successful!"

