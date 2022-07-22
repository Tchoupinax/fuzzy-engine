docker-build:
  export VERSION=$(cat package.json | jq '.version' -r)
  docker buildx build --platform linux/amd64,linux/arm64 -t tchoupinax/fuzzy-engine:latest . --push
  docker buildx build --platform linux/amd64,linux/arm64 -t tchoupinax/fuzzy-engine:$VERSION . --push
