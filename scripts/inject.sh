#!/usr/bin/env zsh

# If we haven't made any changes to native modules, we can just copy the js
# into the signed app bundle and run it.
APP="test/mas/SignedAndSandboxed.app/Contents/Resources/app"

# Remove the old "app" directory inside the app bundle.
rm -rf $APP

# Copy our js into the app.
cp -R test/app $APP

# Copy newly built lib into the app.
cp lib/electron-bookmarks.js $APP/node_modules/electron-bookmarks/lib/electron-bookmarks.js

# Done!
echo "Scripts injected!"
