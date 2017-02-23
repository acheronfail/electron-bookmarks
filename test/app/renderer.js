const electron = require('electron');
const { remote, ipcRenderer } = electron;

const output = document.querySelector('output');

// Setup buttons.
const btns = {
  normal_test_access: document.querySelector('#normal_test_access'),
  bookmarks_test_access: document.querySelector('#bookmarks_test_access'),
  bookmarks_list: document.querySelector('#bookmarks_list'),
  bookmarks_init: document.querySelector('#bookmarks_init'),
};

const createListener = (action) => (event) => {
  const response = ipcRenderer.sendSync(action);
  output.innerHTML = `${action}:\n${response.message}`;
}

// Setup listeners.
for (let action in btns) {
  const btn = btns[action];
  btn.addEventListener('click', createListener(action), false);
}

// Setup ipc events.
ipcRenderer.on('log', (e, ...args) => console.log(...args));
ipcRenderer.on('error', (e, ...args) => console.error(...args));

ipcRenderer.send('ipcReady');
