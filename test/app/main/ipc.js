module.exports = { init };

const fs = require('fs'),
      bookmarks = require('electron-bookmarks'),
      { dialog, app, ipcMain: ipc } = require('electron');

const log = require('./log.js');

function init() {

  ipc.on('ipcReady', () => {
    app.ipcReady = true;
    app.emit('ipcReady');
  });


  // NOTE: these are all synchronous events, event.returnValue must anything
  // other than `undefined`.


  /**
   * WITHOUT BOOKMARKS
   */

  ipc.on('normal_test_access', (e) => {
    let paths = dialog.showOpenDialog(null, {});
    e.returnValue = { message: testAccess(paths[0]) };
  });



  /**
   * WITH BOOKMARKS
   */

   ipc.on('bookmarks_test_access', (e) => {
     // TODO:
     e.returnValue = { message: '' };
   });


   /**
    * OTHER
    */

   ipc.on('bookmarks_list', (e) => {
     e.returnValue = { message: JSON.stringify(bookmarks.list(), null, 2) };
   });

   ipc.on('bookmarks_init', (e) => {
     bookmarks.init();
     e.returnValue = {
       message: 'Bookmarks initialised!'
     };
   });

}


// Tests write access.
function testAccess(path) {
  try {
    fs.accessSync(path, fs.constants.W_OK);
    return 'ACCESS WRITE: OK';
  }
  catch (err) {
    log.error({ message: err.message, stack: err.stack });
    return 'ACCESS WRITE: FAIL';
  }
}
