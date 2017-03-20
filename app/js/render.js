var DecompressZip = require('decompress-zip');
var app = require('electron').remote;
var dialog = app.dialog;


(function () {
  
  function openModal() {
    const BrowserWindow = require('electron').remote.BrowserWindow
    const path = require('path')
    const modalPath = path.join('file://', __dirname, 'modal.html')
    let win = new BrowserWindow({ width: 400, height: 720 })
    win.on('close', function () { win = null })
    win.loadURL(modalPath)
    win.show()
  }


  function uncompress(ZIP_FILE_PATH, DESTINATION_PATH){
    var unzipper = new DecompressZip(ZIP_FILE_PATH);
    // Add the error event listener
    unzipper.on('error', function (err) {
      console.log('Caught an error', err);
    });
    // Notify when everything is extracted
    unzipper.on('extract', function (log) {
      console.log('Finished extracting', log);
    });
    // Notify "progress" of the decompressed files
    unzipper.on('progress', function (fileIndex, fileCount) {
      console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });
    // Unzip !
    unzipper.extract({
      path: DESTINATION_PATH
    });
  }


  var holder = document.getElementById('drag-file');
  holder.ondragover = () => {
    return false;
  };
  holder.ondragleave = () => {
    return false;
  };
  holder.ondragend = () => {
    return false;
  };
  holder.ondrop = (e) => {
    e.preventDefault();
    for (let f of e.dataTransfer.files) {
      uncompress(f.path,"tmp");
      openModal()
//      console.log(f)
//      console.log(f.path)
//      console.log(e.dataTransfer)
//      console.log(e)
//      console.log('File(s) you dragged here: ', f.path)
    }
    return false;
  };
})();





