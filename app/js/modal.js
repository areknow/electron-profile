'use strict';

(function () {
  
  
  require('electron').ipcRenderer.on('ping', (event, message) => {
    var title = document.getElementById('modal-title');
    console.log(message)
    $.each(message.profile, function(index,value) {
      title.innerHTML = value.name
    })
    $.each(message.unusedMeasures, function(index,value) {
      populateList(value)
    })
  })
  
  
  function populateList(value) {
    return $('<li>',{class:'truncate-ellipsis'}).append(
      $('<span>', {text: value})
    ).appendTo($('#modal ul'));
  }
  
  
  $('#modal').on('click', 'li', function() {
    const clipboard = require('electron').clipboard
    clipboard.writeText($(this).text())
  })
  
  


  
})();


