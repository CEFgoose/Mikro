# Cluster Requirements

You need the following:

- [cert-manager](https://cert-manager.io/docs/installation/kubernetes/)
  My preferred installation method is with `helm`, e.g.<br>
  `kubectl create namespace cert-manager && helm repo add jetstack https://charts.jetstack.io && helm repo update && helm install cert-manager jetstack/cert-manager --namespace cert-manager --version ${VERSION} --set installCRDs=true`

Don't forget to replace `${VERSION}` with the current cert-manager version (as of writing, `v1.2.0`).
See [cert-manager releases](https://github.com/jetstack/cert-manager/releases) for current releases.

At this point, you can start applying the yaml files.

# Yaml order

Preferred order:

1. letsencrypt (in order for the required pods and services to be spun up for cert-manager)
2. namespace.yaml (required to be added prior to database, frontend, and backend)
3. database (not currently used)
4. backend
5. frontend
6. ingress.yaml (last, so that the cert-manager service is hopefully done spinning up)

# Suggested commands to run

```bash
VERSION="v1.2.0"
kubectl create namespace cert-manager && helm repo add jetstack https://charts.jetstack.io && helm repo update && helm install cert-manager jetstack/cert-manager --namespace cert-manager --version ${VERSION} --set installCRDs=true
kubectl apply -f letsencrypt/staging.yaml
kubectl apply -f letsencrypt/production.yaml
kubectl apply -f namespace.yaml
kubectl apply -n mikro -f backend/deployment.yaml
kubectl apply -n mikro -f backend/service.yaml
kubectl apply -n mikro -f frontend/deployment.yaml
kubectl apply -n mikro -f frontend/service.yaml
kubectl apply -n mikro -f ingress.yaml
```
