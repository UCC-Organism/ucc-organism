# bundles current code in ./build directory

mkdir build
cp static/index.html build/index.html
cp static/manifest.json build/manifest.json
cp src/settings.json build/settings.json
cp package.json build/package.json
cp icon.png build/icon.png
cp -r assets build/assets
cp -r data build/data