#!/bin/bash
set -e

APP_NAME=$1


if [ -z "$APP_NAME" ]; then
    echo "Usage: ./restart.sh <app-name>"
    echo "Example: ./restart.sh log-output"
    exit 1
fi

echo "Restarting Kubernetes deployment..."
kubectl rollout restart deployment/"$APP_NAME"

echo "Waiting for rollout..."
kubectl rollout status deployment/"$APP_NAME"

echo "Deployment successful!"

