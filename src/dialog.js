import crypto from 'crypto';
import path from 'path';
import $ from 'nodobjc';
import fs from 'fs';

import {
  exists,
  moduleKey,
  checkImports,
  checkArguments,
  checkAppInitialized
} from './util';

const fileDialogProperties = {
  openFile: 1 << 0,
  openDirectory: 1 << 1,
  multiSelections: 1 << 2,
  createDirectory: 1 << 3,
  showHiddenFiles: 1 << 4,
  promptToCreate: 1 << 5,
  noResolveAliases: 1 << 6
};

/**
 * Clone of dialog.showOpenDialog which uses bookmarks.
 * @param  {BrowserWindow} win  - Optional;
 * @param  {Object}   		 opts - Optional;
 * @param  {Function} 		 cb   - Optional; if not given will be synchronous(?)
 */
export function showOpenDialog(win, opts, cb) {
  checkAppInitialized();

  checkArguments(win, opts, cb);

  if (typeof cb != 'function') {
    throw new TypeError('Callback must be a function');
  }

  if (opts == null) {
    opts = {
      title: 'Open',
      bookmarkType: 'app',
      properties: ['openFile']
    };
  }

  let { buttonLabel, defaultPath, filters, properties, title, message, bookmarkType } = opts;

  if (bookmarkType == null) {
    bookmarkType = 'app';
  } else if (typeof bookmarkType !== 'string' || (bookmarkType == 'app' || bookmarkType == 'document')) {
    throw new TypeError(`Bookmark Type must be a either "app" or "document". Got "${bookmarkType}".`);
  }

  if (properties == null) {
    properties = ['openFile'];
  } else if (!Array.isArray(properties)) {
    throw new TypeError('Properties must be an array');
  }

  let dialogProperties = 0;
  for (const prop in fileDialogProperties) {
    if (properties.includes(prop)) {
      dialogProperties |= fileDialogProperties[prop];
    }
  }

  if (title == null) {
    title = '';
  } else if (typeof title !== 'string') {
    throw new TypeError('Title must be a string');
  }

  if (buttonLabel == null) {
    buttonLabel = '';
  } else if (typeof buttonLabel !== 'string') {
    throw new TypeError('Button label must be a string');
  }

  if (defaultPath == null) {
    defaultPath = '';
  } else if (typeof defaultPath !== 'string') {
    throw new TypeError('Default path must be a string');
  }

  if (filters == null) {
    filters = [];
  }

  if (message == null) {
    message = '';
  } else if (typeof message !== 'string') {
    throw new TypeError('Message must be a string');
  }

  opts = {
    title,
    buttonLabel,
    defaultPath,
    filters,
    message,
    properties: dialogProperties,
    bookmarkType,
  };

  objc.showOpenDialog(win, opts, cb);
}

/**
 * Clone of dialog.showSaveDialog which uses bookmarks.
 * @param  {BrowserWindow} win  - Optional;
 * @param  {Object}   		 opts - Optional;
 * @param  {Function} 		 cb   - Optional; if not given will be synchronous(?)
 */
export function showSaveDialog(win, opts, cb) {
  checkAppInitialized();

  checkArguments(win, opts, cb);

  if (opts == null) {
    opts = {
      title: 'Open',
      bookmarkType: 'app'
    };
  }

  let { buttonLabel, defaultPath, filters, title, message, nameFieldLabel, showsTagField, bookmarkType } = opts;

  if (bookmarkType == null) {
    bookmarkType = 'app';
  } else if (typeof bookmarkType !== 'string' || (bookmarkType == 'app' || bookmarkType == 'document')) {
    throw new TypeError(`Bookmark Type must be a either "app" or "document". Got "${bookmarkType}".`);
  }

  if (title == null) {
    title = '';
  } else if (typeof title !== 'string') {
    throw new TypeError('Title must be a string');
  }

  if (buttonLabel == null) {
    buttonLabel = '';
  } else if (typeof buttonLabel !== 'string') {
    throw new TypeError('Button label must be a string');
  }

  if (defaultPath == null) {
    defaultPath = '';
  } else if (typeof defaultPath !== 'string') {
    throw new TypeError('Default path must be a string');
  }

  if (filters == null) {
    filters = [];
  }

  if (message == null) {
    message = '';
  } else if (typeof message !== 'string') {
    throw new TypeError('Message must be a string');
  }

  if (nameFieldLabel == null) {
    nameFieldLabel = '';
  } else if (typeof nameFieldLabel !== 'string') {
    throw new TypeError('Name field label must be a string');
  }

  if (showsTagField == null) {
    showsTagField = true;
  }

  opts = {
    title,
    buttonLabel,
    defaultPath,
    filters,
    message,
    nameFieldLabel,
    showsTagField,
    bookmarkType
  };

  objc.showSaveDialog(win, opts, cb);
}


/**
 * OBJECTIVE-C BRIDGING.
 */

const objc = {
  showOpenDialog: function (win, opts, cb) {
    checkImports();

    const dialog = $.NSOpenPanel('openPanel');

    this.setupDialog(dialog, opts);
    this.setupDialogProperties(dialog, opts.properties);

    // TODO: ensure that "['v',['?', 'i']]" is correct!
    // https://github.com/TooTallNate/NodObjC/issues/5#issuecomment-280985888
    const handler = $(this.runModal(dialog, opts, cb, 'openPanel'), ['v',['?', 'i']]);
    dialog('beginSheetModalForWindow', win ? this.findNativeWindow(win) : $.NIL,
           'completionHandler', handler);
  },

  showSaveDialog: function (win, opts, cb) {
    checkImports();

    const dialog = $.NSSavePanel('savePanel');

    this.setupDialog(dialog, opts);
    dialog('setCanSelectHiddenExtension', $.YES);

    // TODO: ensure that "['v',['?', 'i']]" is correct!
    // https://github.com/TooTallNate/NodObjC/issues/5#issuecomment-280985888
    const handler = $(this.runModal(dialog, opts, cb, 'savePanel'), ['v',['?', 'i']]);
    dialog('beginSheetModalForWindow', win ? this.findNativeWindow(win) : $.NIL,
           'completionHandler', handler);
  },

  /**
   * Runs the dialog, calling the appropriate callback.
   */
  runModal: function (dialog, opts, cb, type) {
    return (self, chosen) => {
      // For some strange reason if we don't write to stdout here further output
      // is silenced, so we can't see potential errors, etc.
      process.stdout.write('');

      if (chosen == $.NSFileHandlingPanelCancelButton) {
        cb(null);
      } else if (type == 'openPanel') {
        this.readDialogURLs(dialog, cb, opts.bookmarkType);
      } else if (type == 'savePanel') {
        this.readDialogURL(dialog, cb, opts.bookmarkType);
      }
    }
  },

  /**
   * Reads the url from an NSSavePanel.
   */
  readDialogURL: function (dialog, callback, bookmarkType) {
    const url = dialog('URL');
    const path = url('path')('UTF8String');

    if (!bookmarkType) return callback(path);

    // Retain url since we'll make async calls here.
    url('retain');

    // Check if the chosen path exists.
    exists(path, (err, yes) => {
      if (err) error(err);

      // If the path exists we immediately create a bookmark.
      if (yes) createBookmark.bind(this)();

      // If the path doesn't exist, we can't make a bookmark for it. So we
      // create an empty file, and then create a bookmark for it.
      else {
        fs.writeFile(path, '', (err) => {
          if (err) error(err);
          createBookmark.bind(this)();
        });
      }
    });

    function error(err) {
      url('release'); // Don't want any memory leaks.
      throw err;
    }

    function createBookmark() {
      const defaults = $.NSUserDefaults('standardUserDefaults'),
            bookmark = this.createSecurityBookmark(defaults, url, bookmarkType);

      if (bookmark.key) defaults('synchronize');
      callback(path, bookmark);

      // Release url to be garbage-collected.
      url('release');
    }
  },

  /**
   * Reads urls from an NSOpenPanel.
   */
  readDialogURLs: function (dialog, cb, bookmarkType) {
    let filenames = [], bookmarks, defaults;
    if (bookmarkType) {
      bookmarks = { keys: [], errors: [] };
      defaults = $.NSUserDefaults('standardUserDefaults');
    }

    const urls = dialog('URLs');
    for (let i = 0, c = urls('count'); i < c; i++) {
      const url = urls('objectAtIndex', i);
      if (url('isFileURL')) {
        filenames.push(url('path')('UTF8String'));
        // Create Security-Scoped bookmark from NSURL.
        if (bookmarkType) {
          const bookmark = this.createSecurityBookmark(defaults, url, bookmarkType);
          if (bookmark.key) bookmarks.keys.push(bookmark.key);
          if (bookmark.error) bookmarks.errors.push(bookmark.error);
        }
      }
    }
    // Sync NSUserDefaults if we've accessed it.
    if (bookmarkType) defaults('synchronize');
    cb(filenames, bookmarks);
  },

  /**
   * Creates a security-scoped bookmark from the given url, saving it to
   * NSUserDefaults.
   */
  createSecurityBookmark: function (defaults, url, bookmarkType) {
    let path = url('path'),
        error = $.alloc($.NSError, $.NIL).ref(),
        isAppBookmark = bookmarkType == 'app';

    // https://developer.apple.com/documentation/foundation/nsurl/1417795-bookmarkdatawithoptions?language=objc
    const relativeToURL = isAppBookmark ? $.NIL : $.NSURL('fileURLWithPath', path, 'isDirectory', $.NO);
    const data = url('bookmarkDataWithOptions', $.NSURLBookmarkCreationWithSecurityScope,
                   'includingResourceValuesForKeys', $.NIL,
                   'relativeToURL', relativeToURL,
                   'error', error);

    // Dereference the error pointer to see if an error has occurred. But this
    // may result in an error (null pointer ?), hence try/catch.
    try {
      const err = error.deref();
      console.error({ userInfo: err('userInfo'), context: bookmark });
      throw new Error(`[electron-bookmarks] Error creating security-scoped bookmark:\nNativeError: ${err('localizedDescription')}`);
    }
    catch (err) {
      if (err.message.startsWith('[electron-bookmarks]')) throw err;
      // Ignore Dereferencing error.
    }

    // We hash the path to avoid super long keys.
    const hash = crypto.createHash('md5').update(path('UTF8String')).digest('hex'),
          key = `${moduleKey}${hash}`,
          bookmark = $.NSMutableDictionary('alloc')('init');

    // Save to NSUserDefaults as { path, bookmark: NSData, type: "app" or "document" }.
    bookmark('setObject', path, 'forKey', $('path'));
    bookmark('setObject', $(bookmarkType), 'forKey', $('type'));
    bookmark('setObject', data, 'forKey', $('bookmark'));

    // If it is a document-scoped bookmark, save the NSURL for later use.
    if (!isAppBookmark) {
      defaults('setURL', url, 'forKey', $(`URL:${key}`));
    }

    defaults('setObject', bookmark, 'forKey', $(key));
    return { key: key };
  },

  /**
   * Setup the given dialog with the passed options.
   */
  setupDialog: function (dialog, opts) {
    if (opts.title) {
      dialog('setTitle', $(opts.title));
    }

    if (opts.buttonLabel) {
      dialog('setPrompt', $(opts.buttonLabel));
    }

    if (opts.message) {
      dialog('setMessage', $(opts.message));
    }

    if (opts.nameFieldLabel) {
      dialog('setNameFieldLabel', $(opts.nameFieldLabel));
    }

    if (opts.showsTagField) {
      dialog('setShowsTagField', opts.showsTagField ? $.YES : $.NO);
    }

    if (opts.defaultPath) {
      const dir = path.dirname(opts.defaultPath);
      if (dir) {
        dialog('setDirectoryURL', $.NSURL('fileURLWithPath', $(dir)));
      }
      const filename = path.basename(opts.defaultPath);
      if (filename) {
        dialog('setNameFieldStringValue', $(filename));
      }
    }

    if (opts.filters.length == 0) {
      dialog('setAllowsOtherFileTypes', $.YES);
    } else {
      this.setupDialogFilters(dialog, opts.filters);
    }
  },

  /**
   * Setup the dialog filters.
   */
  setupDialogFilters: function (dialog, filters) {
    let file_type_set = $.NSMutableSet('set');
    for (let i = 0; i < filters.length; i++) {
      // If we meet a '*' file extension, we allow all the file types and no
      // need to set the specified file types.
      if (filters[i] == '*') {
        dialog('setAllowsOtherFileTypes', $.YES);
        break;
      }
      file_type_set('addObject', $(filters[i]));
    }
    // Passing empty array to setAllowedFileTypes will cause an exception.
    let file_types = $.alloc($.NSArray).ref();
    if (file_type_set('count')) {
      file_types = file_type_set('allObjects');
    }
    dialog('setAllowedFileTypes', file_types);
  },

  /**
   * Setup the dialog properties.
   */
  setupDialogProperties: function (dialog, properties) {
    dialog('setCanChooseFiles', (properties & fileDialogProperties.openFile));
    if (properties & fileDialogProperties.openDirectory) {
      dialog('setCanChooseDirectories', $.YES);
    } else if (properties & fileDialogProperties.createDirectory) {
      dialog('setCanCreateDirectories', $.YES);
    } else if (properties & fileDialogProperties.multiSelections) {
      dialog('setAllowsMultipleSelection', $.YES);
    } else if (properties & fileDialogProperties.showHiddenFiles) {
      dialog('setShowsHiddenFiles', $.YES);
    } else if (properties & fileDialogProperties.noResolveAliases) {
      dialog('setResolvesAliases', $.NO);
    }
  },

  /**
   * HACK: Since we don't have the v8 runtime we can't access the electron
   * window's id or identify it any easy way. So we change it's title, look for
   * an NSWindow with that title and then restore the previous title.
   * @param  {BrowserWindow} win
   * @return {OBJC:NSWindow | $.NIL}
   */
  findNativeWindow: function (win) {
    const windows = $.NSApplication('sharedApplication')('windows'),
          test = 'electron-bookmarks:__window__:AtomNSWindow';

    // Remember old window title, and set title to our test.
    const windowTitle = win.getTitle();
    win.setTitle(test);

    // Look through each NSWindow for our title.
		for (let i = 0, c = windows('count'); i < c; i++) {
			let NSWindow = windows('objectAtIndex', i);
			if (NSWindow('title') == test) {
        win.setTitle(windowTitle);
        return NSWindow;
      }
		}

    // We couldn't find it. Ah well, return NIL.
    win.setTitle(windowTitle);
    return $.NIL;
  }
};
