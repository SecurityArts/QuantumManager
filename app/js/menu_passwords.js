"use strict";

let passwordsList = false;
let passwordsCurrent = false;


async function loadPasswords() {

	$('#listPasswords').html('');
	passwordsList = await hidGetPasswords(2000);

	if (passwordsList) {

		if ((passwordsList.Command != 'GetPasswords') || !passwordsList.hasOwnProperty('Passwords') || !passwordsList.Passwords.hasOwnProperty('length')) {
			await sleep(200);
			location.reload();
			await sleep(5000);
		}

		for (let i = 0; i < passwordsList.Passwords.length; i++) {
			$('#listPasswords').append(`<li><a href="#" onclick="passwordSelect(${i + 1})">${passwordsList.Passwords[i].Name}</a></li>`);
		}

		if (passwordsList.Passwords.length < passwordsList.Max) {
			$('#listPasswords').append(`<li><a href="#" onclick="passwordAdd()">+ add password</a></li>`);
		}
	}
}

function passwordSelect(index) {
	if (index && passwordsList && (passwordsList.Passwords.length  >= index)) {

		passwordsCurrent = passwordsList.Passwords[index - 1];		

		$('#password_pass').text('**********');
		$('#password_name').text(passwordsCurrent.Name);
		$('#password_2fa').text(passwordsCurrent.TwoFA);
		$('#password_copy').show();

		$('#password_url').hide();
		$('#password_login').hide();
		$('#password_url_text').hide();
		$('#password_url_open').hide();
		$('#password_login_text').hide();

		$('#password_2fa_code1').hide();
		$('#password_2fa_code2').hide();
		$('#password_2fa_counter1').hide();
		$('#password_2fa_counter2').hide();

		$('#password_2fa_pb').hide();
		$('#password_2fa_time').css('width', '0%');

		$('#password_add_2fa_btn').hide();
		$('#password_show_2fa_btn').hide();
		$('#password_delete_2fa_btn').hide();
		$('#password_set_cntr_2fa_btn').hide();

		if (passwordsCurrent.TwoFA === 'NONE') {
			$('#password_add_2fa_btn').show();
		} else {
			$('#password_show_2fa_btn').show();
			$('#password_delete_2fa_btn').show();
		}

		$('#password_qr').attr('d', '');
		uiShowSection('passwords');

	} else {
		generalSelect();
	}
}

async function passwordShowData() {
	if (!hidIsBusy()) {

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidGetPasswordData(passwordsCurrent.Index, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			return;
		}

		if (ret.Command === 'GetPasswordData') {

			let pass = ret.Password;

			if (pass.includes('\f')) {

				$('#password_url').show();
				$('#password_copy').hide();
				$('#password_url_text').show();
				$('#password_url_open').show();

				let login = '';
				let url = pass.split('\f', 1);
				pass = pass.substring(pass.indexOf('\f') + 1);

				if (pass.includes('\t')) {
					login = pass.split('\t', 1);
					pass = pass.substring(pass.indexOf('\t') + 1);

					$('#password_login').show();
					$('#password_login_text').show();
				}

				$('#password_url').text(url);
				$('#password_pass').text(pass);
				$('#password_login').text(login);

			} else {

				let q = qr.svgObject(pass, { type: 'svg' });

				$('#password_pass').text(pass);
				$('#password_qr').attr('d', q.path);
				$('#password_viewbox')
					.width((q.size + 1) * 4)
					.height((q.size + 1) * 4)
					.attr('viewBox', '0 0 ' + ++q.size + ' ' + q.size);
			}
		}
	}
}

async function passwordCopyClpBrd() {
	if (!hidIsBusy()) {

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidGetPasswordData(passwordsCurrent.Index, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			return;
		}

		if (ret.Command === 'GetPasswordData') {
			clipboard.writeText(ret.Password);
			infoShow('', 'Password copied to clipboard', 'success', 5000);
		}
	}
}

async function passwordGetCode2FA() {
	if (!hidIsBusy()) {

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidGet2FA(passwordsCurrent.Index, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			return;
		}

		if (ret.Command === 'Get2FA') {

			if ((passwordsCurrent.TwoFA === 'HOTP') || (passwordsCurrent.TwoFA === 'TOTP')) {
				$('#password_2fa_code1').show();
				$('#password_2fa_code2').show();
				$('#password_2fa_code_val').text(ret.Code);
			}

			if ((passwordsCurrent.TwoFA === 'HOTP') || (passwordsCurrent.TwoFA === 'U2F')) {
				$('#password_2fa_counter1').show();
				$('#password_2fa_counter2').show();
				$('#password_2fa_counter_val').text(ret.Counter);
				$('#password_set_cntr_2fa_btn').show();
			}

			if (passwordsCurrent.TwoFA === 'TOTP') {

				let update = false;
				let i = ret.ValidTime;

				$('#password_2fa_pb').show();
				$('#password_2fa_time').css('width', (ret.ValidTime / 29) * 100 + '%');

				setTimeout(async function update2faBar() {

					if ($('#password_2fa_pb').is(':visible')) {

						i = ++i % 30;
						$('#password_2fa_time').css('width', (i / 29) * 100 + '%');

						if ((i == 0) || update) {

							update = true;
							if (!hidIsBusy()) {

								ret = await hidGet2FA(passwordsCurrent.Index, 40000);
								if (ret.Command === 'Get2FA') {
									update = false;
									i = ret.ValidTime;
									$('#password_2fa_code_val').text(ret.Code);
								}
							}
						}
						setTimeout(update2faBar, 1000);
					}
					
				}, 1000);
			}
		}
	}
}

async function passwordIncCounter2FA() {
	if (!hidIsBusy()) {

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidIncCounter2FA(passwordsCurrent.Index, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			return;
		}

		if (ret.Command === 'IncCntr2FA') {

			if (passwordsCurrent.TwoFA === 'HOTP') {
				$('#password_2fa_code_val').text(ret.Code);
			}

			$('#password_2fa_counter_val').text(ret.Counter);			
			infoShow('Success', '2FA counter incremented', 'success', 5000);
		}
	}
}

async function passwordSetCounter2FA() {
	if (!hidIsBusy()) {

		let ret = await modalEnterNumber('Enter counter value');

		if (ret) {

			infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
			ret = await hidSetCounter2FA(passwordsCurrent.Index, ret.Value, 40000);
			infoHide();

			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
				return;
			}

			if (ret.Command === 'SetCntr2FA') {

				if (passwordsCurrent.TwoFA === 'HOTP') {
					$('#password_2fa_code_val').text(ret.Code);
				}

				$('#password_2fa_counter_val').text(ret.Counter);				
				infoShow('Success', '2FA counter set', 'success', 5000);
			}
		}
	}
}

async function passwordAdd() {
	if (!hidIsBusy()) {

		let ret = await modalAddPassword();

		if (ret) {

			ret.Name = ret.Name.trim();

			if (passwordIsExist(ret.Name)) {
				infoShow('Error', 'Password name ' + ret.Name + ' already exist', 'info', 5000);
				return;
			}

			if (ret.Rnd) {
				await randomInit();
			}

			ret = await hidAddPassword(ret.Name, ret.Password, ret.Rnd, ret.Symbols, 2000);

			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
				return;
			}

			if (ret.Command === 'AddPassword') {

				infoShow('Success', 'Password added', 'success', 2000);

				await loadStatus();
				await loadPasswords();
				generalUpdateInfo();
				passwordSelect(passwordsList.Passwords.length);

				if (await modalYesNo('Cancel', 'Yes', 'Attention!!!', 'New password added. Please press "Yes" to make device backup copy.')) {
					await settingsBackup();
				}
			}
		}
	}
}

async function passwordDelete() {
	if (!hidIsBusy()) {

		let index = passwordsCurrent.Index;

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidDeletePassword(passwordsCurrent.Index, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			return;
		}

		if (ret.Command === 'DelPassword') {

			infoShow('Success', 'Password deleted', 'success', 2000);

			await loadStatus();
			await loadPasswords();
			generalUpdateInfo();

			if (passwordsList.Passwords.length) {
				if (passwordsList.Passwords.length > (index - 1)) {
					passwordSelect(index);
				} else {
					passwordSelect(index - 1);
				}
			} else {
				generalSelect();
			}
		}
	}
}

async function passwordAdd2FA() {
	if (!hidIsBusy()) {

		if (passwordsCurrent.TwoFA === 'NONE') {

			let ret = await modalAdd2FA('Cancel', 'Ok', 'Add 2FA');

			switch (ret.Type) {

				case 'U2F': {

					await randomInit();
					ret = await hidAdd2FA(passwordsCurrent.Index, ret.Type, '', 2000);

					if (ret.Command === 'Add2FA') {

						if (await waitMode(USB_DEV_MODE_U2F, 5000)) {
							while (hidGetMode() === USB_DEV_MODE_U2F) {
								await sleep(200);
							}
						}

						await waitMode(USB_DEV_MODE_HID, 1000);
						await sleep(200);

						if (await modalYesNo('Cancel', 'Yes', 'Attention!!!', 'New 2FA added. Please press "Yes" to make device backup copy.')) {
							await settingsBackup();
						}
					}
				}
				break;

				case 'HOTP':
				case 'TOTP':
					ret = await hidAdd2FA(passwordsCurrent.Index, ret.Type, ret.Key, 2000);

					if (ret.Error) {
						infoShow('Error', ret.Error, 'error', 5000);
						return;
					}

					if (ret.Command === 'Add2FA') {
						infoShow('Success', '2FA added', 'success', 2000);

						if (await modalYesNo('Cancel', 'Yes', 'Attention!!!', 'New 2FA added. Please press "Yes" to make device backup copy.')) {
							await settingsBackup();
						}
					}
				break;
			}

			await loadPasswords();
			passwordSelect(passwordsCurrent.Index);
		}
	}
}

async function passwordDelete2FA() {
	if (!hidIsBusy()) {

		let index = passwordsCurrent.Index;

		if (passwordsCurrent.TwoFA !== 'NONE') {

			infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
			let ret = await hidDel2FA(passwordsCurrent.Index, 40000);
			infoHide();

			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
				return;
			}

			if (ret.Command === 'Del2FA') {
				infoShow('Success', '2FA deleted', 'success', 2000);

				await sleep(200);
				await loadPasswords();
				passwordSelect(index);
			}
		}
	}
}

function passwordOpenURL() {
	openExternalUrl($('#password_url').text());
}

function passwordCopyPass() {
	clipboard.writeText($('#password_pass').text());
	infoShow('', 'Password copied to clipboard', 'success', 5000);
}

function passwordCopyLogin() {
	clipboard.writeText($('#password_login').text());
	infoShow('', 'Login copied to clipboard', 'success', 5000);
}

function passwordCopyUrl() {
	clipboard.writeText($('#password_url').text());
	infoShow('', 'URL copied to clipboard', 'success', 5000);
}

function passwordCopy2FA() {
	clipboard.writeText($('#password_2fa_code2').text());
	infoShow('', '2FA copied to clipboard', 'success', 5000);
}

function passwordIsExist(name) {

	for (let i = 0; i < passwordsList.Passwords.length; i++) {
		if (name.toUpperCase() === passwordsList.Passwords[i].Name.toUpperCase()) {
			return true;
		}
	}

	return false;
}
