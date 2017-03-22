/* todo
*
* - make sure only zip archive is accepted
* - delete tmp folder
* - create drag over color change class
*
*
*
*
*/



(function () {
  
  //delarations
  var collection = []
  
//  openModal();
  
  
  
  //find out where the user data is and create the temp path
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
    }
    return false;
  };
  
  
  
  //double click the window to pick an archive and decompress it
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
//      alert('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });
    unzipper.on('extract', function (log) {//extracting completed sucessfully
//      alert('Finished extracting', log);
      getSystemProfile();
    });
    unzipper.on('error', function (err) {//error event listener
//      alert('Caught an error', err);
    });
    unzipper.extract({ //unzip
      path: DESTINATION_PATH
    });
  }
  
  
  
  //get the system profile names and locations
  function getSystemProfile() {
    var profilePaths = [];
    var readdirp = require('readdirp'); 
    var glob = require("glob")
    glob(getTempPath()+"/Server/*/*/*/profiles", function (er, files) {
      readdirp({ root: files[0], fileFilter: '*.profile.xml'}, function (errors, res) {
        if (errors) {
          errors.forEach(function (err) {
            console.error('Error: ', err);
          });
        }
        $.each(res.files, function(index,value) {
        if (value.name !== "Monitoring.profile.xml" && 
            value.name !== "dynaTrace Self-Monitoring.profile.xml") {
          profilePaths.push({name:value.name,path:value.fullPath})
        }
        });
        if (!Array.isArray(profilePaths) || !profilePaths.length) {
          console.log('array is empty') // throw error to user 'no profiles found'
        } else {
          $.each(profilePaths, function(index,value) {
            var profileObject = parseXML(value.path)
//            console.log(profileObject.profile)
            compareMeasuresToDashboards(profileObject)
          });
        }
      });
    })
  } 
  
  
  
  
  //parse the system profile and return a list of measures
  function parseXML(path) {
    var obj = {};
    var fs = require('fs'),
    xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    var data = fs.readFileSync(path, 'ascii');
    var measures = []
    var fileName = path.split("/")[path.split("/").length - 1];
    parser.parseString(data, function (err, result) {
      $.each(result.dynatrace.systemprofile[0].measures[0].measure, function(index,value) {
        if (value.$.userdefined == "true") {
          if (value.$.measuretype !== "TransactionMeasure"
             && value.$.measuretype !== "ErrorDetectionMeasure"
             && value.$.measuretype !== "ViolationMeasure"
             && value.$.measuretype !== "MonitorMeasure"
             && value.$.measuretype !== "JmxMeasure"
             && value.$.measuretype !== "ApiMeasure"
             && value.$.measuretype !== "PmiMeasure"
             && value.$.measuretype !== "WebSphereConnectionPool"
             && value.$.measuretype !== "ErrorDetectionMeasure") {
            measures.push(value.$.id);
          }
        }
      });
    });
    obj = {
      profile: {
        name: fileName,
        path: path,
        measures: measures
      }
    }
    return obj;
  }
  
  
  
  function compareMeasuresToDashboards(profileObject) {
    
    console.log(profileObject)
    
    var glob = require("glob")
    glob(getTempPath()+"/Server/*/*/*/dashboards/*.xml", function (er, files) {
      var fs = require('fs-extra');
      $.each(files, function(index,filePath) {
        fs.readFile(filePath, function (err, data) {
          if (err) throw err;
          $.each(profileObject.profile.measures.removeDuplicates(), function(index,measure) {
//            console.log("String"+(data.indexOf(measure)>-1 ? " " : " not ")+"found");
            if (data.indexOf(measure)>-1) {
              console.log('string found')
            } else {
              console.log('string not found')
            }
          })
        });
      })
    })
    
    
    
//    var glob = require("glob")
//    glob(getTempPath()+"/Server/*/*/*/dashboards", function (er, files) {
//    var findInFiles = require('find-in-files');
//      $.each(profileObject.profile.measures.removeDuplicates(), function(index,value) {
//        findInFiles.find(value, files[0])
//        .then(function(results) {
//          for (var result in results) {
//            var res = results[result];
//            console.log(
//            'found "' + res.matches[0] + '" ' + res.count
//            + ' times in "' + result + '"'
//            );
//          }
//        });
//      });
//    })
  }
  
  
  
  //open modal and pass data for printout list
  function openModal() {
    const BrowserWindow = require('electron').remote.BrowserWindow
    const path = require('path')
    const modalPath = path.join('file://', __dirname, 'modal.html')
    let win = new BrowserWindow({ 
      width: 400, 
      height: 720,
      'minWidth': 300,
    })
    win.on('close', function () { win = null })
    win.loadURL(modalPath)
    win.show()
  }
  
  
})();









Array.prototype.removeDuplicates = function () {
  return this.filter(function (item, index, self) {
    return self.indexOf(item) == index;
  });
};