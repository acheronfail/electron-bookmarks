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

  // showOpenDialog
  ipc.on('bookmark_showOpenDialog_win', (e) => tests.do('showOpenDialog', true, true));
  ipc.on('bookmark_showOpenDialog', (e) => tests.do('showOpenDialog', false));
  ipc.on('normal_showOpenDialog_win', (e) => tests.do('showOpenDialog', false, true));
  ipc.on('normal_showOpenDialog', (e) => tests.do('showOpenDialog', false));

  // showSaveDialog
  ipc.on('bookmark_showSaveDialog_win', (e) => tests.do('showSaveDialog', true, true));
  ipc.on('bookmark_showSaveDialog', (e) => tests.do('showSaveDialog', false));
  ipc.on('normal_showSaveDialog_win', (e) => tests.do('showSaveDialog', false, true));
  ipc.on('normal_showSaveDialog', (e) => tests.do('showSaveDialog', false));

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
      message: JSON.stringify(bookmarks.list(), null, 2)
    });
  });

  // Initialise bookmarks. If this isn't called it will be when any method
  // of electron-bookmarks is called.
  ipc.on('bookmarks_init', (e) => {
    bookmarks.init();
    send('result', {
      title: 'init',
      message: 'Bookmarks initialised!'
    });
  });

  // Delete the first element returned from bookmarks.list()
  ipc.on('bookmarks_deleteOne', (e) => {
    const bookmark = bookmarks.list()[0];
    if (!bookmark) return;
    log('deleteOne', bookmark.key);
    bookmarks.deleteOne(bookmark.key);
    send('result', { title: 'deleteOne', message: 'Deleting first bookmark of bookmarks.list()\n  ' + bookmark.key });
  });

  // Delete all bookmarks.
  ipc.on('bookmarks_deleteAll', (e) => {
    log('deleteAll');
    bookmarks.deleteAll();
    send('result', { title: 'deleteAll', message: '' });
  });

}
