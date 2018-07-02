const {ipcRenderer} = require('electron')

window.ipc = window.ipc || {},
function(n) {
    ipc.messaging = {

      sendOpenSecondWindowEvent: function(args) {
        ipcRenderer.send('open-second-window', args)
      },

      sendCloseSecondWindowEvent: function() {
        ipcRenderer.send('close-second-window', 'an-argument')
      },

      sendToMessageBox: function (event, text) {
        switch (text) {
          case 'Checking for updates...':
            document.getElementById('footer-spinner').removeAttribute('hidden')
            document.getElementById('message-box').innerHTML = text
          break;
          case 'Download in progress...':
            document.getElementById('footer-spinner').removeAttribute('hidden')
            document.getElementById('message-box').innerHTML = text
          break;
          default:
            document.getElementById('footer-spinner').setAttribute('hidden', 'hidden')
            document.getElementById('message-box').innerHTML = text
          break;
        }
          
          console.log(text)
          
            
          
        
        
        
        
      },

      init: function() {
        //Open Help
        $('.help-icon').click(function(e){
          ipc.messaging.sendOpenSecondWindowEvent()
        })
        //Close Help
        $('.close-me-button').click( function (e) {
          ipc.messaging.sendCloseSecondWindowEvent()
        })
        ipcRenderer.on('message', (event, text) => {

          ipc.messaging.sendToMessageBox(event, text)
          
        })
        ipcRenderer.on('updateClicked', (event, args) => {
          console.log('updateClicked', event, args)
          ipcRenderer.send('checkUpdatesNow')
        })
      }
    };

    n(function() {
        ipc.messaging.init();
    })

}(jQuery);
