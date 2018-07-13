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
			sendCloseLogWindowEvent: function () {
				ipcRenderer.send('close-log-window')
			},
			sendLogsToContainer: function (event, text) {
				let textarea = $(document).find('#log-container')
				$(textarea).val(text)
			},

			// Posts the Check for updates messages to the version number in the footer of the main window.
			sendUpdateToMessageBox: function (event, text) {
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
				 * 
				 * Since main menu is handled in the main process in a template file, it has to send to the
				 * check for updates click to the renderer process, which then has to send back to the scripts on
				 * main.js to perform the updates
				 * 
				 */

				// Open Help
				$('.help-icon').click(function(e){
					ipc.messaging.sendOpenSecondWindowEvent()
				})

				// Open Help from main menu
				ipcRenderer.on('help-clicked', () => {
					ipc.messaging.sendOpenSecondWindowEvent()
				})

				// Close Help
				$('.close-me-button').click( function (e) {
					ipc.messaging.sendCloseSecondWindowEvent()
				})

				// Receives the auto-update messages
				ipcRenderer.on('updateMessage', (event, text) => {
					ipc.messaging.sendUpdateToMessageBox(event, text)
				})

				//Receives Log from main and sends to the textarea in logWindow
				ipcRenderer.on('logs', (event, text) => {
					ipc.messaging.sendLogsToContainer(event, text)
				})

				// Receives the message from main process and sends back to the update functions
				ipcRenderer.on('updateClicked', (event, args) => {
					ipcRenderer.send('checkUpdatesNow')
				})

				// Receives the message from main process and sends back to show the logs in a seperate window
				ipcRenderer.on('showLogsClicked', (event, text) => {
					ipcRenderer.send('checkLogs')
				})

				// Check for updates using the footer
				$('#footer-check-for-updates').on('click', function(e){
					e.preventDefault()
					ipcRenderer.send('checkUpdatesNow')
				})

				// Close the log window
				$('.close-log-button').click(function(e){
					ipc.messaging.sendCloseLogWindowEvent()
				})

				// Send print command to main
				$('.print-pdf').on('click', function (e){
					ipcRenderer.send('print-to-pdf')
				})

				// Receive print from main menu
				ipcRenderer.on('print-clicked', () => {
					ipcRenderer.send('print-to-pdf')
				})

				// Not used at this time. Receives a confirmation from the printToPDF()
				ipcRenderer.on('wrote-pdf', (event, path) => {
					//const message = `Wrote PDF to: ${path}`
					//document.getElementById('pdf-path').innerHTML = message

				})

				// Send log refresh to main
				$('#refresh-logs-button').on('click', function (e) {
					ipc.messaging.sendLogsToContainer('', '')

					$('#log-helper-text').html('Updated logs')
					setTimeout( function () {
						$('#log-helper-text').html('')
					}, 4000)
					ipcRenderer.send('checkLogs')
				})

				// Send clear logs to delete the info in the log file
				$('#clear-logs-button').on('click', function (e) {
					ipcRenderer.send('clear-logs')
				})

				// Receives the confirmation that the logs ar cleared, then checks the logs again for the change.
				ipcRenderer.on('logs-cleared', (event, text) => {
					$('#log-helper-text').html(text)
					setTimeout( function () {
						$('#log-helper-text').html('')
					}, 4000)
					ipcRenderer.send('checkLogs')
				})
			}
		};

		n(function() {
				ipc.messaging.init();
		})

}(jQuery);
