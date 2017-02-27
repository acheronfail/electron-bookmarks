const electron = require('electron');
const { remote, ipcRenderer } = electron;

const output = document.querySelector('output');

// Setup buttons.
const btns = {
  bookmark_showOpenDialog: document.querySelector('#bookmark_showOpenDialog'),
  normal_showOpenDialog: document.querySelector('#normal_showOpenDialog'),

  bookmark_showSaveDialog: document.querySelector('#bookmark_showSaveDialog'),
  normal_showSaveDialog: document.querySelector('#normal_showSaveDialog'),

  bookmark_read: document.querySelector('#bookmark_read'),
  normal_read: document.querySelector('#normal_read'),

  bookmark_write: document.querySelector('#bookmark_write'),
  normal_write: document.querySelector('#normal_write'),

  bookmarks_list: document.querySelector('#bookmarks_list'),
  bookmarks_init: document.querySelector('#bookmarks_init'),
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
