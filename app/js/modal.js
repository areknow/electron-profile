(function () {
  
  var unusedMeasures;
  var allMeasures;
  var transactions;
  var dashboards;
  
  //populate lists
  require('electron').ipcRenderer.on('ping', (event, message) => {
    
    unusedMeasures = message.unusedMeasures;
    allMeasures = message.profile.profile.allMeasures;
    transactions = message.profile.profile.transactions;
    dashboards = message.dashboards;
    
    var title = document.getElementById('modal-title');
    console.log(message)
    $.each(message.profile, function(index,value) {
      title.innerHTML = value.name
      $('.section-3 .material .title span').text(value.name)
    })
    $.each(message.unusedMeasures, function(index,value) {
      populateUnusedMeasureList(value)
      $('#modal .section-1 .inner .count').text(message.unusedMeasures.length)
    })
    $.each(message.profile.profile.allMeasures, function(index,value) {
      populateAllMeasuresList(value)
      $('#modal .section-2 .inner-1 .count').text(message.profile.profile.allMeasures.length)
    })
    $.each(message.profile.profile.transactions, function(index,value) {
      populateTransactionsList(value)
      $('#modal .section-2 .inner-2 .count').text(message.profile.profile.transactions.length)
    })
    $.each(message.dashboards, function(index,value) {
      populateDashboardsList(value)
      $('#modal .section-2 .inner-3 .count').text(message.dashboards.length)
    })
  })
  function populateUnusedMeasureList(value) {
    return $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-1 ul'));
  }
  function populateAllMeasuresList(value) {
    return $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-2 .inner-1 ul'));
  }
  function populateTransactionsList(value) {
    return $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-2 .inner-2 ul'));
  }
  function populateDashboardsList(value) {
    return $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal .section-2 .inner-3 ul'));
  }
  
  
  
  //print a list to a text file 
  function exportList(list) {
    var output = "";
    $.each(list, function(index,item) {
      output += item+"\r\n";
    })
    var app = require('electron').remote; 
    var dialog = app.dialog;
    dialog.showSaveDialog(function (fileName) {
      if (fileName === undefined){
        console.log("You didn't save the file");
        return;
      } 
      var fs = require('fs-extra');
      fs.writeFile(fileName+".txt", output, function (err) {
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
    exportList(unusedMeasures);
  })
  $('.section-3 .buttons .print-all-measures').click(function() {
    exportList(allMeasures);
  })
  $('.section-3 .buttons .print-transactions').click(function() {
    exportList(transactions);
  })
  $('.section-3 .buttons .print-dashboards').click(function() {
    exportList(dashboards);
  })
  
})();