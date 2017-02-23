module.exports = { init };

const bookmarks = require('electron-bookmarks'),
      electron = require('electron');

function init() {
  const ipc = electron.ipcMain;

  // NOTE: these are all synchronous events.


  /**
   * WITHOUT BOOKMARKS
   */

  ipc.on('normal_test_access', (e, ...args) => {
    try {
      fs.accessSync(path, fs.constants.W_OK);
      e.returnValue = 'ACCESS READ: OK';
    }
    catch (e) {
      e.returnValue = 'ACCESS READ: FAIL';
    }
  });



  /**
   * WITH BOOKMARKS
   */

   ipc.on('bookmarks_test_access', (e, path) => {
     // TODO:
     e.returnValue = '';
   });


   /**
    * OTHER
    */

   ipc.on('bookmarks_list', (e) => {
     e.returnValue = bookmarks.list();
   });

}
