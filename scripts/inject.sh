#!/usr/bin/env zsh

# If we haven't made any changes to native modules, we can just copy the js
# into the signed app bundle and run it.

# Remove the old "app" directory inside the app bundle.
rm -rf test/mas/SignedAndSandboxed.app/Contents/Resources/app

# Copy our js into the app.
cp -R test/app test/mas/SignedAndSandboxed.app/Contents/Resources/app

# Copy newly built lib into the app.
cp lib/electron-bookmarks.js test/mas/SignedAndSandboxed.app/Contents/Resources/app/node_modules/electron-bookmarks/lib/electron-bookmarks

# Done!
echo "Scripts injected!"
