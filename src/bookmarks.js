const path = require('path');
const $ = require('nodobjc');

// Get electron objects whether in main or renderer process.
let electron = require('electron');
if (electron.remote) electron = electron.remote;
const { app, BrowserWindow } = electron;

const {
  moduleKey,
  checkImports,
  checkAppInitialized
} = require('./util');

/**
 * Return an array of all bookmarks saved in NSUserDefaults.
 * @return {array}
 */
module.exports.list = function () {
  checkAppInitialized();
  checkImports();

  const bookmarks = [],
        defaultsDictionary = $.NSUserDefaults('standardUserDefaults')('dictionaryRepresentation');

  const keys = defaultsDictionary('allKeys');

  for (let i = 0, c = keys('count'); i < c; i++) {
    const key = keys('objectAtIndex', i)('UTF8String');
    if (key.startsWith(moduleKey)) {
      bookmarks.push({
        key: key,
        type: defaultsDictionary('objectForKey', $(key))('objectForKey', $('type'))('UTF8String'),
        path: defaultsDictionary('objectForKey', $(key))('objectForKey', $('path'))('UTF8String');
      });
    }
  }

  return bookmarks;
};

/**
 * [open description]
 * @param  {[type]}   key [description]
 * @param  {Function} cb  [description]
 * @return {[type]}       [description]
 */
module.exports.open = function (key, cb) {
  checkAppInitialized();

  if (!key || typeof key !== 'string') {
    throw new TypeError(`Key must be of type "string", got "${key}"`);
  }

  if (!cb || typeof cb !== 'function') {
    throw new TypeError(`Callback must be of type "function", got "${key}"`);
  }

  checkImports();

  const defaults = $.NSUserDefaults('standardUserDefaults'),
        bookmarkStore = defaults('objectForKey', $(key)),
        data = bookmarkStore('objectForKey', $('bookmark'));

  if (!data || typeof data != 'function') {
    throw new TypeError(`Retrieved value from NSUserDefaults is not of type "NSData", got "${data}"`);
  }
  else if (!data('isKindOfClass', $.NSData)) {
    throw new TypeError(`Retrieved value from NSUserDefaults is not of type "NSData", got "${data('className')}"`);
  }

  // Convert bookmark data to NSURL.
  let error = $.alloc($.NSError).ref(),
      stale = $.alloc($.BOOL).ref();

  const bookmark = $.NSURL('URLByResolvingBookmarkData', data,
										 'options', $.NSURLBookmarkResolutionWithSecurityScope,
									   'relativeToURL', $.NIL, // TODO: this?
									   'bookmarkDataIsStale', stale,
									 	 'error', error);

  // Handle error.
  if (typeof error == 'function') {
    // TODO: handle error correctly.
  }

  // Is the bookmark stale?
  if (typeof stale == $.YES) {
    replaceStaleBookmark(bookmark, bookmarkStore, defaults);
  } else if (typeof stale != 'object') {
    // TODO: We haven't been able to test stale bookmarks. I don't know if
    // there's a way to "make" a bookmark stale... So we log here in the chance
    // that when it's stale, and `stale != $.YES` we can see what it is.
    console.log('STALE: ', stale);
  }

  // Begin accessing the bookmarked resource outside of the sandbox.
  var didAccess = bookmark('startAccessingSecurityScopedResource');

  // Retain the object to ensure it's not garbage-collected.
  bookmark('retain');

  // If the user hasn't called the close function in 10 seconds, call it now.
  // This *MUST* be called, otherwise the OS makes bad things happen.
  const timeout = setTimeout(() => {
    close();
    throw new Error('Bookmark has not been closed! You *MUST* do this otherwise your app will leak kernel resources.\nForce closing now.');
  }, 10e3);

  // The resource *MUST* be closed, and the object released.
  function close() {
    clearTimeout(timeout);
    // Stop accessing the bookmarked resource.
    if (didAccess) bookmark('stopAccessingSecurityScopedResource');
    // Release the object so it can be garbage-collected.
    bookmark('release');
  }

  // Call the user's callback passing a correct path and the close function.
  const filepath = bookmark('path')('UTF8String');
  cb(filepath, close);
};

/**
 * Deletes a bookmark with the passed key if it exists.
 */
module.exports.delete = function (key) {
  checkAppInitialized();
  checkImports();

  const defaults = $.NSUserDefaults('standardUserDefaults');
  defaults('removeObjectForKey', $(key));
};

/**
 * Deletes all bookmarks associated with the app.
 */
module.exports.deleteAll = function (key) {
  checkAppInitialized();
  checkImports();

  const defaults = $.NSUserDefaults('standardUserDefaults'),
        keys = defaults('dictionaryRepresentation')('allKeys');

  for (let i = 0, c = keys('count'); i < c; i++) {
    const key = keys('objectAtIndex', i)('UTF8String');
    if (key.startsWith(moduleKey)) {
      defaults('removeObjectForKey', $(key));
    }
  }
};

// [from Apple's Docs] We should create a new bookmark using the returned URL
// and use it in place of any stored copies of the existing bookmark.
function replaceStaleBookmark(bookmark, store, defaults) {
  let error = $.alloc($.NSError).ref();
  const type = store('objectForKey', $('type')),
        path = store('objectForKey', $('path')),
        key = store('objectForKey', $('key')),
        isAppBookmark = type('UTF8String') == 'app';

  // Create new bookmark.
  const newData = bookmark('bookmarkDataWithOptions', $.NSURLBookmarkCreationWithSecurityScope,
                           'includingResourceValuesForKeys', $.NIL,
                           'relativeToURL', isAppBookmark ? $.NIL : bookmark('path'),
                           'error', error);

  // Save bookmark in place of the old one.
  const replacement = $.NSMutableDictionary('alloc')('init');
  replacement('setObject', path, 'forKey', $('path'));
  replacement('setObject', type, 'forKey', $('type'));
  replacement('setObject', newData, 'forKey', $('bookmark'));

  defaults('setObject', replacement, 'forKey', $(key));
  defaults('synchronize');
}
