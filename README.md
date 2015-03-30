# UCC Organism

UCC Organism is the client visualization showing UCC as an organism

Credits:
Marcin Ignac
BG Staal

# Build for local testing

1 Install and build the client
```
git clone https://github.com/UCC-Organism/ucc-organism
cd ucc-organism
npm install
#this will go into build.sh at some point
mkdir build
cp static/index.html build/index.html
cp static/manifest.json build/manifest.json
cp static/package.json build/package.json
cp src/settings.json build/settings.json
cp -r assets build/assets
cp -r data build/data
```

2 Start the test server as described below

3 Run the client
```
npm run watch
#the browser should open at http://localhost:3001
```

# Build for Odroid

```
cd /Users/vorg/Dev/crosswalk-odroid/
python make_apk.py --enable-auto-update --enable-remote-debugging --package=dk.ucc.organism --manifest=/Users/vorg/Workspace/var-uccorganism/ucc-organism/build/manifest.json
```

# Data

## Running a test server

Install the source

```
git clone https://github.com/ucc-organism/uccorg-backend
cd uccorg-backend
npm install
```

Install coffescript compiler

`npm install coffee-script -g`

Run the server

`coffee uccorg-backend.coffee dev.json`

That should open a server at [http://localhost:8080]()

## Static Data requests

[/current-state](http://localhost:8080/current-state)

We use library called *faye*.