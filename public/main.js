$(function() {

  var username = $( "input[name='username'" ).val();
  var isAdmin = +($( "input[name='isadmin'" ).val());
  var roomname = $( "input[name='roomname'" ).val();

  // admin panel
  if(!isAdmin){
    $(".admin-block button").remove();
  }
  //roomname set
  $(".room-title").text(roomname);

  //default settings
  var connected = false;
  var typing = false;
  var lastTypingTime;

  var smiles = [
    "128513", "128514", "128515", "128516", "128517",
    "128518", "128521", "128522", "128523", "128524",
    "128525", "128527", "128530", "128531", "128532",
    "128534", "128536", "128538", "128540", "128541"
  ];

  var colors = [
    "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe",
    "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080",
    "#FFFFFF", "#000000"
  ];
  var randomColor = getRandomColor();

  var smileBlock = document.getElementById("smile");
  for(var i = 0; i < smiles.length; i++){
    var smile = document.createElement('li');
    smile.innerHTML = "&#" + smiles[i] + ";";
    smileBlock.appendChild(smile);
  };

  var colorBlock = document.getElementById("colors");
  var colorsForTitle = document.getElementById("colorsForTitle");
  for(var i = 0; i < colors.length; i++){
    var color = document.createElement('li');
    color.setAttribute('style', 'background-color:' + colors[i]);
    colorBlock.appendChild(color);
    var color = document.createElement('li');
    color.setAttribute('style', 'background-color:' + colors[i]);
    colorsForTitle.appendChild(color);
  };

  //when user started typing
  $(".message-text").on('input', function() {
    updateTyping();
  });

  // add smiles to message
  $("#smile").children().on('click',function() {
    var input = $(".message-text");
    input.val($(".message-text").val() + $( this ).text());
  });

  //change color of message
  $("#colors").children().on('click',function() {
    var input = $(".message-text");
    var css = {
        color: $( this ).css("background-color")
    }
    input.css(css);
  });

  //change color for title
  $("#colorsForTitle").children().on('click',function() {
    var input = $("#title");
    var css = {
        color: $( this ).css("background-color")
    }
    input.css(css);
  });

  //make bold message
  $(".bold-picker").on('click', function () {
    var input = $(".message-text");
    if($(this).hasClass("active")){
      $(this).removeClass("active");
      var css = {
        "font-weight": "normal"
      };
      input.css(css);
    } else {
      $(this).addClass("active");
      var css = {
        "font-weight": "bold"
      };
      input.css(css);
    }
  });




  //make italic message
  $(".italic-picker").on('click', function () {
    var input = $(".message-text");
    if($(this).hasClass("active")){
      $(this).removeClass("active");
      var css = {
        "font-style": "normal"
      };
      input.css(css);
    } else {
      $(this).addClass("active");
      var css = {
        "font-style": "italic"
      };
      input.css(css);
    }
  });

  // change title
  $("#save-title").on('click', function () {
    var title = $("#title").val();
    if(title){
      $(".room-title").text(title);
      var style = {
        "font-weight": $("#title").css("font-weight"),
        "color":  $("#title").css("color")
      }
      $(".room-title").css(style);
      socket.emit("title changed", {
        title: title,
        style: style
      });
    }
  });

  // bold picker title
  $(".bold-picker-title").on('click', function () {
    var input = $("#title");
    if($(this).hasClass("active")){
      $(this).removeClass("active");
      var css = {
        "font-weight": "normal"
      };
      input.css(css);
    } else {
      $(this).addClass("active");
      var css = {
        "font-weight": "bold"
      };
      input.css(css);
    }
  });

  $('.message-text').bind("sendMessage",function(e){
      sendMessage();
  });

  //event handling when Enter pressed
  $('.message-text').keyup(function(e){
    e.preventDefault();
    if(e.keyCode == 13){
          $(this).trigger("sendMessage");
      }
  });

  // event handlong when click "send message"
  $('.send').on('click', function(e){
    e.preventDefault();
    $('.message-text').trigger("sendMessage");
  });

  // connect socket.io
  var socket = io();

  socket.emit('add user', username);

  //user logined
  socket.on('login', function (data) {
    connected = true;
    // addUser(username);
    data.users.forEach(function (el, val) {
      addUser(el);
    })
    updateUsersNumber(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    addUser(data.username);
    updateUsersNumber(data);
  });

  // when user left chat
  socket.on('user left', function (data) {
    updateUsersNumber(data);
    removeUserName(data);
  });

  // when user left chat
  socket.on('title changed', function (data) {
    $(".room-title").text(data.title);
    $(".room-title").css(data.style);
  });


  socket.on('reconnect', function () {
    if (username) {
      socket.emit('add user', username);
    }
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addMessageToChat(data);
    scrollToBottom();
  });

  socket.on('typing', function (data) {
    addTypingStatus(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeTypingStatus(data);
  });

  // functions

  //add user
  function addUser(username){
    var usersList = document.getElementById("users");
    var li = document.createElement("li");
    var span1 = document.createElement("span");
    span1.setAttribute("class", "title");
    var icon = document.createElement("i");
    if(isAdmin){
      icon.setAttribute("class", "fas fa-star");
    } else {
      icon.setAttribute("class", "fas fa-comment");
    }
    span1.appendChild(icon);
    var span2 = document.createElement("span");
    span2.innerHTML = username;
    li.appendChild(span1);
    li.appendChild(span2);
    usersList.appendChild(li);
  }

  //update user number
  function updateUsersNumber(data) {
    $(".users-count").text(data.numUsers);
  };

  function removeUserName(data) {
    $("#users").children().each(function () {
      if(data.username == $(this).children().last().text()){
        $(this).remove();
      }
    })
  };

  // Sends a chat message
  function sendMessage () {
    var input = $(".message-text");
    var message = input.val()
    var styles = {
      color: input.css("color"),
      "font-weight": input.css("font-weight"),
      "font-style": input.css("font-style")
    }
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      cleanMessageInput();
      addMessageToChat({
        username: username,
        message: message,
        styles: styles
      });
      scrollToBottom();
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', {
        username: username,
        message: message,
        styles: styles
      });
    }
  }


  // clear input after message sending
  function cleanMessageInput () {
    $(".message-text").val('');
  }

  // display message in html view
  function addMessageToChat(data) {
    var messages = document.getElementById("messages");
    var li = document.createElement("li");
    li.setAttribute("class", "message-item");
    var span1 = document.createElement("span");
    span1.setAttribute("class", "user");
    span1.innerHTML = "&lt;" + data.username + "&gt;";
    span1.setAttribute('style', 'color:'+ randomColor);
    var span2 = document.createElement("span");
    span2.innerHTML = data.message;
    span2.style.color = data.styles.color;
    span2.style.fontWeight = data.styles["font-weight"];
    span2.style.fontStyle = data.styles["font-style"];
    span2.setAttribute("class", "message");
    li.appendChild(span1);
    li.appendChild(span2);
    messages.appendChild(li);
  }

  // change typing status
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= 600 && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, 600);
    }
  };

  //display in html view typing status
  function addTypingStatus(data) {
    var messages = document.getElementById("messages");
    var li = document.createElement("li");
    li.setAttribute("class", "message-item");
    var span1 = document.createElement("span");
    span1.setAttribute("class", "user");
    span1.innerHTML = "&lt;" + data.username + "&gt;";
    span1.setAttribute('style', 'color:'+ randomColor);
    var span2 = document.createElement("span");
    span2.innerHTML = "is typing";
    span2.setAttribute("class", "typing");
    li.appendChild(span1);
    li.appendChild(span2);
    messages.appendChild(li);
  };

  // scroll to bottom of messages block
  function scrollToBottom() {
    $(".messages-block").animate({ scrollTop: $('.messages-block').prop("scrollHeight")}, 1000);
  }

  // remove typing status
  function removeTypingStatus(data) {
    $("#messages").children().each(function () {
      if("<" + data.username + ">" == $(this).children().first().text() ){
        if($(this).children().last().text() == "is typing"){
          $(this).remove();
        }
      }
    })
  }

  function getRandomColor() {
    return colors[Math.round(Math.random() * (colors.length))];
  };
});
