const electron = require('electron');
const { remote, ipcRenderer } = electron;

const output = document.querySelector('output');

const btns = {
  normal_test_access: document.querySelector('#normal_test_access'),
  bookmarks_test_access: document.querySelector('#bookmarks_test_access'),
  bookmarks_list: document.querySelector('#bookmarks_list')
};



btns.normal_test_access.addEventListener('click', (e) => {

  remote.dialog.showOpenDialog(remote.getCurrentWindow(), {}, (filenames) => {
    const response = ipcRenderer.sendSync('normal_test_access', filenames[0]);
    btns.output.innerHTML = response;
  });

}, false);

btns.bookmarks_list.addEventListener('click', (e) => {
  output.innerHTML = ipcRenderer.sendSync('bookmarks_list');
}, false);
