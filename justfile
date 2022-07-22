docker-build:
  docker buildx build --platform linux/amd64,linux/arm64 -t tchoupinax/fuzzy-engine:latest . --push
  docker buildx build --platform linux/amd64,linux/arm64 -t tchoupinax/fuzzy-engine:$(cat package.json | jq '.version' -r) . --push
