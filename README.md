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

**tl;dr**  
Change this:
```javascript
const { dialog, app, BrowserWindow } = require('electron');

app.on('ready', function () {
  let win = new BrowserWindow({ show: true });
  
  /* ... */
  
  dialog.showOpenDialog(win, options, function (selectedPaths) {
    console.log(selectedPaths); // [ '/path/to/file/' ]
    
    /* ... */
    
  });
});
```

To this:
```javascript
const { app, BrowserWindow } = require('electron');
const bookmarks = require('electron-bookmarks');

app.on('ready', function () {
  let win = new BrowserWindow({ show: true });
  
  /* ... */
  
  bookmarks.showOpenDialog(win, options, function (selectedPaths) {
    console.log(selectedPaths); // [ '/path/to/file/' ]
    /**
     * `selectedPaths` is an array of paths (exactly like electron's API).
     * It has a `bookmarks` property in which you can find which bookmarks were 
     * created as the `keys` property.
     */
    console.log(selectedPaths.bookmarks); // { keys: [ 'bookmark::file:///path/to/file/' ], ... }
    
    /* ... */
    
  });
});
```

The `keys` property tells you which bookmarks have been saved to `NSUserDefaults` as `NSData` objects. These bookmarks are accessible across app restarts and allow your app to access files outside its sandbox provided you use the APIs correctly.

In order to use a saved bookmark you can use the `use(<key>)` function:
```javascript
// To be implemented and documented...
```


#### Roadmap and known issues

- [ ] Create `.showSaveDialog` API
- [ ] Create `.useBookmark` API
- [ ] Create `.getAll` API
- [ ] Create `.deleteBookmark` API
- [ ] Add support for `stale` bookmarks and refresh them.
- [ ] Support both `main` and `renderer` processes in electron.
