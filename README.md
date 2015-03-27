# UCC Organism

UCC Organism is the client visualization showing UCC as an organism

# Build for local testing

Install and build the client
```
git clone https://github.com/UCC-Organism/ucc-organism
cd ucc-organism
npm install
//this will go into build.sh at some point
mkdir build
cp static/index.html build/index.html
cp src/settings.json build/settings.json
cp -r assets build/assets
cp -r data build/data
```

Start the test server as described below

Run the client
```
npm run watch
```

# Build for Odroid

```
python make_apk.py --package=dk.ucc.organism --enable-remote-debugging --manifest=/Users/vorg/Workspace/var-uccorganism/ucc-organism/build/manifest.json --extensions=extensions/ucc_extension
```

python make_apk.py --manifest=/Users/vorg/Workspace/var-uccorganism/ucc-organism/build/manifest.json

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