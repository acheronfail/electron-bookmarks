require('electron').app.on('ready', function () {
  require('./menu.js').init();
  require('./win.js').init();
  require('./ipc.js').init();
});
