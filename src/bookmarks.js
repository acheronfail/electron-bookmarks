import { app, BrowserWindow } from 'electron';
import path from 'path';
import $ from 'nodobjc';

import {
  moduleKey,
  checkImports,
  checkAppInitialized
} from './util';

/**
 * Return an array of all bookmarks saved in NSUserDefaults.
 * @return {array}
 */
export function list() {
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
        path: defaultsDictionary('objectForKey', $(key))('objectForKey', $('path'))('UTF8String')
      });
    }
  }

  return bookmarks;
};

/**
 * [open description]
 * @param  {[type]}   key       [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
export function open(key, callback) {
  checkAppInitialized();

  if (!key || typeof key !== 'string') {
    throw new TypeError(`Invalid bookmark value.\nBookmark.key must be of type "string", got "${key}"`);
  }

  if (!callback || typeof callback !== 'function') {
    throw new TypeError(`Callback must be of type "function", got "${key}"`);
  }

  checkImports();

  const defaults = $.NSUserDefaults('standardUserDefaults'),
        store = defaults('objectForKey', $(key)),
        data = store('objectForKey', $('bookmark')),
        type = store('objectForKey', $('type')),
        path = store('objectForKey', $('path'));

  if (!data || typeof data != 'function') {
    throw new TypeError(`Retrieved value from NSUserDefaults is not of type "NSData", got "${data}"`);
  }
  else if (!data('isKindOfClass', $.NSData)) {
    throw new TypeError(`Retrieved value from NSUserDefaults is not of type "NSData", got "${data('className')}"`);
  }

  // Convert bookmark data to NSURL.
  let error = $.alloc($.NSError, $.NIL).ref(),
      stale = $.alloc($.BOOL).ref(),
      isAppBookmark = type == 'app';

  const relativeToURL = isAppBookmark ? $.NIL : $.NSURL('fileURLWithPath', path, 'isDirectory', $.NO);
  const bookmarkData = $.NSURL('URLByResolvingBookmarkData', data,
                               'options', $.NSURLBookmarkResolutionWithSecurityScope,
                               'relativeToURL', relativeToURL,
                               'bookmarkDataIsStale', stale,
                               'error', error);

  // TODO: the (document-scoped) bookmark data must be placed and retrieved from the NSURL entry of the file itself!
  // console.log(relativeToURL, path);
  // console.log(bookmarkData);
  // console.log(error.deref());

  // Dereference the error pointer to see if an error has occurred. But this
  // may result in an error (null pointer exception ?), hence try/catch.
  try {
    const err = error.deref();
    console.error({ userInfo: err('userInfo'), context: bookmark });
    throw new Error(`[electron-bookmarks] Error opening bookmark:\nNativeError: ${err('localizedDescription')}`);
  }
  catch (err) {
    if (err.message.startsWith('[electron-bookmarks]')) throw err;
    // Ignore Dereferencing error.
  }

  // Is the bookmark stale?
  if (stale == $.YES) {
    replaceStaleBookmark(bookmarkData, store, defaults);
  }
  else if (!(stale instanceof Buffer)) {
    // TODO: We haven't been able to test stale bookmarks. I don't know if
    // there's a way to "make" a bookmark stale... So we log here in the chance
    // that when it's stale, and `stale != $.YES` we can see what it is.
    // That's my justification for being noisy here.
    console.log('STALE: ', stale);
    // In any case, attempt to replace it if we reach this point.
    replaceStaleBookmark(bookmarkData, store, defaults);
  }

  // Begin accessing the bookmarked resource outside of the sandbox.
  var didAccess = bookmarkData('startAccessingSecurityScopedResource');

  // Retain the object to ensure it's not garbage-collected.
  bookmarkData('retain');

  // If the user hasn't called the close function in 10 seconds, call it now.
  // This *MUST* be called, otherwise the OS makes bad things happen.
  const timeout = setTimeout(() => {
    close();
    throw new Error(`Bookmark has not been closed! You *MUST* do this otherwise your app will leak kernel resources.\nForce closing "${key}" now.`);
  }, 10e3);

  // The resource *MUST* be closed, and the object released.
  function close() {
    clearTimeout(timeout);
    // Stop accessing the bookmarked resource.
    if (didAccess) bookmarkData('stopAccessingSecurityScopedResource');
    // Release the object so it can be garbage-collected.
    bookmarkData('release');
  }

  // Call the user's callback passing a correct path and the close function.
  const filepath = bookmarkData('path')('UTF8String');
  callback(filepath, close);
};

/**
 * Deletes a bookmark with the passed key if it exists.
 */
export function deleteOne(key) {
  checkAppInitialized();
  checkImports();

  const defaults = $.NSUserDefaults('standardUserDefaults');
  defaults('removeObjectForKey', $(key));
};

/**
 * Deletes all bookmarks associated with the app.
 */
export function deleteAll(key) {
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
function replaceStaleBookmark(bookmarkData, store, defaults) {
  let error = $.alloc($.NSError, $.NIL).ref();
  const type = store('objectForKey', $('type')),
        path = store('objectForKey', $('path')),
        key = store('objectForKey', $('key')),
        isAppBookmark = type('UTF8String') == 'app';

  // Create new bookmark.
  const relativeToURL = isAppBookmark ? $.NIL : $.NSURL('fileURLWithPath', path, 'isDirectory', $.NO);
  const newData = bookmarkData('bookmarkDataWithOptions', $.NSURLBookmarkCreationWithSecurityScope,
                               'includingResourceValuesForKeys', $.NIL,
                               'relativeToURL', relativeToURL,
                               'error', error);

  // Dereference the error pointer to see if an error has occurred. But this
  // may result in an error (null pointer exception ?), hence try/catch.
  try {
    const err = error.deref();
    console.error(`[electron-bookmarks] Error replacing stale bookmark:\nNativeError: ${err('localizedDescription')}`);
    console.error({ userInfo: err('userInfo') });
    console.error('[electron-bookmarks] Removing stale bookmark since it cannot be replaced.');

    // Remove bookmark since it's not working and can't be replaced.
    defaults('removeObjectForKey', $(key));
    return;
  }
  catch (e) { /* it didn't error */ }

  // Save bookmark in place of the old one.
  const replacement = $.NSMutableDictionary('alloc')('init');
  replacement('setObject', path, 'forKey', $('path'));
  replacement('setObject', type, 'forKey', $('type'));
  replacement('setObject', newData, 'forKey', $('bookmark'));

  defaults('setObject', replacement, 'forKey', $(key));
  defaults('synchronize');
}
