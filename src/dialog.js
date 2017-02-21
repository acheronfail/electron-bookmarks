const { app, BrowserWindow } = require('electron');
const path = require('path');
const $ = require('nodobjc');

const { checkImports, checkAppInitialized } = require('./util');

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
 * @return {String[]}      If cb is specified returns undefined.
 */
module.exports.showOpenDialog = function showOpenDialog(win, opts = {}, cb) {
  checkAppInitialized();

  // CHECK ARGUMENTS.

  // Shift.
  if (win !== null && win.constructor !== BrowserWindow) {
    [cb, opts, win] = [opts, win, null];
  }

  // Shift.
  if ((cb == null) && typeof opts == 'function') {
    [cb, opts] = [opts, null];
  }

  // Fallback to using very last argument as the callback function.
  const last = arguments[arguments.length - 1];
  if ((cb == null) && typeof last === 'function') {
    cb = last;
  }

  if (opts == null) {
    opts = {
      title: 'Open',
      properties: ['openFile']
    };
  }

  let { buttonLabel, defaultPath, filters, properties, title, message, bookmarkType } = opts;

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
    bookmarkType,
    filters,
    message,
    window: win,
    properties: dialogProperties
  };

  objc.showOpenDialog(win, opts, cb);
}


/**
 * OBJECTIVE-C BRIDGING.
 */

const objc = {
  /**
   * HACK: Since we don't have the v8 runtime we can't access the electron
   * window's id or identify it any easy way. So we change it's title, look for
   * an NSWindow with that title and then restore the previous title.
   * @param  {BrowserWindow} win
   * @return {OBJC:NSWindow | $.NIL}
   */
  getWindow: function (win) {
    const windows = $.NSApplication('sharedApplication')('windows'),
          test = '_DIALOG:AtomNSWindow';

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
  },

  showOpenDialog: function (win, opts, cb) {
    checkImports();

    const dialog = $.NSOpenPanel('openPanel');

    this.setupDialog(dialog, opts);
    this.setupDialogProperties(dialog, opts.properties);

    const handler = $(this.runModal.bind(this, dialog, opts, cb), ['v',['?', 'i']]);
    dialog('beginSheetModalForWindow', win ? this.getWindow(win) : $.NIL,
           'completionHandler', handler);
  },

  runModal: function (dialog, opts, cb, self, chosen) {
    if (chosen == $.NSFileHandlingPanelCancelButton) {
      cb(null);
    } else {
      cb(this.readDialogURLs(dialog, opts.bookmarkType));
    }
  },

  readDialogURLs: function (dialog, bookmarkType) {
    let data = [], bookmarks, defaults;
    if (bookmarkType) {
      data.bookmarks = { keys: [], errors: [] };
      defaults = $.NSUserDefaults('standardUserDefaults');
    }

    const urls = dialog('URLs');
    for (let i = 0, c = urls('count'); i < c; i++) {
      const url = urls('objectAtIndex', i);
      if (url('isFileURL')) {
        data.push(url('path'));
        // Create Security-Scoped bookmark from NSURL.
        if (bookmarkType) this.createSecurityBookmark(data, defaults, url);
      }
    }
    // Sync NSUserDefaults if we've accessed it.
    if (bookmarkType) defaults('synchronize');
    return data;
  },

  createSecurityBookmark: function (data, defaults, url) {
    let urlPath = url('absoluteString'),
        error = $.alloc($.NSError).ref(),
        isAppBookmark = bookmarkType == 'app',
        bookmarkData = url('bookmarkDataWithOptions', $.NSURLBookmarkCreationWithSecurityScope,
                       'includingResourceValuesForKeys', $.NIL,
                       'relativeToURL', isAppBookmark ? $.NIL : urlPath,
                       'error', error);

    // Error pointer is of type 'object' until allocated, in which case
    // it will be a function.
    if (typeof error == 'function') {
      console.error(`[electron-bookmarks] Error creating security-scoped bookmark!:\nNativeError: ${error('localizedDescription')}`);
      data.bookmarks.errors.push(error('localizedDescription'));
      return;
    }

    // Save to NSUserDefaults.
    const key = `bookmark::${urlPath}`;
    defaults('setObject', bookmarkData, 'forKey', $(key));
    data.bookmarks.keys.push(key);
  },

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

    // TODO: what is this?
    // https://github.com/electron/electron/blob/8c2cf03f378008baf2cb31050795ac9c929411b0/atom/browser/ui/file_dialog_mac.mm
    if (opts.nameField) {
      dialog('setNameFieldLabel', $(opts.nameField));
    }

    // TODO: this
    if (opts.showTagField) {
      dialog('setShowsTagField', $(opts.showTagField));
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
  }
};
