
const {app, BrowserWindow} = require('electron')

let win;

function createWindow () {
	win = new BrowserWindow({
			width: 1050,
			height: 700,
			minWidth: 1050,
			minHeight: 700,
			frame: false,
			show: false, 
			icon: __dirname + '/app/icons/512x512.png'});

	win.loadFile('./app/index.html');

	win.on('closed', () => {
		win = null
	});
	
	win.once('ready-to-show', () => {
		win.show()
	});
}

app.on('browser-window-blur', (event, win) => {
	win.webContents.send('blur-element');
});

app.on('browser-window-focus', (event, win) => {
	win.webContents.send('focus-element');
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (win === null) {
		createWindow();
	}
});
