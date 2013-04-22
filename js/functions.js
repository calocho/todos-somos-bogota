// JavaScript
var siteRoot = 'http://esmart.calocho.co/todossomosbogota/';
var apiPath = 'http://www.todossomosbogota.com/v2/api';
var prevPage = 'home-page';
var hash, map, pos, marker, currImg, reportId, base64_img, canvas, ctx, ctx2, picIcon;
var myPosition = {
lat: '',
lng: ''
}

// Session Data
var username, sessid, session_name;

// Variables del reporte
var reportCategory = null;
var reportId = null;
var fileId = null;
var comment = '';

document.addEventListener('deviceready', onDeviceReady, false);
// google.maps.event.addDomListener(window, 'load', drawMap);

function resetReport() {
    reportCategory = null;
    reportId = null;
    fileId = null;
    comment = '';
    base64_img = null;
    
    // Reset canvas
    ctx.clearRect(0, 0, 0, 0);
    ctx2.clearRect(0, 0, 300, 150);
    resetImgBtn();
    
    // Reset tooltip class
    $('.tooltip').each(function(){
                       $(this).val($(this).attr('default-text'));
                       });
    
}

function getElement(id) {
    return document.getElementById(id);
}

function openPage(id) {
    // Ocultar todas las páginas
    $('div[data-role="page"]').each(function () {
                                    $(this).css('display', 'none').css('top', -$(window).height());
                                    });
    
    // Revisar si existe la sesión guardada
    if (!localStorage.getItem('username')) {
        if (id != 'login' && id != 'register') {
            id = 'logedout';
            $('#username').html('');
        }
    } else {
        $('#username').html('Bienvenido, <span class="bold">' + localStorage.getItem('username') + '</span>');
        
        // Si existe una sesión, redireccionar a homepage
        if (id == 'logedout' || id == 'login' || id == 'register') {
            id = 'home';
        }
    }
    
    // Resetear formularios
    $("#login-form").reset();
    $("#register-form").reset();    
    
    // Abrir la página
    $('#' + id + '-page').css('display', 'block').css('top', 0);
    setHash(id);
    hideMsg();
};

function showMsg(msg) {
    var showTime = 2000; // tiempo durante el que se ve el mensaje
    // Establecer el mensaje a mostrar
    $('#msg-label').html(msg);
    
    // Mostrar el div
    $('#msg').css('display', 'block').click(function () {
                                            hideMsg();
                                            });
}

function hideMsg() {
    $('#msg-label').html('');
    $('#msg').css('display', 'none');
}

function login() {
    // Validate
    var required = new Array('username', 'password');
    
    for (var field in required) {
        if ($('#login-form-' + required[field]).val() == '') {
            return false;
        }
    }
    
    $.ajax({
           type: 'POST',
           url: apiPath + '/user/login',
           data: {
           username: $('#login-form-username').val(),
           password: $('#login-form-password').val()
           },
           crossDomain: true,
           beforeSend: function () {
           showMsg('Iniciando sesión');
           },
           // Mostramos un mensaje con la respuesta de PHP
           success: function (response) {
           if (response.sessid) {
           //
           username = response.user.name;
           sessid = response.sessid;
           session_name = response.session_name;
           //
           localStorage.setItem('username', username);
           localStorage.setItem('sessid', sessid);
           localStorage.setItem('session_name', session_name);
           
           openPage('home');
           } else if (jQuery.parseJSON(response)) {
           response = jQuery.parseJSON(response);
           //
           username = response.user.name;
           sessid = response.sessid;
           session_name = response.session_name;
           //
           localStorage.setItem('username', username);
           localStorage.setItem('sessid', sessid);
           localStorage.setItem('session_name', session_name);
           
           //
           openPage('home');
           } else {
           }
           
           },
           complete: function () {
           hideMsg();
           },
           error: function (errorThrown) {
           navigator.notification.alert(errorThrown.responseText,
                                        function () {},
                                        'Error',
                                        'Aceptar');
           }
           });
    
    return false;
}

function register() {
    
    // Validate
    var required = new Array('name', 'email', 'birth');
    
    for (var field in required) {
        if ($('#register-form-' + required[field]).val() == '') {
            showMsg('Campo "' + required[field] + '" está vacío.');
            return false;
        }
    }
    
    var birthDate = $('#register-form-birth').val();
    birthDate = birthDate.substr(8,2) + '/' + birthDate.substr(5,2) + '/' + birthDate.substr(0,4);
    
    $.ajax({
           type: 'POST',
           url: apiPath + '/user',
           contentType: 'application/x-www-form-urlencoded',
           data: '&field_nombre_completo[und][0][value]=' + $('#register-form-name').val() +
           '&mail=' + $('#register-form-email').val() +
           '&name=' + $('#register-form-email').val() +
           '&field_fecha_nacimiento[und][0][value][date]=' + birthDate +
           '&pass=' + '123456' +
           '&field_sexo[und][tid]=' + $("input[name='register-form-sex']:checked").val(),
           beforeSend: function () {
           
           showMsg('Cargando');
           },
           // Mostramos un mensaje con la respuesta de PHP
           success: function (response) {
           // var response = jQuery.parseJSON(response);
           
           if (response.uid) {
           navigator.notification.alert('Cuenta creada correctamente. Por favor revisa tu correo para activarla.',
                                        function(){ openPage('login'); },
                                        'Felicitaciones',
                                        'Aceptar')
           } else {
           navigator.notification.alert(response,
                                        function () {},
                                        'Error',
                                        'Aceptar');
           }
           
           },
           error: function (errorThrown) {
           navigator.notification.alert(errorThrown.responseText,
                                        function () {},
                                        'Error',
                                        'Aceptar');
           }
           });
    
    return false;
}

function logout() {
    $.ajax({
           type: 'POST',
           url: apiPath + '/user/logout',
           data: {},
           success: function (response) {},
           error: function (errorThrown) {
           },
           complete: function () {
           localStorage.clear();
           resetImgBtn();
           openPage('logedout');
           }
           });
}

function setHash(data) {
    window.location.hash = '#!/' + data;
}

function getHash() {
    hash = ((window.location.hash).substr(1)).split('!/')[1];
        
    if (hash == '' || hash == null || hash == 'undefined') {
        hash = 'home';
    }
}

// Resetear un formulario
jQuery.fn.reset = function () {
    $(this).each(function () {
                 this.reset();
                 });
}

function drawMap() {
    var mapOptions = {
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
                              mapOptions);
    
    // Try HTML5 geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
                                                 
                                                 myPosition.lat = position.coords.latitude;
                                                 myPosition.lng = position.coords.longitude;
                                                 
                                                 var pos = new google.maps.LatLng(position.coords.latitude,
                                                                                  position.coords.longitude);
                                                 
                                                 var marker = new google.maps.Marker({
                                                                                     map: map,
                                                                                     draggable: true,
                                                                                     animation: google.maps.Animation.DROP,
                                                                                     position: pos
                                                                                     });
                                                 
                                                 google.maps.event.addListener(marker, 'click', toggleBounce);
                                                 google.maps.event.addListener(marker, 'dragend', function () {
                                                                               myPosition.lat = marker.position.jb;
                                                                               myPosition.lng = marker.position.kb
                                                                               });
                                                 
                                                 map.setCenter(pos);
                                                 }, // next function is the error callback
                                                 
                                                 function (error) {
                                                 switch (error.code) {
                                                 case error.TIMEOUT:
                                                 navigator.notification.alert('Tiempo de espera excedido.',
                                                                              function(){},
                                                                              'Error',
                                                                              'Aceptar');
                                                 break;
                                                 case error.POSITION_UNAVAILABLE:
                                                 navigator.notification.alert('Ubicación no disponible.',
                                                                              function(){},
                                                                              'Error',
                                                                              'Aceptar');
                                                 break;
                                                 case error.PERMISSION_DENIED:
                                                 navigator.notification.alert('Permisos no concedidos.',
                                                                              function(){},
                                                                              'Error',
                                                                              'Aceptar');
                                                 break;
                                                 case error.UNKNOWN_ERROR:
                                                 navigator.notification.alert('Error desconocido.',
                                                                              function(){},
                                                                              'Error',
                                                                              'Aceptar');
                                                 break;
                                                 }
                                                 });
    } else {
        // Mostrar el error
        navigator.notification.alert('Navegador no compatible con la detección de ubicación.',
                                     function(){},
                                     'Error',
                                     'Aceptar');
    }
}

function toggleBounce() {
    if (marker.getAnimation() != null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function drawCanvas() {
    canvas = document.createElement('canvas');
    
    ctx = canvas.getContext('2d'),
    ctx2 = document.getElementById("canvasThumb").getContext('2d'),
    img = new Image(),
    f = document.getElementById("uploadimage").files[0],
    url = window.URL || window.webkitURL,
    src = url.createObjectURL(f);
    
    img.src = src;
    img.onload = function () {
        var width = img.width;
        var height = img.height;
        
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        
        ctx.drawImage(img, 0, 0, width, height);
        ctx2.drawImage(img, 0, 0, 300, 150);
        url.revokeObjectURL(src);
        base64_img = canvas.toDataURL("image/png");
        base64_img = base64_img.replace(/^data:image\/(png|jpg);base64,/, "");
    }
}

function resetImgBtn(){
    ctx2 = document.getElementById("canvasThumb").getContext('2d'),
    
    picIcon = new Image();
    picIcon.onload = function(){
        ctx2.drawImage(picIcon,0,0,300,150); // Or at whatever offset you like
    };
    picIcon.src = 'img/loadimage_bg@2x.png';
}

function onDeviceReady() {
        
    resetImgBtn();
    
    if (localStorage.getItem('sessid')) {
        sessid = localStorage.getItem('sessid');
        username = localStorage.getItem('username');
        session_name = localStorage.getItem('session_name');
    }
    
    /* ******************* Comienza lo que estaba en el index *************************/
    (function () {
     // Set the content height (window - header - footer)
     var content = $("div[data-role='content']");
     var header = $("div[data-role='header']");
     var footer = $("div[data-role='footer']")
     
     var pageHeight = $(window).height() - header.innerHeight() - footer.innerHeight() - $('div[data-role="content"]').css('padding-top').replace("px", "");
     
     content.css('height', pageHeight - 20);
     // $('#map-canvas').css('height', pageHeight);
     
     $('#confirmpos-btn').click(function () {
                                
                                if (myPosition.lat != '' && myPosition.lng != '') {
                                // Enviar el reporte
                                $.ajax({
                                       type: 'POST',
                                       xhrFields: {
                                       withCredentials: true
                                       },
                                       url: apiPath + '/node',
                                       contentType: 'application/x-www-form-urlencoded',
                                       data: '&type=reporte' + '&title=Reporte de ' + username + ' en Bogotá' + '&body[und][0][value]=' + comment + '&field_imagen_reporte[und][0][fid]=' + fileId + '&field_categoria_reporte[und][tid]=' + reportCategory + '&field_ubicacion_reporte[und][0][lat]=' + myPosition.lat + '&field_ubicacion_reporte[und][0][lng]=' + myPosition.lng,
                                       beforeSend: function (request) {
                                       showMsg('Guardando tu reporte');
                                       },
                                       complete: function () {
                                       hideMsg();
                                       },
                                       // Mostramos un mensaje con la respuesta de PHP
                                       success: function (response) {
                                       if (response.nid) {
                                       navigator.notification.alert(
                                                                    'Reporte creado correctamente:',    // message
                                                                    function(){
                                                                    resetReport();
                                                                    openPage('report');
                                                                    },                       // callback
                                                                    'Gracias por ayudar',               // title
                                                                    'Otro Reporte'                      // buttonName
                                                                    );
                                       
                                       
                                       } else {
                                       showMsg('Ocurrió un error al hacer tu reporte. Por favor intenta nuevamente.');
                                       }
                                       },
                                       error: function (errorThrown) {
                                       navigator.notification.alert(errorThrown.responseText,
                                                                    function () {},
                                                                    'Error',
                                                                    'Aceptar');
                                       }
                                       });
                                } else {
                                showMsg('Parece que todavía estamos localizándote. Por favor aguarda un momento.');
                                navigator.geolocation.getCurrentPosition(function (position) {
                                                                         
                                                                         myPosition.lat = position.coords.latitude;
                                                                         myPosition.lng = position.coords.longitude;
                                                                         drawMap();
                                                                         });
                                }
                                });
     
     })();
    
    (function () {
     // Prevenir el envio de formularios
     $('form').each(function () {
                    $(this).submit(function () {
                                   
                                   if ($(this).attr('action') == 'login') {
                                   login();
                                   }
                                   
                                   if ($(this).attr('action') == 'register') {
                                   if (register()) {
                                   showMsg('Enviando Registro');
                                   };
                                   };
                                   
                                   if ($(this).attr('action') == 'loadimg') {
                                   if (base64_img != '' && base64_img != null) {
                                   
                                   comment = $('#loadimg-form-description').val();
                                   
                                   if(comment == $('#loadimg-form-description').attr('default-text')){
                                    comment = '';
                                   }
                                   
                                   // AJax para crear el registro del reporte
                                   
                                   $.ajax({
                                          type: 'POST',
                                          xhrFields: {
                                          withCredentials: true
                                          },
                                          url: apiPath + '/file',
                                          contentType: 'application/x-www-form-urlencoded',
                                          data: {
                                          file: base64_img,
                                          filename: username + '_' + new Date().getTime() + '.jpg'
                                          },
                                          
                                          beforeSend: function (request) {
                                          showMsg('Cargando la imagen');
                                          },
                                          complete: function () {
                                          hideMsg();
                                          },
                                          // Mostramos un mensaje con la respuesta de PHP
                                          success: function (response) {
                                          
                                          if (response.fid) {
                                          fileId = response.fid;
                                          showMsg('Cargado correctamente.');
                                          openPage('category');
                                          } else {
                                          navigator.notification.alert(response,
                                                                       function () {},
                                                                       'Error',
                                                                       'Aceptar');
                                          }
                                          
                                          },
                                          error: function (errorThrown) {
                                          navigator.notification.alert(errorThrown.responseText,
                                                                       function () {},
                                                                       'Error',
                                                                       'Aceptar');
                                          }
                                          });
                                   } else {
                                   navigator.notification.alert('No has seleccionado una imagen.',
                                                                function () {},
                                                                'Error',
                                                                'Entendido');
                                   
                                   }
                                   }
                                   
                                   return false;
                                   });
                    });
     })();
    
    (function () {
     $('.tooltip').each(function () {
                        $(this).focus(function(){
                                      if($(this).val() == $(this).attr('default-text')){
                                      $(this).val('').css('color','#333');
                                      }
                                      });
                        
                        $(this).blur(function(){
                                     if($(this).val() == ''){
                                     $(this).val($(this).attr('default-text')).css('color','#999');
                                     }
                                     });
                        });
     })();
    
    (function () {
     // Establecer el click para las categorias
     $(function () {
       
       $('.category').each(function () {
                           $(this).children('.btnIcon').each(function () {
                                                             $(this).children('.btnLabel').each(function () {
                                                                                                $(this).click(function () {
                                                                                                              reportCategory = $(this).attr('valid');
                                                                                                              drawMap();
                                                                                                              openPage('reportmap');
                                                                                                              });
                                                                                                });
                                                             });
                           });
       });
     
     $(function () {
       $('#uploadimage').change(function () {
                                drawCanvas();
                                });
       });
     })();
    
    (function () {
     getHash();
     openPage(hash);
     
     // google.maps.event.addDomListener(window, 'load', drawMap);
     })();
    
}