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
  ipc.on('bookmark_showOpenDialog', (e) => tests.do('showOpenDialog', true));
  ipc.on('normal_showOpenDialog', (e) => tests.do('showOpenDialog', false));

  /**
   * showSaveDialog
   */
  ipc.on('bookmark_showSaveDialog', (e) => tests.do('showSaveDialog', true));
  ipc.on('normal_showSaveDialog', (e) => tests.do('showSaveDialog', false));

  /**
   * read
   */
  ipc.on('bookmark_read', (e) => tests.do('read', true));
  ipc.on('normal_read', (e) => tests.do('read', false));

  /**
   * write
   */
  ipc.on('bookmark_write', (e) => tests.do('write', true));
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

}
