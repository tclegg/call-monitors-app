const {Menu} = require('electron')
const electron = require('electron')
const app = electron.app
let i18n = new (require('../translations/i18n'))



const template = [
	{
		label: i18n.__('Edit'),
		submenu: [
			{
				role: 'undo', label: i18n.__('Undo')
			},
			{
				role: 'redo', label: i18n.__('Redo')
			},
			{
				type: 'separator'
			},
			{
				role: 'cut', label: i18n.__('Cut')
			},
			{
				role: 'copy', label: i18n.__('Copy')
			},
			{
				role: 'paste', label: i18n.__('Paste')
			},
			{
				role: 'pasteandmatchstyle', label: i18n.__('Paste and Match Style')
			},
			{
				role: 'delete', label: i18n.__('Delete')
			},
			{
				role: 'selectall', label: i18n.__('Select all')
			},
			{
				type: 'separator'
			},
			{
				label: i18n.__('Print to PDF'),
				click (item, focusedWindow) { 
					//Send the print-pdf command to the Renderer Process
					focusedWindow.webContents.send('print-pdf-clicked', focusedWindow)
				}
			},
			{
				label: i18n.__('Print'),
				click (item, focusedWindow) {
					//Send the print command to the Renderer Process
					focusedWindow.webContents.send('print-clicked', focusedWindow)
				},
				accelerator: 'CmdOrCtrl+P'
			}
		]
	},
	{
		label: i18n.__('View'),
		submenu: [
			{
				role: 'reload',
				label: i18n.__('Reload'),
				accelerator: 'CmdOrCtrl+R'
			},
			{
				role: 'forcereload',
				label: i18n.__('Hard Refresh'),
				accelerator: 'CmdOrCtrl+Shift+R'
			},
			{
				role: 'resetzoom', label: i18n.__('Actual size')
			},
			{
				role: 'zoomin', label: i18n.__('Zoom in')
			},
			{
				role: 'zoomout', label: i18n.__('Zoom out')
			},
			{
				type: 'separator'
			},
			{
				role: 'togglefullscreen', label: i18n.__('Toggle fullscreen')
			}
		]
	},
	{
		role: 'window', label: i18n.__('Window'),
		submenu: [
			{
				role: 'minimize', label: i18n.__('Minimize')
			},
			{
				role: 'close', label: i18n.__('Close')
			},
			{
				role: 'toggledevtools',
				label: i18n.__('Toggle Developer Tools'),
				accelerator: 'CmdOrCtrl+Shift+I'
			}
		]
	},
	{
		role: 'help', label: i18n.__('Help'),
		submenu: [
			{
				label: i18n.__('Check for updates'),
				click (item, focusedWindow) { 
					//Send the update command to the Renderer Process
					focusedWindow.webContents.send('updateClicked', focusedWindow)
				}
			},
			{
				label: i18n.__('Show Logs'),
				click (item, focusedWindow) {
					focusedWindow.webContents.send('showLogsClicked', focusedWindow)
				}
			},
			{
				label: i18n.__('Report a bug'),
				click (item, focusedWindow) {
					electron.shell.openExternal('https://github.com/tclegg/call-monitors-app/issues')
				}
			},
			{
				type: 'separator'
			},
			{
				label: i18n.__('About'),
				click(item, focusedWindow) {
					focusedWindow.webContents.send('help-clicked', focusedWindow)
				}
			}
		]
	}
]

if (process.platform === 'darwin') {
	const name = app.getName()
	template.unshift({
		label: name,
		submenu: [
			{
				role: 'about', label: i18n.__('About') + " " + app.getName()
			},
			{
				type: 'separator'
			},
			{
				role: 'services', label: i18n.__('Services'),
				submenu: []
			},
			{
				type: 'separator'
			},
			{
				role: 'hide', label: i18n.__('Hide') + " " + app.getName()
			},
			{
				role: 'hideothers', label: i18n.__('Hide others')
			},
			{
				role: 'unhide', label: i18n.__('Unhide')
			},
			{
				type: 'separator'
			},
			{
				role: 'quit', label: i18n.__('Quit') + " " + app.getName()
			}
		]
	})
	template[1].submenu.push(
		{
			type: 'separator'
		},
		{
			label: i18n.__('Speech'),
			submenu: [
				{
					role: 'startspeaking', label: i18n.__('Start speaking')
				},
				{
					role: 'stopspeaking', label: i18n.__('Stop speaking')
				}
			]
		}
	)
	template[3].submenu = [
		{
			label: i18n.__('Close'),
			accelerator: 'CmdOrCtrl+W',
			role: 'close'
		},
		{
			label: i18n.__('Minimize'),
			accelerator: 'CmdOrCtrl+M',
			role: 'minimize'
		},
		{
			label: i18n.__('Zoom'),
			role: 'zoom'
		},
		{
			type: 'separator'
		},
		{
			label: i18n.__('Bring all to front'),
			role: 'front'
		},
		{
			type: 'separator'
		},
		{
			role: 'toggledevtools',
			label: i18n.__('Toggle Developer Tools'),
			accelerator: 'CmdOrCtrl+Shift+I'
		}
	]
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
