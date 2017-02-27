const electron = require('electron');
const { remote, ipcRenderer } = electron;

// Output div.
const output = document.querySelector('output');

// Setup test path input.
const testPath = document.querySelector('#testPath');
const path = localStorage.getItem('testPath');
testPath.value = path;
ipcRenderer.send('updatePath', path);
testPath.addEventListener('keyup', (e) => {
  localStorage.setItem('testPath', testPath.value);
  ipcRenderer.send('updatePath', testPath.value);
}, false);

// Setup buttons.
const btns = {
  bookmark_showOpenDialog_win: document.querySelector('#bookmark_showOpenDialog_win'),
  bookmark_showOpenDialog_app:     document.querySelector('#bookmark_showOpenDialog_app'),
  bookmark_showOpenDialog_doc:     document.querySelector('#bookmark_showOpenDialog_doc'),
  normal_showOpenDialog_win: document.querySelector('#normal_showOpenDialog_win'),
  normal_showOpenDialog:     document.querySelector('#normal_showOpenDialog'),

  bookmark_showSaveDialog_win: document.querySelector('#bookmark_showSaveDialog_win'),
  bookmark_showSaveDialog_app:     document.querySelector('#bookmark_showSaveDialog_app'),
  bookmark_showSaveDialog_doc:     document.querySelector('#bookmark_showSaveDialog_doc'),
  normal_showSaveDialog_win: document.querySelector('#normal_showSaveDialog_win'),
  normal_showSaveDialog:     document.querySelector('#normal_showSaveDialog'),

  bookmark_read: document.querySelector('#bookmark_read'),
  normal_read: document.querySelector('#normal_read'),

  bookmark_write: document.querySelector('#bookmark_write'),
  normal_write: document.querySelector('#normal_write'),

  bookmarks_list: document.querySelector('#bookmarks_list'),
  bookmarks_init: document.querySelector('#bookmarks_init'),
  bookmarks_deleteOne: document.querySelector('#bookmarks_deleteOne'),
  bookmarks_deleteAll: document.querySelector('#bookmarks_deleteAll'),
};

// Setup listeners.
for (let id in btns) {
  const btn = btns[id];
  btn.addEventListener('click', (e) => ipcRenderer.send(id), false);
}

// Setup ipc events.
ipcRenderer.on('log', (e, ...args) => console.log(...args));
ipcRenderer.on('error', (e, ...args) => console.error(...args));
ipcRenderer.on('result', (e, result) => {
  output.innerHTML = `
    <div style="color: ${result.error ? 'red' : result.useBookmark ? 'green' : 'blue'};">
      <h3>${result.title}</h3>
      <pre>${result.message}</pre>
    </div>
  ` + output.innerHTML;
});

ipcRenderer.send('ipcReady');
