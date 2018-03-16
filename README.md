# Electron Bookmarks!

# Please Note!

This functionality has been added into Electron itself here: https://github.com/electron/electron/pull/11711
This package should no longer be used (it wasn't ever stable anyway), so just use Electron 2.0.0 or greater.

---

<br />
<br />
<br />
<br />

---

## This module enables you to use sandboxed [`Security-Scoped Bookmarks`](https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html#//apple_ref/doc/uid/TP40011195-CH4-SW18) inside of an electron application.

# NEED TO KNOW
* This module only supports `app-scoped` bookmarks at this time. (`document-scoped` bookmarks are planned, but their implementation may be more difficult).

# IMPORTANT:
**Please note this is experimental software, and is not currently ready for the production environment. It is currently under active development and its API may change from version to version without notice, until this reaches version 1.0.0 (if it ever does)**

# LASTLY:
**Due to the way Objective-C is bridged to the Node process, you *MUST* use this module in `electron`'s main process. It _will not work_ in the renderer process.**

## Installation

Super easy.
```bash
npm install --save electron-bookmarks
```

## Introduction

This module was created to be a drop-in-replacement for electron's `dialog` module. In order to create a security-scoped bookmark you have to use Use Apple's `Powerbox` API, which is used transparently in the background by `NSOpenPanel` (and `NSSavePanel`). Thus, the need to re-create electron's `dialog` module in order to have access to the `NSURL` class returned by it.

You **must** have the correct entitlements (either `com.apple.security.files.bookmarks.document-scope` or `com.apple.security.files.bookmarks.app-scope` in conjunction with `com.apple.security.files.user-selected.read-write`) in your signed electron app ([see here for more information](https://github.com/electron-userland/electron-osx-sign/wiki/3.-App-Sandbox-and-Entitlements)), it **must** have been already packaged for the `mas platform`, and of course, this only runs on `macOS`.

#### tl;dr

**Change this:**
```javascript
let win = new BrowserWindow();
dialog.showOpenDialog(win, { /* ... */ }, (filenames) => {
  console.log(filenames); // [ '/path/to/file/' ]
});
```

**To this:**
```javascript
const bookmarks = require('electron-bookmarks');
bookmarks.showOpenDialog(win, { bookmarkType: 'app', /* ... */ }, (filenames, bookmarks) => {
  console.log(filenames); // [ '/path/to/file/' ]
  console.log(bookmarks); // { keys: [ 'bookmark::file:///path/to/file/' ], ... }
});
```

**And this:**
```javascript
fs.writeFile('/path/to/file', 'foo', 'utf8', function (err) {
  if (err) throw err; // Error: EPERM: operation not permitted, access '/path/to/file'
  else {
    // ...
  }
});
```


**To this:**
```javascript
const bookmarks = require('electron-bookmarks');
bookmarks.startAccessingSecurityScopedResource(myBookmark, function (allowedPath, stopAccessingSecurityScopedResource) {
  fs.writeFile('/path/to/file', 'foo', 'utf8', function (err) {
    if (err) throw err; // null
    else {
      // Yay! We have access outside the sandbox!
      // We can read/write to this file.
      
      // ...
      
      // Once finished, the access to the bookmark *MUST* be stopped!
      stopAccessingSecurityScopedResource(); 
    }
  });
});
```

## Usage

Note that initialisation of this module may take some time, since it has to bridge Node to Objective-C and setup all the runtime calls. For this reason `bookmarks.init()` has been provided, so you can initialise it in your app at a convenient time. If you don't call this, `bookmarks` will be initialised the first time you use any of its methods.

### `bookmarks.showOpenDialog(window, options[, callback])`

**In order to use this you must do two things:** 
1. Pass `bookmarkType: 'app'`. Default is `"app"` (the value `"document"` will - hopefully - be supported in the future).
2. Use `showOpenDialog`'s asynchronous API. There is currently no support for the synchronous API (nor will there be).

Usually electron's `dialog.showOpenDialog` will return an array of filenames. `electron-bookmarks` returns the same array but with an additional argument `bookmarks`.

`bookmarks.keys` tells you which bookmarks have just been saved to `NSUserDefaults` as `NSData` objects. These bookmarks are accessible across app restarts and allow your app to access files outside its sandbox _provided you use the APIs correctly_. Use these `keys` in `bookmarks.open(key, ...)`.


### `bookmarks.showSaveDialog()`

**Important!**  
`bookmarks.showSaveDialog()` will **_create the file at the path you select_** in the dialog, since a bookmark cannot be created without a file. Therefore, remember that after using `bookmarks.showSaveDialog()` you will be reading or writing to an already existing file.

**Otherwise the same as showOpenDialog, you must:** 
1. Pass `bookmarkType: 'app'`. Default is `"app"` (the value `"document"` will - hopefully - be supported in the future).
2. Use `showOpenDialog`'s asynchronous API. There is currently no support for the synchronous API (nor will there be).

Usually electron's `dialog.showSaveDialog` will return a path. `electron-bookmarks` returns the same path but with an additional argument `bookmark`.

`bookmark.key` is the key that has just been saved to `NSUserDefaults` as an `NSData` object. This bookmark is accessible across app restarts and allow your app to access the file outside its sandbox _provided you use the APIs correctly_. Use this `key` in `bookmarks.startAccessingSecurityScopedResource(key, ...)`.

### `bookmarks.startAccessingSecurityScopedResource(key, callback)`

* `key` is a key returned from `bookmarks.showOpenDialog` or from `bookmarks.list`.
* `callback(allowedPath, stopAccessingSecurityScopedResource)`
  * `allowedPath` is the path you must use in order to access your file.
  * `stopAccessingSecurityScopedResource` **IMPORTANT:** this function **MUST** be called once you have finished using the file! If you do not remember to stop accessing the bookmark, _[kernel resources will be leaked](https://developer.apple.com/reference/foundation/nsurl/1417051-startaccessingsecurityscopedreso?language=objc)_ and your app will lose its ability to reach outside the sandbox completely, until your app is restarted.

### `bookmarks.list()`

This will return an array of all the keys that you've saved with `electron-bookmarks`. These can be used in order to gain access outside your sandbox.

### `bookmarks.deleteOne(key)`

Simply delete a bookmark by its key.  
Returns `undefined`;

### `bookmarks.deleteAll()`

Removes all bookmarks associated with your app.
Returns `undefined`;

### `bookmarks.init()`

Links the runtime Objective-C to Node. May take up to a second to complete.

## Things to do

- [ ] Add support for document-scoped bookmarks (seems tricky)
  -  Note that "document-scoped" bookmarks are *scoped* to *each* document, so we'll have to attach the bookmarks to the each document's NSURL entry. I'm not currently sure of a good way to get an NSURL entry nicely.
- [ ] Attempt to support app groups and shared bookmarks ?


#### To be documented: 
- bookmarks don't need to be used until next start of app


# License

MIT
