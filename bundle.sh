echo "1/4 Building UCCOrganism into build/"
mkdir build
echo "2/4 Copying static assets..."
cp static/index.html build/index.html
cp static/manifest.json build/manifest.json
cp src/settings.json build/settings.json
cp package.json build/package.json
cp icon.png build/icon.png
cp -r assets build/assets
cp -r data build/data
echo "3/4 Compiling JS..."
browserify -i plask --im -g brfs src/main.js -o build/main.web.js
echo "4/4 Done"