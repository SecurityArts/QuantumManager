'use strict';


//-------------------------------------  Helper functions  ----------------------------------------------------------------
function modalValidateName(name) {
	if (name && (typeof name === 'string')) {
		let regex = /^[a-zA-Z0-9\-\_\,\.\]\[\}\{\)\(\#\@ ]+$/g
		return regex.test(name);
	}

	return false;
}
//-------------------------------------  Helper functions  ----------------------------------------------------------------



//-------------------------------------  General modals  ------------------------------------------------------------------
function modalYesNo(textCancel, textYes, textTitle, textBody, retTrue = true, retFalse = false) {
	return new Promise((resolve) => {

		let ret = false;

		if (textCancel == '') {
			$('#modal_yes_no_cancel').hide();
		} else {
			$('#modal_yes_no_cancel').show();
		}

		if (textYes == '') {
			$('#modal_yes_no_ok').hide();
		} else {
			$('#modal_yes_no_ok').show();
		}

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				ret = retTrue;
				$('#modal_dialog_yes_no').modal('hide');
			}
		});

		$('#modal_yes_no_ok').unbind('click').on('click', () => {
			ret = retTrue;
			$('#modal_dialog_yes_no').modal('hide');
		});

		$('#modal_yes_no_cancel').unbind('click').on('click', () => {
			ret = retFalse;
			$('#modal_dialog_yes_no').modal('hide');
		});

		$('#modal_dialog_yes_no').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_yes_no_ok').text(textYes);
		$('#modal_yes_no_text').html(textBody);
		$('#modal_yes_no_title').text(textTitle);
		$('#modal_yes_no_cancel').text(textCancel);		
		$('#modal_dialog_yes_no').modal();
	});
}

function modalEnterString(titleText, maxLen = 1000, placeHolder = 'Enter value') {
	return new Promise((resolve) => {

		let ret = false;

		$('#modal_enter_value_ok').unbind('click').on('click', () => {
			ret = {Value: $('#modal_enter_value_value').val()};

			$('#modal_enter_value').modal('hide');
		});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_enter_value_ok').click()
			}
		});

		$('#modal_enter_value_cancel').unbind('click').on('click', () => {
			$('#modal_enter_value').modal('hide');
		});

		$('#modal_enter_value').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_enter_value_value').focus();
		});

		$('#modal_enter_value').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_enter_value_value').val('');
		$('#modal_enter_value_value').attr('placeholder', placeHolder);
		$('#modal_enter_value_title').text(titleText);
		$('#modal_enter_value').modal();
	});
}

function modalEnterNumber(titleText, placeHolder = 'Enter value') {
	return new Promise((resolve) => {

		let ret = false;

		$('#modal_enter_value_ok').unbind('click').on('click', () => {
			let val = parseInt($('#modal_enter_value_value').val().replace(',', '.').trim());

			if (!isNaN(val)) {
				ret = {Value: val};
			}

			$('#modal_enter_value').modal('hide');
		});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_enter_value_ok').click()
			}
		});

		$('#modal_enter_value_cancel').unbind('click').on('click', () => {
			$('#modal_enter_value').modal('hide');
		});

		$('#modal_enter_value').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_enter_value_value').focus();
		});

		$('#modal_enter_value').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_enter_value_value').val('');
		$('#modal_enter_value_value').attr('placeholder', placeHolder);
		$('#modal_enter_value_title').text(titleText);
		$('#modal_enter_value').modal();
	});
}

function modalAddUser(isAdmin) {
	return new Promise((resolve) => {

		let ret = false;

		$('#modal_user_admin')
			.prop('checked', isAdmin)
			.prop('disabled', !isAdmin);

		$('#modal_user_name').removeClass('input_error');
		$('#modal_user_name').unbind('change').on('change', () => {
			if (!modalValidateName($('#modal_user_name').val())) {
				$('#modal_user_name').addClass('input_error');
			} else {
				$('#modal_user_name').removeClass('input_error');
			}
		});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_user_ok').click()
			}
		});

		$('#modal_user_ok').unbind('click').on('click', () => {
			if (modalValidateName($('#modal_user_name').val())) {
				ret = {
					Name: $('#modal_user_name').val(),
					Admin: $('#modal_user_admin').is(':checked')
				};

				$('#modal_add_user').modal('hide');
			}
		});

		$('#modal_user_cancel').unbind('click').on('click', () => {
			$('#modal_add_user').modal('hide');
		});

		$('#modal_add_user').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_user_name').focus();
		});		

		$('#modal_add_user').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_user_name').val('');
		$('#modal_add_user').modal();
	});
}
//-------------------------------------  General modals  ------------------------------------------------------------------



//-------------------------------------  Passwords modals  ----------------------------------------------------------------
function modalAddPasswordHandleEnter(str, addEnter) {

	if (addEnter) {
		if (str.length < 2 || (str.length >= 2 && (str.lastIndexOf('\\r') !== (str.length - 2)))) {
			str += '\\r';
		}
	} else {
		if (str.length >= 2 && (str.lastIndexOf('\\r') === str.length - 2)) {
			str = str.substring(0, str.length - 2);
		}
	}

	return str;
}

function modalValidatePassword(pass) {

	if (pass && (typeof pass === 'string')) {
		return (!/[^a-zA-Z0-9 ~!@#\$%\^&\*\(\)\[\]\{\}<>\-\|_=\+\?\,\.:\/\\'"]/.test(pass));
	}

	//Valid chars: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ~!@#$%^&*()[]{}<>-_=+?,.:/\'"
	return false;
}

function modalAddPassword() {
	return new Promise((resolve) => {

		let ret = false;
		let addEnter = false;

		$('#modal_pass_url').val('');
		$('#modal_pass_data').val('');
		$('#modal_pass_name').val('');
		$('#modal_pass_data1').val('');
		$('#modal_pass_data2').val('');
		$('#modal_pass_login').val('');
		$('#modal_pass_login2').val('');
		$('#modal_pass_rnd_len').val('');
		$('#modal_pass_card1_num').val('');
		$('#modal_pass_card1_holder').val('');
		$('#modal_pass_card1_date').val('');
		$('#modal_pass_card1_cvv').val('');
		$('#modal_pass_card2_num').val('');
		$('#modal_pass_card2_date').val('');
		$('#modal_pass_card2_cvv').val('');

		$('#modal_pass_url').removeClass('input_error');
		$('#modal_pass_name').removeClass('input_error');
		$('#modal_pass_data').removeClass('input_error');
		$('#modal_pass_login').removeClass('input_error');
		$('#modal_pass_login2').removeClass('input_error');
		$('#modal_pass_data1').removeClass('input_error');
		$('#modal_pass_data2').removeClass('input_error');
		$('#modal_pass_card1_num').removeClass('input_error');
		$('#modal_pass_card1_holder').removeClass('input_error');
		$('#modal_pass_card1_date').removeClass('input_error');
		$('#modal_pass_card1_cvv').removeClass('input_error');
		$('#modal_pass_card2_num').removeClass('input_error');
		$('#modal_pass_card2_date').removeClass('input_error');
		$('#modal_pass_card2_cvv').removeClass('input_error');
		$('#modal_pass_rnd_len').removeClass('input_error');

		$('#modal_pass_opt1').prop('checked', true);
		$('#modal_pass_opt2').prop('checked', true);
		$('#modal_pass_opt3').prop('checked', true);
		$('#modal_pass_opt4').prop('checked', false);
		$('#modal_pass_gen_enter').prop('checked', false);

		$('#modal_pass_name').unbind('change').on('change', () => {
			if (!modalValidateName($('#modal_pass_name').val())) {
				$('#modal_pass_name').addClass('input_error');
			} else {
				$('#modal_pass_name').removeClass('input_error');
			}
		});

		$('#modal_pass_data').unbind('change').on('change', () => {
			if (!modalValidatePassword($('#modal_pass_data').val())) {
				$('#modal_pass_data').addClass('input_error');
			} else {
				$('#modal_pass_data').removeClass('input_error');
			}
		});

		$('#modal_pass_login').unbind('change').on('change', () => {
			const userData = $('#modal_pass_login').val() + '\\t' + $('#modal_pass_data1').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_login').val())) {
				$('#modal_pass_login').addClass('input_error');
			} else {
				$('#modal_pass_login').removeClass('input_error');
			}
		});

		$('#modal_pass_login2').unbind('change').on('change', () => {
			const userData = $('#modal_pass_url').val() + '\\f' + $('#modal_pass_login2').val() + '\\t' + $('#modal_pass_data2').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_login2').val())) {
				$('#modal_pass_login2').addClass('input_error');
			} else {
				$('#modal_pass_login2').removeClass('input_error');
			}
		});

		$('#modal_pass_data1').unbind('change').on('change', () => {
			const userData = $('#modal_pass_login').val() + '\\t' + $('#modal_pass_data1').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_data1').val())) {
				$('#modal_pass_data1').addClass('input_error');
			} else {
				$('#modal_pass_data1').removeClass('input_error');
			}
		});

		$('#modal_pass_data2').unbind('change').on('change', () => {
			const userData = $('#modal_pass_url').val() + '\\f' + $('#modal_pass_login2').val() + '\\t' + $('#modal_pass_data2').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_data2').val())) {
				$('#modal_pass_data2').addClass('input_error');
			} else {
				$('#modal_pass_data2').removeClass('input_error');
			}
		});

		$('#modal_pass_url').unbind('change').on('change', () => {
			const userData = $('#modal_pass_url').val() + '\\f' + $('#modal_pass_login2').val() + '\\t' + $('#modal_pass_data2').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_url').val())) {
				$('#modal_pass_url').addClass('input_error');
			} else {
				$('#modal_pass_url').removeClass('input_error');
			}
		});

		$('#modal_pass_gen_enter').unbind('change').on('change', () => {
			let userData = $('#modal_pass_data').val();
			addEnter = $('#modal_pass_gen_enter').is(':checked');
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
		});

		//---------------  Credit card1  --------------------------
		$('#modal_pass_card1_num').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_card1_num').val())) {
				$('#modal_pass_card1_num').addClass('input_error');
			} else {
				$('#modal_pass_card1_num').removeClass('input_error');
			}
		});

		$('#modal_pass_card1_holder').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_card1_holder').val())) {
				$('#modal_pass_card1_holder').addClass('input_error');
			} else {
				$('#modal_pass_card1_holder').removeClass('input_error');
			}
		});

		$('#modal_pass_card1_date').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_card1_date').val())) {
				$('#modal_pass_card1_date').addClass('input_error');
			} else {
				$('#modal_pass_card1_date').removeClass('input_error');
			}
		});

		$('#modal_pass_card1_cvv').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_card1_cvv').val())) {
				$('#modal_pass_card1_cvv').addClass('input_error');
			} else {
				$('#modal_pass_card1_cvv').removeClass('input_error');
			}
		});
		//---------------  Credit card1  --------------------------


		//---------------  Credit card2  --------------------------
		$('#modal_pass_card2_num').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_card2_num').val())) {
				$('#modal_pass_card2_num').addClass('input_error');
			} else {
				$('#modal_pass_card2_num').removeClass('input_error');
			}
		});

		$('#modal_pass_card2_date').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_card2_date').val())) {
				$('#modal_pass_card2_date').addClass('input_error');
			} else {
				$('#modal_pass_card2_date').removeClass('input_error');
			}
		});

		$('#modal_pass_card2_cvv').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();
			const passData = modalAddPasswordHandleEnter(userData, addEnter);

			$('#modal_pass_data').val(passData);
			if (!modalValidatePassword($('#modal_pass_card2_cvv').val())) {
				$('#modal_pass_card2_cvv').addClass('input_error');
			} else {
				$('#modal_pass_card2_cvv').removeClass('input_error');
			}
		});
		//---------------  Credit card2  --------------------------



		$('#modal_pass_type').unbind('change').on('change', () => {

			switch ($('#modal_pass_type').val()) {
				case 'Password':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_log_pass_url').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_pass').show();
					break;

				case 'Random password':
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_gen_enter').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_log_pass_url').hide();
					$('#modal_pass_type_rdn').show();
					break;

				case 'Login and Password':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_log_pass_url').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_log_pass').show();
					break;

				case 'Login and Password + URL':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_log_pass_url').show();
					$('#modal_pass_type_gen_enter').show();
					break;

				case 'Credit Card 1':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_log_pass_url').hide();
					$('#modal_pass_type_credit_card1').show();
					break;

				case 'Credit Card 2':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_log_pass_url').hide();
					$('#modal_pass_type_credit_card2').show();
					break;
			}
		}).val('Password').change();

		$('#modal_pass_ok')
			.unbind('click')
			.on('click', () => {

				let pass = $('#modal_pass_data').val();
				let name = $('#modal_pass_name').val();
				let len = $('#modal_pass_rnd_len').val();

				if (modalValidateName(name)) {

					if (($('#modal_pass_type').val() === 'Random password')) {

						if (!len || isNaN(len)) {
							$('#modal_pass_rnd_len').addClass('input_error');
						} else {
							let options = 0;

							if ($('#modal_pass_opt1').is(':checked')) options |= (1 << 0);
							if ($('#modal_pass_opt2').is(':checked')) options |= (1 << 1);
							if ($('#modal_pass_opt3').is(':checked')) options |= (1 << 2);
							if ($('#modal_pass_opt4').is(':checked')) options |= (1 << 3);

							ret = {Rnd: len, Name: name, Symbols: options};
						}
					} else {

						if (!modalValidatePassword(pass)) {
							$('#modal_pass_data').addClass('input_error');
						} else {
							ret = {Name: name, Password: pass};
						}
					}

					if (ret) {
						$('#modal_pass_data').val('');
						$('#modal_pass_name').val('');
						$('#modal_add_pass').modal('hide');
					}
				} else {
					$('#modal_pass_name').addClass('input_error');
				}
			});


		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_pass_ok').click()
			}
		});

		$('#modal_pass_cancel').unbind('click').on('click', () => {
			$('#modal_add_pass').modal('hide');
		});

		$('#modal_add_pass').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_pass_name').focus();
		});

		$('#modal_add_pass').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_add_pass').modal();
	});
}

function modalAdd2FA(textCancel, textYes, textTitle) {
	return new Promise((resolve) => {

		let ret = false;

		$('#modal_add_2fa_type').val('U2F');
		$('#modal_add_2fa_key').val('').prop('disabled', true);

		$('#modal_add_2fa_type')
			.unbind('click')
			.on('click', () => {
				$('#modal_add_2fa_key').prop('disabled', ($('#modal_add_2fa_type').val() == 'U2F'));
			});

		$('#modal_add_2fa_ok')
			.unbind('click')
			.on('click', () => {

				if (($('#modal_add_2fa_type').val() == 'U2F') || $('#modal_add_2fa_key').val()) {
					ret = {
						Type: $('#modal_add_2fa_type').val(),
						Key: $('#modal_add_2fa_key').val()
					};

					$('#modal_add_2fa_key').val('');
					$('#modal_add_2fa').modal('hide');
				}
			});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_add_2da_ok').click()
			}
		});

		$('#modal_add_2fa_cancel').unbind('click').on('click', () => {
			$('#modal_add_2fa').modal('hide');
		});

		$('#modal_add_2fa').unbind('hidden.bs.modal').on('hidden.bs.modal', (e) => {
			resolve(ret);
		});

		$('#modal_add_2da_ok').text(textYes);
		$('#modal_add_2fa_title').text(textTitle);
		$('#modal_add_2fa_cancel').text(textCancel);
		$('#modal_add_2fa').modal();
	});
}
//-------------------------------------  Passwords modals  ----------------------------------------------------------------



//-------------------------------------  Wallet modals  -------------------------------------------------------------------
function modalAddWallet() {
	return new Promise((resolve) => {

		let ret = false;
		let segwit = ['BTC'];
		let testnet = ['BTC', 'LTC', 'DOGE', 'DASH', 'BCH', 'BSV', 'XRP', 'ETH', 'EOS'];

		$('#modal_wallet_key')
			.val('')
			.prop('disabled', false);

		$('#modal_wallet_name').val('');
		$('#modal_wallet_segwit').prop('checked', false);
		$('#modal_wallet_testnet')
			.prop('checked', false)
			.prop('disabled', false);

		$('#modal_wallet_name').removeClass('input_error');
		$('#modal_wallet_name').unbind('change').on('change', () => {
			if (!modalValidateName($('#modal_wallet_name').val())) {
				$('#modal_wallet_name').addClass('input_error');
			} else {
				$('#modal_wallet_name').removeClass('input_error');
			}
		});

		$('#modal_wallet_type')
			.val('NONE')
			.removeClass('input_error')
			.unbind('change').on('change', () => {

				if ($('#modal_wallet_type').val() === 'NONE') {
						$('#modal_wallet_type').addClass('input_error');
				} else {

					let val = $('#modal_wallet_type').val().split('(')[1].split(')')[0];
					let isSegWit = (segwit.indexOf(val) >= 0);
					let isTestNet = (testnet.indexOf(val) >= 0);

					$('#modal_wallet_segwit')
						.prop('checked', false)
						.prop('disabled', !isSegWit);

					$('#modal_wallet_testnet')
						.prop('checked', false)
						.prop('disabled', !isTestNet);

					$('#modal_wallet_type').removeClass('input_error');
				}
			});

		$('#modal_wallet_rnd')
			.prop('checked', false)
			.unbind('click').on('click', () => {
				$('#modal_wallet_key').prop('disabled', $('#modal_wallet_rnd').is(':checked'));
			});

		$('#modal_wallet_ok' )
			.unbind('click')
			.on('click', () => {

				if (modalValidateName($('#modal_wallet_name').val())) {

					if ($('#modal_wallet_type').val() === 'NONE') {
						$('#modal_wallet_type').addClass('input_error');
					} else {
						let options = {};
						let coin = $('#modal_wallet_type').val().split('(')[1].split(')')[0];

						if ($('#modal_wallet_rnd').is(':checked')) options = Object.assign(options, {Rnd: true});
						if ($('#modal_wallet_segwit').is(':checked')) options = Object.assign(options, {SegWit: true});
						if ($('#modal_wallet_testnet').is(':checked')) options = Object.assign(options, {TestNet: true});

						ret = {
							Type: coin,
							Options: options,
							Key: $('#modal_wallet_key').val(),
							Name: $('#modal_wallet_name').val(),
						};

						$('#modal_wallet_key').val('');
						$('#modal_wallet_name').val('');
						$('#modal_add_wallet').modal('hide');
					}
				}
			});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_wallet_ok').click()
			}
		});

		$('#modal_wallet_cancel').unbind('click').on('click', () => {
			$('#modal_add_wallet').modal('hide');
		});

		$('#modal_add_wallet').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_add_wallet').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_wallet_type').focus();
		});

		$('#modal_add_wallet').modal();
	});
}

function modalEosBuyRam(receiver = '') {
	return new Promise((resolve) => {

		let ret = false;

		$('#modal_eos_buy_ram_amount').val('');
		$('#modal_eos_buy_ram_receiver').val(receiver);
		$('#modal_eos_buy_ram_amount_type').text('RAM amount to buy in EOS');

		$('#modal_eos_buy_ram_type')
			.val('EOS')
			.unbind('change').on('change', () => {

				if ($('#modal_eos_buy_ram_type').val() === 'EOS') {
					$('#modal_eos_buy_ram_amount_type').text('RAM amount to buy in EOS');
				} else {
					$('#modal_eos_buy_ram_amount_type').text('RAM amount to buy in Bytes');
				}
			});

		$('#modal_eos_buy_ram_ok' )
			.unbind('click')
			.on('click', () => {

				let type = $('#modal_eos_buy_ram_type').val();
				let receiver = $('#modal_eos_buy_ram_receiver').val();
				let amount = bigNum($('#modal_eos_buy_ram_amount').val().replace(',', '.').trim());

				if (amount && receiver) {
					ret = {
						type: type,
						amount: amount,
						receiver: receiver
					};

					$('#modal_eos_buy_ram').modal('hide');
				}
			});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_eos_buy_ram_ok').click()
			}
		});

		$('#modal_eos_buy_ram_cancel').unbind('click').on('click', () => {
			$('#modal_eos_buy_ram').modal('hide');
		});

		$('#modal_eos_buy_ram').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_eos_buy_ram').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_eos_buy_ram_amount').focus();
		});

		$('#modal_eos_buy_ram').modal();
	});
}


function modalEosStake(receiver = '', stake = false) {
	return new Promise((resolve) => {

		let ret = false;

		$('#modal_eos_stake_cpu_amount').val('');
		$('#modal_eos_stake_net_amount').val('');
		$('#modal_eos_stake_receiver').val(receiver);
		$('#modal_eos_stake_transfer').prop('checked', false);

		if (stake) {
			$('#modal_eos_stake_title').text('EOS Stake');
			$('#modal_eos_stake_receiver_text').text('Stake receiver');
			$('#modal_eos_stake_cpu_amount_text').text('CPU stake amount');
			$('#modal_eos_stake_net_amount_text').text('NET stake amount');
			$('#modal_eos_stake_cpu_amount').attr('placeholder', 'Enter EOS amount to stake');
			$('#modal_eos_stake_net_amount').attr('placeholder', 'Enter EOS amount to stake');
			$('#modal_eos_stake_transfer_section').show();
		} else {
			$('#modal_eos_stake_title').text('EOS Unstake');
			$('#modal_eos_stake_receiver_text').text('Stake holder');
			$('#modal_eos_stake_cpu_amount_text').text('CPU unstake amount');
			$('#modal_eos_stake_net_amount_text').text('NET unstake amount');
			$('#modal_eos_stake_cpu_amount').attr('placeholder', 'Enter EOS amount to unstake');
			$('#modal_eos_stake_net_amount').attr('placeholder', 'Enter EOS amount to unstake');
			$('#modal_eos_stake_transfer_section').hide();
		}

		$('#modal_eos_stake_ok' )
			.unbind('click')
			.on('click', () => {

				let addr = $('#modal_eos_stake_receiver').val();
				let valCpu = bigNum($('#modal_eos_stake_cpu_amount').val().replace(',', '.').trim());
				let valNet = bigNum($('#modal_eos_stake_net_amount').val().replace(',', '.').trim());
				let transfer = $('#modal_eos_stake_transfer').is(':checked');

				if (valCpu && valNet && addr) {
					ret = {
						receiver: addr,
						amountCPU: valCpu,
						amountNET: valNet,
						transfer: transfer
					};

					$('#modal_eos_stake').modal('hide');
				}
			});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_eos_stake_ok').click()
			}
		});

		$('#modal_eos_stake_cancel').unbind('click').on('click', () => {
			$('#modal_eos_stake').modal('hide');
		});

		$('#modal_eos_stake').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_eos_stake').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_eos_stake_cpu_amount').focus();
		});

		$('#modal_eos_stake').modal();
	});
}

function modalEosNewAccount() {
	return new Promise((resolve) => {

		let ret = false;

		$('#modal_eos_new_acc_name').val('');
		$('#modal_eos_new_acc_owner_key').val('');
		$('#modal_eos_new_acc_active_key').val('');
		$('#modal_eos_new_acc_cpu_amount').val('');
		$('#modal_eos_new_acc_net_amount').val('');
		$('#modal_eos_new_acc_ram_amount').val('4096');

		$('#modal_eos_new_acc_ok' )
			.unbind('click')
			.on('click', () => {

				let name = $('#modal_eos_new_acc_name').val().trim();
				let ownerKey = $('#modal_eos_new_acc_owner_key').val().trim();
				let activeKey = $('#modal_eos_new_acc_active_key').val().trim();
				let ram = parseInt($('#modal_eos_new_acc_ram_amount').val().trim());
				let net = bigNum($('#modal_eos_new_acc_net_amount').val().replace(',', '.').trim());
				let cpu = bigNum($('#modal_eos_new_acc_cpu_amount').val().replace(',', '.').trim());

				if (name && ownerKey && activeKey && net && cpu && !isNaN(ram)) {
					ret = {
						amountRAM: ram,
						amountNET: net,
						amountCPU: cpu,
						accountName: name,
						ownerKey: ownerKey,
						activeKey: activeKey
					};

					$('#modal_eos_new_acc').modal('hide');
				}
			});

		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_eos_new_acc_ok').click()
			}
		});

		$('#modal_eos_new_acc_cancel').unbind('click').on('click', () => {
			$('#modal_eos_new_acc').modal('hide');
		});

		$('#modal_eos_new_acc').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});

		$('#modal_eos_new_acc').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_eos_new_acc_name').focus();
		});

		$('#modal_eos_new_acc').modal();
	});
}
//-------------------------------------  Wallet modals  -------------------------------------------------------------------



//-------------------------------------  Transaction modal  ---------------------------------------------------------------
function modalTransactionSetStatus(stat, tx, enableCancel, enableBroadcast) {
	$('#modal_tarnsaction_status').text(stat);
	$('#modal_tarnsaction_transaction').text(tx);
	$('#modal_transaction_btn_cancel').prop('disabled', !enableCancel);
	$('#modal_transaction_btn_broadcast').prop('disabled', !enableBroadcast);
}

function modalTransactionEnableCancel() {
	$('#modal_transaction_btn_cancel').prop('disabled', false);
	$('#modal_transaction_btn_broadcast').prop('disabled', true);
}

function modalTransactionHide() {
	$('#modal_transaction').modal('hide');
}

function modalTransactionShow(from, to, amount, fee, remainder, ticker, stat) {
	return new Promise((resolve) => {

		$('#modal_tarnsaction_to').text(to);
		$('#modal_tarnsaction_from').text(from);
		$('#modal_tarnsaction_status').text(stat);
		$('#modal_tarnsaction_fee').text(fee + ticker);
		$('#modal_tarnsaction_amount').text(amount + ticker);
		$('#modal_tarnsaction_balance').text(remainder + ticker);
		$('#modal_tarnsaction_transaction').text('');

		$('#modal_transaction_btn_cancel').prop('disabled', true);
		$('#modal_transaction_btn_broadcast').prop('disabled', true);
		$('#modal_tarnsaction_collapse_btn').html('<span class="icon icon-down-open-big"></span>');

		$('#modal_transaction_collapse')
			.collapse('hide')
			.unbind('hidden.bs.collapse').on('hidden.bs.collapse', () => {
				$('#modal_tarnsaction_collapse_btn').html('<span class="icon icon-down-open-big"></span>');
			})
			.unbind('shown.bs.collapse').on('shown.bs.collapse', () => {
				$('#modal_tarnsaction_collapse_btn').html('<span class="icon icon-up-open-big"></span>');
			});

		$('#modal_tarnsaction_copy_tx').unbind('click').on('click', () => {
			clipboard.writeText($('#modal_tarnsaction_transaction').text());
		});

		$('#modal_transaction')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});
	});
}

function modalTransactionWaitConfirm() {
	return new Promise((resolve) => {

		$('#modal_transaction_btn_broadcast')
			.unbind('click')
			.on('click', () => {
				modalTransactionHide();
				resolve(true);
			});

		$('#modal_transaction_btn_cancel')
			.unbind('click')
			.on('click', () => {
				modalTransactionHide();
				resolve(false);
			});

		$(document)
			.unbind('keyup')
			.keyup((e) => {
				if (e.which === 13) {
					modalTransactionHide();
					resolve(true);
				}
			});
	});
}
//-------------------------------------  Transaction modal  ---------------------------------------------------------------



//-------------------------------------  UI helpers modals  ---------------------------------------------------------------
function modalWaitPinShow() {
	return new Promise((resolve) => {
		$('#modal_wait_pin')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});
	});
}

function modalWaitPinHide() {
	return new Promise((resolve) => {
		$('#modal_wait_pin')
			.unbind('hidden.bs.modal')
			.on('hidden.bs.modal', () => resolve())
			.modal('hide');
	});
}


function modalKbdShow() {
	return new Promise((resolve) => {
		$('#modal_kbd')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});
	});
}

function modalKbdHide() {
	return new Promise((resolve) => {
		$('#modal_kbd')
			.unbind('hidden.bs.modal')
			.on('hidden.bs.modal', () => resolve())
			.modal('hide');
	});
}


function modalU2fShow(u2f) {
	return new Promise((resolve) => {
		$('#modal_u2f')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});
	})
}

function modalU2fHide() {
	return new Promise((resolve) => {
		$('#modal_u2f')
			.unbind('hidden.bs.modal')
			.on('hidden.bs.modal', () => resolve())
			.modal('hide');
	});
}


function modalWaitDevShow() {
	return new Promise((resolve) => {
		$('#modal_wait_dev')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});
	});
}

function modalWaitDevHide() {
	return new Promise((resolve) => {
		$('#modal_wait_dev')
			.unbind('hidden.bs.modal')
			.on('hidden.bs.modal', () => resolve())
			.modal('hide');
	});
}

function modalAboutShow(serial) {
	return new Promise((resolve) => {
		$('#modal_about')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: true});

		$('#about_serial')
			.text(serial)
			.unbind('click')
			.on('click', () => {
				clipboard.writeText(serial);
				infoShow('', 'Serial copied to clipboard', 'success', 5000);
			})
	});
}
//-------------------------------------  UI helpers modals  ---------------------------------------------------------------



//-------------------------------------  Update Quantum Manager modals  ---------------------------------------------------
function modalManagerUpdateDownloadShow() {
	$('#modal_update_manager').modal({keyboard: false});
}

function modalManagerUpdateDownloadHide() {
	$('#modal_update_manager').hide();
}

async function modalManagerUpdateDownloadProgress(received, total) {
	let p = (received * 100) / total;
	$('#modal_update_manager_progress').css('width', p + '%').attr('aria-valuenow', p);
}
//-------------------------------------  Update Quantum Manager modals  ---------------------------------------------------



//-------------------------------------  Update firmware modals  ----------------------------------------------------------
function modalFwUpdateProgressHide() {
	$('#modal_update_fw_progress_bar').hide();
}

function modalFwUpdateOkBtnShow(show) {
	if (show) {
		$('#modal_update_fw_ok').show();
	} else {
		$('#modal_update_fw_ok').hide();
	}
}

function modalFwUpdateStartBtnShow(show) {
	if (show) {
		$('#modal_update_fw_start').show();
	} else {
		$('#modal_update_fw_start').hide();
	}
}

function modalFwUpdateCancelBtnShow(show) {
	if (show) {
		$('#modal_update_fw_cancel').show();
	} else {
		$('#modal_update_fw_cancel').hide();
	}
}

function modalFwUpdateStartBtnEnable(en) {
	$('#modal_update_fw_start').prop('disabled', !en);
}

function modalFwUpdateCancelBtnEnable(en) {
	$('#modal_update_fw_cancel').prop('disabled', !en);
}

async function modalFwUpdateProgress(p)
{
	$('#modal_update_fw_progress').css('width', p + '%').attr('aria-valuenow', p);
}

function modalFwUpdateStartBtnSetHandler(handler, prm1, prm2) {
	$('#modal_update_fw_start')
		.show()
		.prop('disabled', false)
		.unbind('click')
		.on('click', async () => {
			await handler(prm1, prm2);
		});
}

function modalFwUpdateText(t, versionServer = '', versionFirmware = '') {
	$('#modal_update_fw_text').html(t);

	if (versionServer !== '') {
		$('#modal_update_fw_text').append('<br>Server firmware version: ' + versionServer.toFixed(2));
	}

	if (versionFirmware !== '') {
		$('#modal_update_fw_text').append('<br>Device firmware version: ' + versionFirmware.toFixed(2));
	}
}

function modalFwUpdateShow(versionFirmware)
{
	return new Promise((resolve) => {

		$('#modal_update_fw_progress_bar').show();
		$('#modal_update_fw_progress').css('width', 0 + '%').attr('aria-valuenow', 0);

		$('#modal_update_fw_text')
			.text('Downloading firmware...')
			.append('<br>Server firmware version: ...')
			.append('<br>Device firmware version: ' + versionFirmware.toFixed(2));

		$('#modal_update_fw_ok')
			.hide()
			.unbind('click')
			.on('click', () => {$('#modal_update_fw').modal('hide')});

		$('#modal_update_fw_cancel')
			.show()
			.prop('disabled', false)
			.unbind('click')
			.on('click', () => {$('#modal_update_fw').modal('hide')});

		$('#modal_update_fw_start')
			.show()
			.prop('disabled', true);

		$(document)
			.unbind('keyup')
			.keyup((e) => {
				if (e.which === 13) {
					if (!$('#modal_update_fw_start').is(':disabled'))
					{
						$('#modal_update_fw_start').click();
					}
				}
			});			

		$('#modal_update_fw')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});

	});
}

function modalFwUpdateWait() {
	return new Promise((resolve) => {
		$('#modal_update_fw')
			.unbind('hidden.bs.modal')
			.on('hidden.bs.modal', () => resolve());
	});
}
//-------------------------------------  Update firmware modals  ----------------------------------------------------------




//-------------------------------------  Backup/restore modals  -----------------------------------------------------------
function modalBackupRestoreShow(title) {
	return new Promise((resolve) => {

		$('#modal_backup_title').text(title);
		$('#modal_backup_progress').css('width', 0 + '%').attr('aria-valuenow', 0); 

		$('#modal_backup')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});
	});
}

function modalBackupRestoreHide() {
	return new Promise((resolve) => {
		$('#modal_backup')
			.unbind('hidden.bs.modal')
			.on('hidden.bs.modal', () => resolve())
			.modal('hide');
	});
}


async function modalBackupRestoreProgress(p)
{
	$('#modal_backup_progress').css('width', p + '%').attr('aria-valuenow', p);
}
//-------------------------------------  Backup/restore modals  -----------------------------------------------------------




//-------------------------------------  Device activation  ---------------------------------------------------------------
function modalWaitActivationShow(serial) {
	return new Promise((resolve) => {

		$.get('https://wallet.security-arts.com/api/activate/', {serial: serial, rnd: rnd()}).then((ret) =>	{
			if (ret.code === 0) {
				ret = ret.data.split(',');
				$('#modal_wait_activation_code').text(ret[0]);
				$('#modal_wait_activation_warranty').text('Warranty period ' + ret[2] + ' month starting from ' + ret[1]);
			}
		});

		$('#modal_wait_activation')
			.unbind('shown.bs.modal')
			.on('shown.bs.modal', () => resolve())
			.modal({keyboard: false});
	});
}

function modalWaitActivationHide() {
	return new Promise((resolve) => {
		$('#modal_wait_activation')
			.unbind('hidden.bs.modal')
			.on('hidden.bs.modal', () => resolve())
			.modal('hide');
	});
}
//-------------------------------------  Device activation  ---------------------------------------------------------------
