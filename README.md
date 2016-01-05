# UCC Organism

UCC Organism is the client visualization showing UCC as an organism

Credits:
Marcin Ignac
BG Staal

# Build for local testing

1 Install and prepare the client build
```
git clone https://github.com/UCC-Organism/ucc-organism
cd ucc-organism
npm install
./bundle.sh
```

2 Start the test server as described below

3 Run the client with continuous compilation on source code change
```
npm run watch
#the browser should open at http://localhost:3001
```

# Build for Odroid

```
cd /Users/vorg/Dev/crosswalk-odroid/
python make_apk.py --enable-auto-update --enable-remote-debugging --manifest=/Users/vorg/Workspace/var-uccorganism/ucc-organism/build/manifest.json --extensions=extensions/ucc_extension
```

# Uploading to ODroid

ssh root@192.168.0.19
cd /sdcard/Downloads
pm install ucc_organism-2016010103.apk

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

# Key bindings

- `g` show/hide the overlays
- left-arrow / right-arrow switch floor (floor "-1" = all floors at once)
