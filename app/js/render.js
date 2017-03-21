/* todo
*
* - make sure only zip archive is accepted
*
*
*/


(function () {
  
  var profiles = [];
  
  function getTempPath() {
    const {app} = require('electron').remote;
    var tempPath = app.getPath('userData')+"/tmp";
    return tempPath;
  }
  
  
  
  //drag the archive in and decompress it
  var holder = document.getElementById('drag-file');
  holder.ondragover = () => { return false; };
  holder.ondragleave = () => { return false; };
  holder.ondragend = () => { return false; };
  holder.ondrop = (e) => {
    e.preventDefault();
    for (let f of e.dataTransfer.files) {
      uncompress(f.path, getTempPath());
//      openModal()
      getSystemProfile();
    }
    return false;
  };
  
  
  
  //double click the window to pick a file
  var app = require('electron').remote;
  var dialog = app.dialog;
  document.getElementById("drag-file").addEventListener("dblclick", () => {
    dialog.showOpenDialog({
      title:"Select the .zip file to decompress"
    },function (fileNames) {
      if(fileNames === undefined) {
        console.log("No file selected");
        return;
      } else {
        uncompress(fileNames[0], getTempPath());
      }
    });          
  }, false);
  
  
  
  //decompress the zip file
  var DecompressZip = require('decompress-zip');
  function uncompress(ZIP_FILE_PATH, DESTINATION_PATH) {
    var unzipper = new DecompressZip(ZIP_FILE_PATH);
    unzipper.on('progress', function (fileIndex, fileCount) {//extraction progress
//      console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });
    unzipper.on('extract', function (log) {//extracting completed sucessfully
//      console.log('Finished extracting', log);
    });
    unzipper.on('error', function (err) {//error event listener
//      console.log('Caught an error', err);
    });
    unzipper.extract({ //unzip
      path: DESTINATION_PATH
    });
  }
  
  
  
  //get the system profile names and locations
  function getSystemProfile() {
    
    var readdirp = require('readdirp'); 
    readdirp({ root: getTempPath()+"/Server", fileFilter: '*.profile.xml'}, function (errors, res) {
      if (errors) {
        errors.forEach(function (err) {
          console.error('Error: ', err);
        });
      }
      $.each(res.files, function( index, value ) {
        if (value.name !== "Monitoring.profile.xml" && value.name !== "dynaTrace Self-Monitoring.profile.xml") {
          profiles.push(value.path)
        }
      });
    });
    console.log(profiles)
  }
  
  
  
  //open modal and pass data for printout list
  function openModal() {
    const BrowserWindow = require('electron').remote.BrowserWindow
    const path = require('path')
    const modalPath = path.join('file://', __dirname, 'modal.html')
    let win = new BrowserWindow({ width: 400, height: 720 })
    win.on('close', function () { win = null })
    win.loadURL(modalPath)
    win.show()
  }
  
  
})();