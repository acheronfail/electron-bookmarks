#!/usr/bin/env zsh

set -e

# If we haven't made any changes to native modules, we can just copy the js
# into the signed app bundle and run it.
APP="test/mas/SignedAndSandboxed.app/Contents/Resources/app"

# Remove the old "app" directory inside the app bundle.
rm -rf $APP

# Copy our js into the app.
cp -R test/app $APP

# Copy newly built lib (with source map) into the app.
cp lib/electron-bookmarks.js $APP/node_modules/electron-bookmarks/lib/electron-bookmarks.js
cp lib/electron-bookmarks.js.map $APP/node_modules/electron-bookmarks/lib/electron-bookmarks.js.map

# Done!
echo "Scripts injected!"
