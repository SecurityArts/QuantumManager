
const ipc = require('electron').ipcMain;
const electron = require('electron');
const {app, BrowserWindow, Menu, Tray} = require('electron');


let win = null;
let tray = null;
let minimized = false;
let minimizeToTray = false;
const gotTheLock = app.requestSingleInstanceLock();


const contextMenuOpen = Menu.buildFromTemplate([
	{label: 'Open', click: () => {win.show()}},
	{label: 'Exit', click: () => {
		if (win) {
			win.destroy();
			app.quit();
		}
	}}
]);


const contextMenuHide = Menu.buildFromTemplate([
	{label: 'Hide', click: () => {win.hide()}},
	{label: 'Exit', click: () => {
		if (win) {
			win.destroy();
		}
		app.quit();
	}}
]);



if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		if (win) {
			win.show();
		}
	});
}

process.argv.forEach((val, index, array) => {
	if (val == '--hidden') {
		minimized = true;
	}
});



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
		win = null;
	});
	
	win.once('ready-to-show', () => {
		if (!minimized) {
			win.show();
		}
	});
	
	win.on('hide', () => {
		if (tray) {
			tray.setContextMenu(contextMenuOpen);
		}
		
		if (minimizeToTray && (process.platform === 'darwin')) {
			app.dock.hide();
		}
	});

	win.on('show', () => {
		if (tray) {
			tray.setContextMenu(contextMenuHide);
		}
		
		if (minimizeToTray && (process.platform === 'darwin')) {
			app.dock.show();
		}
	});

}


app.on('browser-window-blur', (event, win) => {
	win.webContents.send('blur-element');
});


app.on('browser-window-focus', (event, win) => {
	win.webContents.send('focus-element');
});


app.on('ready', () => {
	if (process.platform === 'darwin') {
		tray = new Tray(__dirname + '/app/icons/16x16.png');
	} else {
		tray = new Tray(__dirname + '/app/icons/64x64.png');
	}

	createWindow();	
	tray.setToolTip('Quantum Manager');
	tray.setContextMenu(contextMenuOpen);
	
	electron.powerMonitor.on('suspend', () => {
		win.webContents.send('pc-suspend');
	});
	
	electron.powerMonitor.on('resume', () => {
		win.webContents.send('pc-resume');
	});

});

app.on('window-all-closed', () => {
	app.quit();
});

app.on('activate', () => {
	if (win === null) {
		createWindow();
	}
});


ipc.on('settings', (event, args) => {
	switch (args) {
		case 'MinimizeToTray=true':
			minimizeToTray = true;
			break;
			
		case 'MinimizeToTray=false':
			minimizeToTray = false;
			break;
	}
});
