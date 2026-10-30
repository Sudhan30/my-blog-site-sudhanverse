#!/usr/bin/env bash
set -euo pipefail

# Standalone K3s build + multi-node containerd import script for blog.sudharsana.dev
# Usage: ./scripts/deploy-k3s.sh [infra-repo-path]

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SHA="$(git rev-parse --short=7 HEAD)"
TAG="docker.io/sudhan03/blog-site:blog-${SHA}"
INFRA_DIR="${1:-/home/sudhan0312/Desktop/my-blog-site-cluster-infra}"

echo "==> Building image ${TAG} (docker format to preserve HEALTHCHECK)..."
sudo podman build --format docker -t "${TAG}" .

echo "==> Importing ${TAG} into local k3s containerd (suddu-server)..."
sudo podman save --format docker-archive "${TAG}" | sudo k3s ctr images import -

if [ -d "${INFRA_DIR}/clusters/prod/apps/blog" ]; then
  echo "==> Updating deployment manifest in ${INFRA_DIR}..."
  sed -i "s|image: docker.io/sudhan03/blog-site:.*|image: ${TAG}|g" "${INFRA_DIR}/clusters/prod/apps/blog/deployment.yaml"
  kubectl apply -f "${INFRA_DIR}/clusters/prod/apps/blog/deployment.yaml" --dry-run=client
  kubectl apply -f "${INFRA_DIR}/clusters/prod/apps/blog/deployment.yaml"
  kubectl rollout status deploy/blog -n web --timeout=120s
fi

echo "==> Done! Deployed ${TAG}"
