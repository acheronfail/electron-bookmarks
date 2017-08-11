module.exports = { init };

const bookmarks = require('electron-bookmarks'),
      { dialog, app, ipcMain: ipc } = require('electron');

const log = require('./log.js'),
      tests = require('./tests'),
      { send } = require('./win');


function init() {

  ipc.on('ipcReady', () => {
    app.ipcReady = true;
    app.emit('ipcReady');
  });

  /**
   * Tests
   */

  // tests.do(action, useBookmark, bookmarkType, useWindow)

  // showOpenDialog
  ipc.on('bookmark_showOpenDialog_win', (e) => tests.do('showOpenDialog', true, 'app', true));
  ipc.on('bookmark_showOpenDialog_app', (e) => tests.do('showOpenDialog', true, 'app', false));
  ipc.on('bookmark_showOpenDialog_doc', (e) => tests.do('showOpenDialog', true, 'document', false));

  ipc.on('normal_showOpenDialog_win', (e) => tests.do('showOpenDialog', false, null, true));
  ipc.on('normal_showOpenDialog',     (e) => tests.do('showOpenDialog', false, null, false));

  // showSaveDialog
  ipc.on('bookmark_showSaveDialog_win', (e) => tests.do('showSaveDialog', true, 'app', true));
  ipc.on('bookmark_showSaveDialog_app', (e) => tests.do('showSaveDialog', true, 'app', false));
  ipc.on('bookmark_showSaveDialog_doc', (e) => tests.do('showSaveDialog', true, 'document', false));

  ipc.on('normal_showSaveDialog_win', (e) => tests.do('showSaveDialog', false, null, true));
  ipc.on('normal_showSaveDialog',     (e) => tests.do('showSaveDialog', false, null, false));

  // read
  ipc.on('bookmark_read', (e) => tests.do('read', true));
  ipc.on('normal_read', (e) => tests.do('read', false));

  // write
  ipc.on('bookmark_write', (e) => tests.do('write', true));
  ipc.on('normal_write', (e) => tests.do('write', false));

  /**
   * misc
   */

  // List saved bookmarks.
  ipc.on('bookmarks_list', (e) => {
    send('result', {
      title: 'list',
      message: JSON.stringify(bookmarks.list(), null, 2),
      useBookmark: true
    });
  });

  // Initialise bookmarks. If this isn't called it will be when any method
  // of electron-bookmarks is called.
  ipc.on('bookmarks_init', (e) => {
    bookmarks.init();
    send('result', {
      title: 'init',
      message: 'Bookmarks initialised!',
      useBookmark: true
    });
  });

  // Delete the first element returned from bookmarks.list()
  ipc.on('bookmarks_deleteOne', (e) => {
    const bookmark = bookmarks.list()[0];
    if (!bookmark) return;
    log('deleteOne', bookmark.key);
    bookmarks.deleteOne(bookmark.key);
    send('result', { title: 'deleteOne', message: 'Deleting first bookmark of bookmarks.list()\n  ' + bookmark.key, useBookmark: true });
  });

  // Delete all bookmarks.
  ipc.on('bookmarks_deleteAll', (e) => {
    log('deleteAll');
    bookmarks.deleteAll();
    send('result', { title: 'deleteAll', message: 'Done!', useBookmark: true });
  });

}
