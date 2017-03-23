(function () {
  
  //populate lists
  require('electron').ipcRenderer.on('ping', (event, message) => {
    var title = document.getElementById('modal-title');
    console.log(message)
    $.each(message.profile, function(index,value) {
      title.innerHTML = value.name
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
  
  
  
  
  
  
  //click to copy on a list item
  $('#modal').on('click', 'li', function() {
    const clipboard = require('electron').clipboard
    clipboard.writeText($(this).text())
  })
  
  
  
  //nav button functions
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

  
  
})();


function exportUnusedMeasureList() {
  var app = require('electron').remote; 
  var dialog = app.dialog;
  dialog.showSaveDialog(function (fileName) {
    if (fileName === undefined){
      console.log("You didn't save the file");
      return;
    } 
    var fs = require('fs-extra');
    var content = "1st line text" +"\n" + "2nd line text";
    fs.writeFile(fileName+".txt", content, function (err) {
      if(err){
        alert("An error ocurred creating the file "+ err.message)
      }
    });
  });
}

