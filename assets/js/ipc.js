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
			// Posts the Check for updates messages to the version number in the footer of the main window.
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
			},

			init: function() {
				/**
				 * Event Listeners
				 */
				// Open Help
				$('.help-icon').click(function(e){
					ipc.messaging.sendOpenSecondWindowEvent()
				})
				// Close Help
				$('.close-me-button').click( function (e) {
					ipc.messaging.sendCloseSecondWindowEvent()
				})
				
				// Receives the auto-update messages
				ipcRenderer.on('message', (event, text) => {
					ipc.messaging.sendToMessageBox(event, text)
				})
				
				/**
				 *  Since main menu is handled in the main process in a template file, it has to send to the
				 * check for updates click to the renderer process, which then has to send back to the scripts on
				 * main.js to perform the updates
				 */

				// Receives the message from main process and sends back to the update functions
				ipcRenderer.on('updateClicked', (event, args) => {
					ipcRenderer.send('checkUpdatesNow')
				})
				// Check for updates using the footer
				$('#footer-check-for-updates').on('click', function(e){
					e.preventDefault()
					ipcRenderer.send('checkUpdatesNow')
				})
			}
		};

		n(function() {
				ipc.messaging.init();
		})

}(jQuery);
