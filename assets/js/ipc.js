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

      init: function() {
				//Open Help
				$('.glyphicon-question-sign').click(function(e){
					ipc.messaging.sendOpenSecondWindowEvent()
				})
				//Close Help
				$('.close-me-button').click( function (e) {
          ipc.messaging.sendCloseSecondWindowEvent()
        })
        
      }
    };

    n(function() {
        ipc.messaging.init();
    })

}(jQuery);
