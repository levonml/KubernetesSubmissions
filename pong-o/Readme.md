## The directory /tmp/kube must be created in order the app to work.

### command: docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube

## Then use Kustomization.yaml to run the project from the Project root ../

### command: kubectl apply -k .