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
   * showOpenDialog
   */
  ipc.on('bookmark_showOpenDialog_win', (e) => tests.do('showOpenDialog', true, true));
  ipc.on('bookmark_showOpenDialog', (e) => tests.do('showOpenDialog', false));
  ipc.on('normal_showOpenDialog_win', (e) => tests.do('showOpenDialog', false, true));
  ipc.on('normal_showOpenDialog', (e) => tests.do('showOpenDialog', false));

  /**
   * showSaveDialog
   */
  ipc.on('bookmark_showSaveDialog_win', (e) => tests.do('showSaveDialog', true, true));
  ipc.on('bookmark_showSaveDialog', (e) => tests.do('showSaveDialog', false));
  ipc.on('normal_showSaveDialog_win', (e) => tests.do('showSaveDialog', false, true));
  ipc.on('normal_showSaveDialog', (e) => tests.do('showSaveDialog', false));

  /**
   * read
   */
  ipc.on('bookmark_read', (e) => tests.do('read', false));
  ipc.on('normal_read', (e) => tests.do('read', false));

  /**
   * write
   */
  ipc.on('bookmark_write', (e) => tests.do('write', false));
  ipc.on('normal_write', (e) => tests.do('write', false));

  /**
   * misc
   */

  ipc.on('bookmarks_list', (e) => {
    send('result', {
      title: 'list',
      message: JSON.stringify(bookmarks.list(), null, 2)
    });
  });

  ipc.on('bookmarks_init', (e) => {
    bookmarks.init();
    send('result', {
      title: 'init',
      message: 'Bookmarks initialised!'
    });
  });

  ipc.on('bookmarks_deleteOne', (e) => {
    const bookmark = bookmarks.list()[0];
    if (!bookmark) return;
    log('deleteOne', bookmark.key);
    bookmarks.deleteOne(bookmark.key);
    send('result', { title: 'deleteOne', message: 'Deleting first bookmarks of bookmarks.list()\n  ' + bookmark.key });
  });

  ipc.on('bookmarks_deleteAll', (e) => {
    log('deleteAll');
    bookmarks.deleteAll();
    send('result', { title: 'deleteAll', message: '' });
  });

}
