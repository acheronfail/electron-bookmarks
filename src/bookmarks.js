const path = require('path');
const $ = require('nodobjc');

// Get electron objects whether in main or renderer process.
let electron = require('electron');
if (electron.remote) electron = electron.remote;
const { app, BrowserWindow } = require('electron');

const { checkImports, checkAppInitialized } = require('./util');

/**
 * Return an array of all bookmarks saved in NSUserDefaults.
 * @return {array}
 */
module.exports.list = function () {
  checkAppInitialized();
  checkImports();

  const bookmarks = [];

  const keys = $.NSUserDefaults('standardUserDefaults')('dictionaryRepresentation')('allKeys');
  for (let i = 0, c = keys('count'); i < c; i++) {
    const item = keys('objectAtIndex', i)('UTF8String');
    if (item.startsWith('bookmark::')) bookmarks.push(item);
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

  const defaults = $.NSUserDefaults('standardUserDefaults');

  const data = defaults('objectForKey', $(key));
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

  // TODO: handle error correctly.
  if (typeof error == 'function') {
    // handle error.
  }

  // TODO: handle stale bookmark correctly.
  // console.log('stale', typeof stale);

  // Begin accessing the bookmarked resource outside of the sandbox.
  var didAccess = bookmark('startAccessingSecurityScopedResource');

  // Retain the object to ensure it's not garbage-collected.
  bookmark('retain');

  // If the user hasn't called the stop function in 10 seconds, call it now.
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

  // Call the user's callback passing a correct path and the stop function.
  const filepath = bookmark('absoluteString')('UTF8String').substr(7);
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
