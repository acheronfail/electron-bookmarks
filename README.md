# Electron Bookmarks!

## This module enables you to use sandboxed [`Security-Scoped Bookmarks`](https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html#//apple_ref/doc/uid/TP40011195-CH4-SW18) inside of an electron application.

# ATTENTION:
**I'm not sure if this will be approved by the Mac App Store review process - since it uses `nodobjc` for native Objective-C runtime bindings. I'm in the process of releasing an app on the App Store that uses this module and will update this as soon as I know.**

# IMPORTANT:
**Please note this is experimental software, and is not currently ready for the production environment. It is currently under active development and its API may change from version to version without notice, until this reaches version 1.0.0**

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
bookmarks.open(myBookmark, function (allowedPath, close) {
  fs.writeFile('/path/to/file', 'foo', 'utf8', function (err) {
    if (err) throw err; // null
    else {
      // Yay! We have access outside the sandbox!
      // We can read/write to this file.
      
      // ...
      
      // Once finished, we the bookmark *MUST* be closed!
      close(); 
    }
  });
});
```

## Usage

### `bookmarks.showOpenDialog(window, options[, callback])`

**In order to use this you must do two things:** 
1. Pass `bookmarkType: 'app'` or `bookmarkType: 'document'` into the `options` argument. It will default to `"app"`.
2. Use `showOpenDialog`'s asynchronous API. There is currently no support for the synchronous API (nor will there be).

Usually electron's `dialog.showOpenDialog` will return an array of filenames. `electron-bookmarks` returns the same array but with an additional argument `bookmarks`.

`bookmarks.keys` tells you which bookmarks have just been saved to `NSUserDefaults` as `NSData` objects. These bookmarks are accessible across app restarts and allow your app to access files outside its sandbox _provided you use the APIs correctly_. Use these `keys` in `bookmarks.open(key, ...)`.


### `bookmarks.showSaveDialog()`

**Same as showOpenDialog, you must:** 
1. Pass `bookmarkType: 'app'` or `bookmarkType: 'document'` into the `options` argument. It will default to `"app"`.
2. Use `showOpenDialog`'s asynchronous API. There is currently no support for the synchronous API (nor will there be).

Usually electron's `dialog.showSaveDialog` will return a path. `electron-bookmarks` returns the same path but with an additional argument `bookmark`.

`bookmark.key` is the key that has just been saved to `NSUserDefaults` as an `NSData` object. This bookmark is accessible across app restarts and allow your app to access the file outside its sandbox _provided you use the APIs correctly_. Use this `key` in `bookmarks.open(key, ...)`.

### `bookmarks.open(key, callback)`

* `key` is a key returned from `bookmarks.showOpenDialog` or from `bookmarks.list`.
* `callback(allowedPath, close)`
  * `allowedPath` is the path you must use in order to access your file.
  * `close` **IMPORTANT:** this function **MUST** be called once you have finished using the file! If you do not remember to close this, _[kernel resources will be leaked](https://developer.apple.com/reference/foundation/nsurl/1417051-startaccessingsecurityscopedreso?language=objc)_ and your app will lose its ability to reach outside the sandbox completely, until your app is restarted.

### `bookmarks.list()`

This will return an array of all the keys that you've saved with `electron-bookmarks`. These can be used in order to gain access outside your sandbox.

### `bookmarks.delete(key)`

Simply delete a bookmark by its key.  
Returns `undefined`;

### `bookmarks.deleteAll()`

Removes all bookmarks associated with your app.
Returns `undefined`;

## Things to do

- [x] Create `.showSaveDialog` API
- [x] Create `.open` API
- [x] Create `.list` API
- [x] Create `.delete` API
- [x] Support both `main` and `renderer` processes in electron.
- [x] Add support for `stale` bookmarks and refresh them.
- [ ] Write Tests
- [ ] Test document scoped bookmarks
- [ ] Sometime in the future, create support for app groups ?
  - Store bookmarks in a place where they can be accessed by other apps.


#### To be documented: 
- bookmarks don't need to be used until next start of app
