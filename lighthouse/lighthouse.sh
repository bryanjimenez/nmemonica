#!/bin/bash

# https://github.com/GoogleChrome/lighthouse#using-the-node-cli
# sudo npm install -g lighthouse

# https://github.com/GoogleChrome/lighthouse#using-the-node-module
lighthouse --chrome-flags="--no-sandbox --headless" --quiet --view https://bryanjimenez.github.io/nmemonica/

