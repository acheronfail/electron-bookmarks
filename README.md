# `electron-bookmarks`

## This module enables you to use sandboxed [`Security-Scoped Bookmarks`](https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html#//apple_ref/doc/uid/TP40011195-CH4-SW18) inside of an electron application.

# ATTENTION:
**I'm not sure if this will be approved by the Mac App Store review process - since it uses `nodobjc` for native Objective-C runtime bindings. I'm in the process of releasing an app on the App Store that uses this module and will update this as soon as I know.**

### Installation

Super easy.
```bash
npm install --save electron-bookmarks
```

### Usage

This module was created to be a drop-in-replacement for electron's `dialog` module. In order to create a security-scoped bookmark you have to use Use Apple's `Powerbox` API, which is used transparently in the background by `NSOpenPanel` (and `NSSavePanel`). Thus, the need to re-create electron's `dialog` module in order to have access to the `NSURL` class returned by it.

#### tl;dr

**Change this:**
```javascript
const { dialog, app, BrowserWindow } = require('electron');

app.on('ready', function () {
  let win = new BrowserWindow({ show: true });
  
  /* ... */
  
  dialog.showOpenDialog(win, options, function (filenames) {
    console.log(filenames); // [ '/path/to/file/' ]
    
    /* ... */
    
  });
});
```

**To this:**
```javascript
const { app, BrowserWindow } = require('electron');
const bookmarks = require('electron-bookmarks');

app.on('ready', function () {
  let win = new BrowserWindow({ show: true });
  
  /* ... */
  
  bookmarks.showOpenDialog(win, options, function (filenames) {
    console.log(filenames); // [ '/path/to/file/' ]
    /**
     * `filenames` is an array of paths (exactly like electron's API).
     * It has a `bookmarks` property in which you can find which bookmarks were 
     * created as the `keys` property.
     */
    console.log(filenames.bookmarks); // { keys: [ 'bookmark::file:///path/to/file/' ], ... }
    
    /* ... */
    
  });
});
```

**And this:**
```javascript
const fs = require('fs');

fs.writeFile('/path/to/file', 'foo', 'utf8', function (err) {
  if (err) throw err; // Error: EPERM: operation not permitted, access '/path/to/file'
  else {
    // ...
  }
});
```


**To this:**
```javascript
const fs = require('fs');
const bookmarks = require('electron-bookmarks');

bookmarks.open(myBookmark, function (allowedPath, close) {
  fs.writeFile('/path/to/file', 'foo', 'utf8', function (err) {
    if (err) throw err; // null
    else {
      close();
      // Yay! We have access outside the sandbox!
    }
  });
});
```

#### `bookmarks.showOpenDialog(<`[`see here`](https://github.com/electron/electron/blob/master/docs/api/dialog.md)`>)`

Usually electron's `dialog.showOpenDialog` will return an array of filenames. `electron-bookmarks` returns the same array but with an additional `bookmarks` property attached.

`filenames.bookmarks.keys` tells you which bookmarks have just been saved to `NSUserDefaults` as `NSData` objects. These bookmarks are accessible across app restarts and allow your app to access files outside its sandbox _provided you use the APIs correctly_. Use these `keys` in `bookmarks.open(key, ...)`.


#### `bookmarks.showSaveDialog()`
**Not yet implemented**

#### `bookmarks.open(key, callback)`

* `key` is a key returned from `bookmarks.showOpenDialog` or from `bookmarks.list`.
* `callback(allowedPath, close)`
  * `allowedPath` is the path you must use in order to access your file.
  * `close` **IMPORTANT:** this function **MUST** be called once you have finished using the file! If you do not remember to close this, _[kernel resources will be leaked](https://developer.apple.com/reference/foundation/nsurl/1417051-startaccessingsecurityscopedreso?language=objc)_ and your app will lose its ability to reach outside the sandbox completely, until your app is restarted.

#### `bookmarks.list()`

This will return an array of all the keys that you've saved with `electron-bookmarks`. These can be used in order to gain access outside your sandbox.

#### `bookmarks.delete(key)`

**Not yet implemented**

### Roadmap and known issues

- [ ] Create `.showSaveDialog` API
- [x] Create `.open` API
- [x] Create `.list` API
- [ ] Create `.delete` API
- [ ] Add support for `stale` bookmarks and refresh them.
- [ ] Support both `main` and `renderer` processes in electron.
