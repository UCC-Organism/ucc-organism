# Build

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