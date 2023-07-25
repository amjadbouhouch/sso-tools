#!/bin/bash

echo "Building site..."
yarn build
echo "Uploading site..."
duck -y --username sso-tools --upload ftps://uk.storage.bunnycdn.com/ dist/*
echo "Clearing CDN cache..."
curl -X POST -H "AccessKey: $BUNNY_PERSONAL" https://api.bunny.net/pullzone/782714/purgeCache
echo "Done."
