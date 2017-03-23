/* todo
*
* - make sure only zip archive is accepted
* - delete tmp folder (command quit throws error on modal)
* - errors
* - progress states
*
*
*/






(function () {

  
//  clearTempDir()
  

  
  
  
  //drag the archive in and decompress it
  var holder = document.getElementById('drag-file');
  holder.ondragover = () => { 
    $('#drag-file').addClass('active')
    return false; 
  };
  holder.ondragleave = () => { 
    $('#drag-file').removeClass('active')
    return false; 
  };
  holder.ondragend = () => { return false; };
  holder.ondrop = (e) => {
    $('#drag-file').removeClass('active')
    e.preventDefault();
    for (let f of e.dataTransfer.files) {
      console.log('>> archive dragged into window')
      uncompress(f.path, getTempPath());
//      showSpinner(true)
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
        console.log('>> archive added via dialog')
        uncompress(fileNames[0], getTempPath());
//        showSpinner(true)
      }
    });          
  }, false);
  
  
  
  //decompress the zip file
  var DecompressZip = require('decompress-zip');
  function uncompress(ZIP_FILE_PATH, DESTINATION_PATH) {
    updateStatus('Decompressing archive..')
    var unzipper = new DecompressZip(ZIP_FILE_PATH);
    unzipper.on('progress', function (fileIndex, fileCount) {//extraction progress
//      alert('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });
    unzipper.on('extract', function (log) {//extracting completed sucessfully
//      alert('Finished extracting', log);
      console.log('>> archive extracted to '+DESTINATION_PATH)
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
    updateStatus('Analyzing profile..')
    var profilePaths = [];
    var readdirp = require('readdirp'); 
    var glob = require("glob")
    files = glob.sync(getTempPath()+"/Server/*/*/*/profiles");
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
        console.log('>> '+profilePaths.length+' system profile(s) extracted')
        $.each(profilePaths, function(index,value) {
          var profileObject = parseXML(value.path)
          compareMeasuresToDashboards(profileObject)
        });
        clearTempDir()
        updateStatus('Drop Support Archive')
      }
    });
  } 
  
  
  
  
  //parse the system profile and return a list of measures
  function parseXML(path) {
    var obj = {};
    var fs = require('fs'),
    xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    var data = fs.readFileSync(path, 'ascii');
    var measures = []
    var transactions = []
    var measuresFromIncidentsAndTransactions = []
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
//      //find all the measures that are used in incidents
      $.each(result.dynatrace.systemprofile[0].incidentrules[0].incidentrule, function(index,value) {
        if (typeof value.conditions !== "undefined") {
          measuresFromIncidentsAndTransactions.push(value.conditions[0].condition[0].$.refmeasure);
        }
      })
//      //find all the measures used in user defined business transactions
      $.each(result.dynatrace.systemprofile[0].transactions[0].transaction, function(index,value) {
        if (value.$.subscriptiontype == 'userdefined') {
          //find measures used in BT filters
          if (value.filter) {
            if (typeof value.filter[0].measureref !== "undefined") {
              $.each(value.filter[0].measureref, function(index2,value2) {
                measuresFromIncidentsAndTransactions.push(value2.$.refmeasure)
              })
            }
          }
          //find measures used in BT calculate results
          if (value.evaluate) {
            if (typeof value.evaluate[0].measureref !== "undefined") {
              $.each(value.evaluate[0].measureref, function(index2,value2) {
                measuresFromIncidentsAndTransactions.push(value2.$.refmeasure)
              })
            }
          }
          //find measures used in BT split results
          if (value.group) {
            if (typeof value.group[0].measureref !== "undefined") {
              $.each(value.group[0].measureref, function(index2,value2) {
                measuresFromIncidentsAndTransactions.push(value2.$.refmeasure)
              })
            }
          }
        }
        //save all business transaction names for the profileObject
        transactions.push(value.$.id)
      })
    });
    var deduplicatedMeasures = measures.removeDuplicates();
    var cleanMeasures = deduplicatedMeasures.filter(function(val) {
      return measuresFromIncidentsAndTransactions.indexOf(val) == -1;
    });
    //build the object and return it
    obj = {
      profile: {
        name: fileName,
        path: path,
        cleanMeasures: cleanMeasures,
        allMeasures: deduplicatedMeasures,
        transactions: transactions.removeDuplicates()
      }
    }
    console.log('>> system profile '+obj.profile.name+' parsed and measures saved')
    return obj;
  }
  
  
  
  
  
  
  
  
  //compare the measures in the profile object to all the available dashboards
  //measures coming into this function have already been cleared of being used in transactions or incidents
  function compareMeasuresToDashboards(profileObject) {
    var unusedMeasures = []
    var usedMeasures = []
    var dashboards = []
    var glob = require("glob")
    var fs = require('fs-extra');
    files = glob.sync(getTempPath()+"/Server/*/*/*/dashboards/*.xml");
    //save all the dashboard names to an array
    $.each(files, function(index,path) {
      var fileName = path.split("/")[path.split("/").length - 1];
      dashboards.push(fileName)
    })
    //iterate over the measures from the profile object
    $.each(profileObject.profile.cleanMeasures, function(index,measure) {
      var count = 0;
      //iterate over the files in the directory and search for the measure
      $.each(files, function(index,path) {
        var file = fs.readFileSync(path, 'ascii');
        if (file.indexOf(measure)>-1) {
          count++
          return false
        }
      })
      //save the measure if it was not found in any file
      if (count == 0) {
        unusedMeasures.push(measure)
      }
    })
    console.log('>> measures compared to all dashboards, unused measures saved')
    console.log('>> '+unusedMeasures.length+' unused measures found')
    //create the package to send to the modal
    var args = {
      profile: profileObject,
      unusedMeasures: unusedMeasures,
      dashboards: dashboards
    }
    //message the main process and send the package
    const ipc = require('electron').ipcRenderer
    ipc.send('open-modal', args)
    showSpinner(false)
  }
  
  
  function showSpinner(state) {
//    if (state == true) {
//      $('#drag-file .isSpinning').show();
//      $('#drag-file .isNotSpinning').hide();
//    } else {
//      $('#drag-file .isSpinning').hide();
//      $('#drag-file .isNotSpinning').show();
//    }
  }
  
  function updateStatus(text) {
    $('.drag-zone p').text(text);
  }
  
  //find out where the user data is and create the temp path
  function getTempPath() {
    const {app} = require('electron').remote;
    var tempPath = app.getPath('userData')+"/tmp";
    return tempPath;
  } 
  
  function clearTempDir() {
    const ipc = require('electron').ipcRenderer
    ipc.send('clear-tmp')
//    var fs = require('fs-extra')
//    fs.removeSync(getTempPath());
//    console.log('delete '+getTempPath())
  }
//  
//  function guid() {
//    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
//      s4() + '-' + s4() + s4() + s4();
//  }
//  function s4() {
//    return Math.floor((1 + Math.random()) * 0x10000)
//      .toString(16)
//      .substring(1);
//  }
//  function newProfile() {
//    id = guid();
//    return id
//  }
  
  
})();








//removes duplicate entries from arrays
Array.prototype.removeDuplicates = function () {
  return this.filter(function (item, index, self) {
    return self.indexOf(item) == index;
  });
};