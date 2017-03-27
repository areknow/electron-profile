(function () {
  
  
  var unusedMeasures;
  var allMeasures;
  var transactions;
  var dashboards;
  
  
  //message received from main process with info for each modal
  require('electron').ipcRenderer.on('profileObject', (event, message) => {
    console.log(message)
    
    
    //sort and save incoming variables and arrays
    unusedMeasures = message.unusedMeasures.sort(Intl.Collator().compare);
    allMeasures = message.profileObject.profile.allMeasures.sort(Intl.Collator().compare);
    transactions = message.profileObject.profile.transactions.sort(Intl.Collator().compare);
    dashboards = message.dashboards.sort(Intl.Collator().compare);
    
    
    //input stats to section 3
    $('.stat-version span').text(message.profileObject.profile.version)
    $('.stat-agentgroups span').text(message.profileObject.profile.agentGroups)
    if (!message.profileObject.profile.agentGroups) {
      $('.stat-agentgroups').hide()
    }
    $('.stat-applications span').text(message.profileObject.profile.applications)
    if (!message.profileObject.profile.applications) {
      $('.stat-applications').hide()
    }
    $('.stat-measures span').text(allMeasures.length)
    $('.stat-unusedmeasures span').text(unusedMeasures.length)
    $('.stat-transactions span').text(transactions.length)
    $('.stat-dashboards span').text(dashboards.length)
    $('.stat-server span').text(message.server)
    
    
    //add window title and counts
    var title = document.getElementById('modal-title');
    $('#modal .section-1 .inner .count').text(unusedMeasures.length)
    $('#modal .section-2 .inner-1 .count').text(allMeasures.length)
    $('#modal .section-2 .inner-2 .count').text(transactions.length)
    $('#modal .section-2 .inner-3 .count').text(dashboards.length)
    
    
    //add profile name to section3 title
    var profileName;
    //check if platform is windows to use back slashes
    var os = require('os');
    if (os.platform() == 'win32') {
      profileName = message.nameWin
    } else {
      profileName = message.name
    }
    title.innerHTML = profileName
    $('.section-3 .material .title #stat-profilename').text(profileName)
      
      
    //populate lists
    $.each(unusedMeasures, function(index,value) {
      populateUnusedMeasureList(value)
    })
    $.each(allMeasures, function(index,value) {
      populateAllMeasuresList(value)
    })
    $.each(transactions, function(index,value) {
      populateTransactionsList(value)
    })
    $.each(dashboards, function(index,value) {
      populateDashboardsList(value)
    })
  })
  function populateUnusedMeasureList(value) {
    $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-1 ul'));
  }
  function populateAllMeasuresList(value) {
    $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-2 .inner-1 ul'));
  }
  function populateTransactionsList(value) {
    $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-2 .inner-2 ul'));
  }
  function populateDashboardsList(value) {
    $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-2 .inner-3 ul'));
  }
  
  
  
  //print a list to a text file 
  function exportList(name,list) {
    var output = "";
    $.each(list, function(index,item) {
      output += item+"\r\n";
    })
    var app = require('electron').remote; 
    var dialog = app.dialog;
    dialog.showSaveDialog({
      defaultPath: '~/'+name
    },function (fileName) {
      if (fileName === undefined){
        console.log("You didn't save the file");
        return;
      } 
      var fs = require('fs-extra');
      fs.writeFile(fileName, output, function (err) {
        if(err){
          alert("An error ocurred creating the file "+ err.message)
        } else {
          toast('File successfully saved')
        }
      });
    });
  }
  
  
  
  //click to copy on a list item
  $('#modal').on('click', 'li', function() {
    const clipboard = require('electron').clipboard
    clipboard.writeText($(this).text())
    toast('Item copied to clipboard')
  })
  
  
  //show custom notification
  var toasting = false;
  function toast(text) {
    if (!toasting) {
      toasting = true;
      $('.toast .text').text(text)
      $('.toast').animate({bottom: 0,}, 100, function() {
        $('.toast').delay(2000).animate({bottom: -46,}, 100, function() {
          toasting = false;
        });
      });
    }
  }
  
  
  //button functions
  $('.button-1').click(function() {
    $('.section-1').fadeIn(200)
    $('.section-2').fadeOut(200)
    $('.section-3').fadeOut(200)
    $('.button-1').addClass('selected');
    $('.button-2').removeClass('selected');
  })
  $('.button-2').click(function() {
    $('.section-1').fadeOut(200)
    $('.section-2').fadeIn(200)
    $('.section-3').fadeOut(200)
    $('.button-1').removeClass('selected');
    $('.button-2').addClass('selected');
  })
  $('.button-3').click(function() {
    $('.section-1').fadeOut(200)
    $('.section-2').fadeOut(200)
    $('.section-3').fadeIn(200)
    $('.button-1').removeClass('selected');
    $('.button-2').removeClass('selected');
  })
  $('.section-3 .buttons .print-unused').click(function() {
    exportList('Unused Measures.txt',unusedMeasures);
  })
  $('.section-3 .buttons .print-all-measures').click(function() {
    exportList('All Measures.txt',allMeasures);
  })
  $('.section-3 .buttons .print-transactions').click(function() {
    exportList('Business Transactions.txt',transactions);
  })
  $('.section-3 .buttons .print-dashboards').click(function() {
    exportList('Dashboards.txt',dashboards);
  })
  
})();