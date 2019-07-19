# Quantum Manager - desktop application for QUANTUM device

## How to use

To clone and run Quantum Manager you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer.
From your command line:

```bash
# Clone this repository
git clone https://github.com/SecurityArts/QuantumManager
# Go into the repository
cd QuantumManager
# Install dependencies
npm install
# Run the app
npm start
```

Quantum Manager uses [node-hid](https://github.com/node-hid/node-hid) to access USB HID devices from Node.js.
For most "standard" use cases node-hid will install nice and easy.
For special cases please visit [installation](https://github.com/node-hid/node-hid#installation) page.

## How to build executable

From your command line:

```bash
# Run build script
npm run dist
```

Project will be built for a platform you are running script from.
Result will be located at /dist folder.

Or just download build executable for your OS from [download](https://security-arts.com/download) page

## Supported platforms
 - Windows x64
 - Mac OS x64
 - Linux x64