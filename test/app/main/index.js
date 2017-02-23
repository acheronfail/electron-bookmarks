require('electron').app.on('ready', function () {
  require('./win.js').init();
  require('./ipc.js').init();
});
