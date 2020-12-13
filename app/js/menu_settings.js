"use strict";


function settingsSelect() {
	uiShowSection('settings');
	settingsManagerReadLocalSettings();
}

async function loadSettings() {
	let ret = await hidGetSettings(1000);

	if (ret.Command === 'GetSettings') {
		$('#settings_lang').val(ret.Lang);
		$('#settings_def_mode').val(ret.DefaultMode);
		$('#settings_rotate_lcd').val(ret.Rotate);
		$('#settings_auto_logout').val(ret.AutoLogout);
		$('#settings_screensaver').val(ret.ScreenSaver);
		$('#settings_print_delay').val(ret.PrintDelay);
	}

	return ret;
}

async function settingsGet() {
	if (!hidIsBusy()) {

		let ret = await loadSettings();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		} else {
			infoShow('Success', 'Settings OK', 'success', 2000);
		}
	}
}

async function settingsSet() {
	if (!hidIsBusy()) {

		let Settings = {
			Lang: $('#settings_lang').val(),
			DefaultMode: $('#settings_def_mode').val(),
			Rotate: $('#settings_rotate_lcd').val(),
			AutoLogout: $('#settings_auto_logout').val(),
			ScreenSaver: $('#settings_screensaver').val(),
			PrintDelay: $('#settings_print_delay').val()
		};

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidSetSettings(Settings, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		} else {
			infoShow('Success', 'Settings set', 'success', 2000);
		}
	}
}

async function settingsClearMem() {
	if (!hidIsBusy()) {

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidClearMemory(60000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		} else {
			infoShow('Success', 'Memory clear', 'success', 2000);

			await loadStatus();
			await loadPasswords();
			await loadWallets();
			await loadSettings();

			generalUpdateInfo();
		}
	}
}

async function settingsBackup() {
	if (!hidIsBusy()) {

		infoShow('Attention', 'Enter crypt key on device', 'info', 5000);
		let ret = await hidBackupKey(180000);

		if (ret.Command === 'BackupKey') {

			let addr = 0;
			let size = ret.Size;
			let total = ret.Size;
			let buff = new Uint8Array(size);

			ret = true;
			await modalBackupRestoreShow('Backup user data');

			while (ret && !ret.Error && size) {
				let s = Math.min(size, 512);

				ret = await hidBackupReadBlock(addr, s, 3000);
				if (ret && ret.Command === 'BackupBlockRead') {

					let block = hexStringToArray(ret.Data);

					buff.set(block, addr);
					addr += s;
					size -= s;

					modalBackupRestoreProgress((addr / total) * 100);
					await sleep(1);
				}
			}

			if (!ret.Error) {
				let fileName = await dialog.showSaveDialog({defaultPath: 'userdata.dat'});

				if (fileName) {
					fs.writeFileSync(fileName.filePath, buff);
				} else {
					ret = false;
				}
			}

			modalBackupRestoreHide();
		}

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		}

		if (ret.Command === 'BackupBlockRead') {
			infoShow('Attention', 'User data backup OK', 'info', 2000);
		}
	}
}

async function settingsRestore() {
	if (!hidIsBusy()) {

		let ret = false;
		let fileName = await dialog.showOpenDialog({defaultPath: 'userdata.dat'});

		if (fileName) {
			let buff = fs.readFileSync(fileName.filePaths[0]);

			if (buff && buff.length) {
				let size = buff.length;

				infoShow('Attention', 'Enter crypt key on device', 'info', 5000);
				ret = await hidBackupKey(180000);

				if (ret.Command === 'BackupKey') {

					let addr = 0;
					let total = size;

					ret = true;
					await modalBackupRestoreShow('Restore user data');

					while (ret && !ret.Error && size) {

						let s = Math.min(size, 512);
						let block = buff.slice(addr, addr + 512);

						ret = await hidBackupWriteBlock(addr, s, arrayToHexString(block), 3000)
						if (ret && ret.Command === 'BackupBlockWrite') {

							addr += s;
							size -= s;

							modalBackupRestoreProgress((addr / total) * 100);
							await sleep(1);
						}
					}

					modalBackupRestoreHide();
				}

			}
		}

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		}

		if (ret.Command === 'BackupBlockWrite') {
			infoShow('Success', 'Device restored OK and should be restarted', 'success', 5000);
			await hidRestart(3000);
		}
	}
}

