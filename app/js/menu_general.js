"use strict";


let devStatus = false;


function generalSelect() {
	uiShowSection('general');
}

async function generalAbout() {
	modalAboutShow(hidGetSerial());
}

async function loadStatus() {
	devStatus = await hidGetStatus(1000);
}

function generalUpdateInfo() {
	if (devStatus.Mode === 'pc') {
		
		$('#gen_user_name').text(devStatus.Name);
		
		$('#gen_wallets_count').text(devStatus.WalletsCount);
		$('#gen_wallets_max').text(devStatus.MaxWallets);
		
		$('#gen_passwords_count').text(devStatus.PasswordsCount);
		$('#gen_passwords_max').text(devStatus.MaxPasswords);
		
		$('#gen_fw_ver').text(devStatus.FirmwareVersion.toFixed(2));
		$('#gen_boot_ver').text(devStatus.BootVersion.toFixed(2));
		
		if (devStatus.Admin) {
			$('#gen_is_admin').text('yes');
		} else {
			$('#gen_is_admin').text('no');
		}
	}
}

async function randomInit() {
	if (!devStatus.RndInited) {
		
		infoShow('Attention', 'Please press random buttons on device', 'info', 5000);
		await hidInitRnd(120000);
		infoHide();
		await loadStatus();
	}
}

async function generalAddUser() {
	if (!hidIsBusy()) {
		
		let ret = await modalAddUser(devStatus.Admin);
		
		if (ret) {
			let name = ret.Name;
											
			infoShow('Attention', 'Enter PIN on device for new user', 'info', 5000);
			ret = await hidAddUser(ret.Name, ret.Admin, 180000);
			infoHide();
			
			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
			} else {
				
				await loadStatus();
				await loadPasswords();
				await loadWallets();
				
				generalUpdateInfo();
				
				if (name === devStatus.Name) {
					infoShow('Success', 'User added', 'success', 2000);
				} else {
					infoShow('Error', 'Add user error. Please try again', 'error', 10000);
				}
			}
		}
	}
}

