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
  
  
})();


//function makeTimeDiv(drop, date, enabled, sessionTime, sessionDate, sessionId, sessionName, sessionCapacity) {
//  if (enabled) {
//    return $('<div/>', {
//      "class": 'time tooltip',
//      "data-time": sessionTime,
//      "data-date": sessionDate,
//      "data-id": sessionId,
//      "data-type": sessionName,
//      "title": 'remaining seats: ' + sessionCapacity,
//      "text": sessionTime
//    }).appendTo(drop);
//  } else {
//    return $('<div/>', {
//      "class": 'time time-disabled tooltip',
//      "text": sessionTime
//    }).appendTo(drop);
//  }
//}
//
//$("<li>").append(
//    $("<div>", {class: "col-row"}).append(