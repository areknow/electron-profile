(function () {
  
  var serverName;
  var multiProfiles = false;

  
  
  
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
    if (!multiProfiles) {
      $('#drag-file').removeClass('active')
      e.preventDefault();
      for (let f of e.dataTransfer.files) {
        console.log('>> archive dragged into window')
        uncompress(f.path, getTempPath());
      }
      return false;
    } else {
      $('#drag-file').removeClass('active')
      alert('Archive is already loaded.')
      e.preventDefault();
      return false;
    }
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
      }
    });          
  }, false);
  
  
  
  
  //decompress the zip file
  var DecompressZip = require('decompress-zip');
  function uncompress(ZIP_FILE_PATH, DESTINATION_PATH) {
    if (ZIP_FILE_PATH.split('.').pop() == "zip") {
      updateStatus('Extracting archive..')
      var unzipper = new DecompressZip(ZIP_FILE_PATH);
      //extraction progress
      unzipper.on('progress', function (fileIndex, fileCount) {});
      //extracting completed sucessfully
      unzipper.on('extract', function (log) {
        console.log('>> archive extracted to '+DESTINATION_PATH)
        //extract server name
        serverName = getServerName()
        //extract the system profiles
        getSystemProfile();
      });
      //error event listener
      unzipper.on('error', function (err) { console.log('Caught an error', err); });
      //unzip
      unzipper.extract({ path: DESTINATION_PATH });
    } else {
      alert('Only .zip archives are accepted. Try again.')
    }
  }
  
  
  
  
  //get the server name from the extracted dir
  function getServerName() {
    var glob = require("glob")
    files = glob.sync(getTempPath()+"/Server/*");
    if (files[0]) {
      var dirName = files[0].split("/")[files[0].split("/").length - 1];
      return dirName;
    }
  }
  
  
  
  
  //get the system profile names and locations
  function getSystemProfile() {
    var profilePaths = [];
    var readdirp = require('readdirp'); 
    var glob = require("glob")
    files = glob.sync(getTempPath()+"/Server/*/*/*/profiles");
    readdirp({ root: files[0], fileFilter: '*.profile.xml'}, function (errors, res) {
      if (errors) {
        errors.forEach(function (err) {
          alert('Error: ', err);
        });
        resetApp()
      }
      //exclude the built in profiles
      $.each(res.files, function(index,value) {
        if (value.name !== "dynaTrace Self-Monitoring.profile.xml") {
          profilePaths.push({name:value.name,path:value.fullPath})
        }
      });
      if (!Array.isArray(profilePaths) || !profilePaths.length) {
        alert('No system profiles found, please verify you packaged all system files in your support archive.')
        resetApp()
      } else {
        console.log('>> '+profilePaths.length+' system profile(s) extracted')
        var profiles = []
        $.each(profilePaths, function(index,value) {
          profiles.push([value.name,value.path])
        });
        if (profiles.length > 1) {
          multiProfiles = true;
          showPicker(true)
          populateProfilePicker(profiles)
        } else {
          var profileObject = parseXML(profilePaths[0].path)
          compareMeasuresToDashboards(profileObject)
          resetApp()
        }
      }
    });
  } 
  
  
  
  
  //profile picker functions and click actions
  function populateProfilePicker(profiles) {
    $.each(profiles, function(index,value) {
      $('#profiles-drop').append('<option value="'+value[1]+'">'+value[0]+'</option>')
    })
  }
  $('#profile-picker').on('change', function() {
    var selected = $(this).val();
    if (selected == "open-all") {
      updateStatus('Analyzing profiles..')
      setTimeout(function(){ 
        $('#profiles-drop option').each(function () {
          var profile = $(this).val();
          var profileObject = parseXML(profile)
          compareMeasuresToDashboards(profileObject)
        });
        resetApp()
      }, 500);
    } else {
      updateStatus('Analyzing profile..')
      setTimeout(function(){ 
        var profileObject = parseXML(selected)
        compareMeasuresToDashboards(profileObject)
        resetApp()
      }, 500);
    }
    showPicker(false)
  })
  function resetPicker() {
    $("#profile-picker").val($("#profile-picker option:first").val());
    $('#profiles-drop').find('option').remove().end();
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
    var version;
    var agentGroups;
    var applications;
    var measuresFromIncidentsAndTransactions = []
    var fileName = path.split("/")[path.split("/").length - 1];
    var fileNameWin = path.split("\\")[path.split("\\").length - 1];
    parser.parseString(data, function (err, result) {
      console.log(result)
      if (err) {
        errors.forEach(function (err) {
          alert('Error: ', err);
        });
      }
      version = result.dynatrace.$.version;
      //parse agent group count
      if (result.dynatrace.systemprofile[0].agentgroups) {
        if (result.dynatrace.systemprofile[0].agentgroups[0]) {
          agentGroups = result.dynatrace.systemprofile[0].agentgroups[0].agentgroup.length;
        }
      }
      //parse application count
      if (result.dynatrace.systemprofile[0].uemconfiguration[0].applications[0]) {
        applications = result.dynatrace.systemprofile[0].uemconfiguration[0].applications[0].application.length;
      }
      //parse regular user defined measures
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
      //find all the measures that are used in incidents
      $.each(result.dynatrace.systemprofile[0].incidentrules[0].incidentrule, function(index,value) {
        if (typeof value.conditions !== "undefined") {
          measuresFromIncidentsAndTransactions.push(value.conditions[0].condition[0].$.refmeasure);
        }
      })
      //find all the measures used in user defined business transactions
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
        nameWin: fileNameWin,
        path: path,
        cleanMeasures: cleanMeasures,
        allMeasures: deduplicatedMeasures,
        transactions: transactions.removeDuplicates(),
        version: version,
        agentGroups: agentGroups,
        applications: applications
      }
    }
    console.log('>> system profile '+obj.profile.name+' parsed and measures saved')
    return obj;
  }
  
  
  
  
  //read the server log
  function readServerLog() {
    console.log('here')
    var fs = require('fs-extra');
    var glob = require("glob")
    files = glob.sync(getTempPath()+"/Server/*/*/*/logs/Server.0.0.log");
    fs.readFile(files[0], 'utf-8', function (err, data) {
      if(err){
        alert("An error ocurred reading the file :" + err.message);
        return;
      }
    });
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
    //check the web dashboards
    unusedMeasuresPlusWeb = compareMeasuresToWebDashboards(unusedMeasures)
    //create the package to send to the modal through ipc
    var args = {
      profileObject: profileObject,
      unusedMeasures: unusedMeasuresPlusWeb,
      dashboards: dashboards,
      server: serverName
    }
    //message the main process and send the package
    const ipc = require('electron').ipcRenderer
    ipc.send('open-modal', args)
    //logs
    console.log('>> measures compared to all dashboards, unused measures saved')
    console.log('>> '+unusedMeasuresPlusWeb.length+' unused measures found')
    console.log('>> modal opened')
  }
  
  
  
  
  //compare the unused measure list to the web dashboards
  function compareMeasuresToWebDashboards(unusedMeasures) {
    unusedMeasuresPlusWeb = [];
    var glob = require("glob")
    var fs = require('fs-extra');
    files = glob.sync(getTempPath()+"/Server/*/*/*/webdashboards/*.json");
    if (files[0]) {
      $.each(unusedMeasures, function(index,measure) {
        var count = 0;
        //iterate over the files in the web dashboard folder and search for the measure
        $.each(files, function(index,path) {
          var file = fs.readFileSync(path, 'ascii');
          if (file.indexOf(measure)>-1) {
            count++
            return false
          }
        })
        //save the measure if it was not found in any file
        if (count == 0) {
          unusedMeasuresPlusWeb.push(measure)
        }
      })
    } else {
      unusedMeasuresPlusWeb = unusedMeasures;
      console.log('>> no web dashboards found')
    }
    return unusedMeasuresPlusWeb;
  }
  
  
  
  
  //update the text under the icon
  function updateStatus(text) {
    $('.drag-zone p').text(text);
  }
  
  
  
  
  //find out where the user data is and create the temp path
  function getTempPath() {
    const {app} = require('electron').remote;
    var tempPath = app.getPath('userData')+"/tmp";
    return tempPath;
  } 
  
  
  
  
  //message the main process and ask to delete the tmp dir
  function clearTempDir() {
    const ipc = require('electron').ipcRenderer
    ipc.send('clear-tmp')
  }
  
  
  
  
  //reset app state
  function resetApp() {
    resetPicker()
    clearTempDir()
    updateStatus('Drop Support Archive')
    multiProfiles = false;
  }
  
  
  
  
  //show or hide the profile picker view
  function showPicker(bool) {
    if (bool) {
      $('.drag-zone .default').hide()
      $('.drag-zone .picker').show()
    } else {
      $('.drag-zone .default').show()
      $('.drag-zone .picker').hide()
    }
  }
  
  
  
  
  //removes duplicate entries from arrays
  Array.prototype.removeDuplicates = function () {
    return this.filter(function (item, index, self) {
      return self.indexOf(item) == index;
    });
  };
  
  
  
  //open about window
  const aboutWindow = require('electron').remote.BrowserWindow
  const path = require('path')
  const newWindowBtn = document.getElementById('info-button')
  newWindowBtn.addEventListener('click', function (event) {
    const modalPath = path.join('file://', __dirname, 'about.html')
    let win = new aboutWindow({ 
      width: 280, 
      height: 190,
      resizable: false,
      minimizable: false,
      maximizable: false,
      backgroundColor: '#f0f0f0',
      title: '',
    })
    win.on('close', function () { win = null })
    win.loadURL(modalPath)
    win.show()
  })

  
})();