'use strict';

//-------------------------------------  Helper functions  ----------------------------------------------------------------
function modalValidateName(name) {
	if (name) {
		let regex = /^[a-zA-Z0-9\-\_\,\.\]\[\}\{\)\(\#\@ ]+$/g
		return regex.test(name);
	}
	
	return false;
}
//-------------------------------------  Helper functions  ----------------------------------------------------------------



//-------------------------------------  General modals  ------------------------------------------------------------------
function modalYesNo(textCancel, textYes, textTitle, textBody) {
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
				ret = true;
				$('#modal_dialog_yes_no').modal('hide');
			}
		});
		
		$('#modal_yes_no_ok').unbind('click').on('click', () => {
			ret = true;
			$('#modal_dialog_yes_no').modal('hide');
		});
	  
		$('#modal_yes_no_cancel').unbind('click').on('click', () => {
			ret = false;
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

function modalEnterNumber(titleText) {
	return new Promise((resolve) => {
		
		let ret = false;
		
		$('#modal_enter_number_ok').unbind('click').on('click', () => {
			let val = parseInt($('#modal_enter_number_value').val());
			
			if (!isNaN(val)) {
				ret = {Value: val};
			}
			
			$('#modal_enter_number').modal('hide');
		});
		
		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_enter_number_ok').click()
			}
		});
	  
		$('#modal_enter_number_cancel').unbind('click').on('click', () => {
			$('#modal_enter_number').modal('hide');
		});
										
		$('#modal_enter_number').unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_enter_number_value').focus();
		});
		
		$('#modal_enter_number').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		});
										
		$('#modal_enter_number_value').val('');
		$('#modal_enter_number_title').text(titleText);
		$('#modal_enter_number').modal();
	});
}

function modalAddUser(isAdmin) {
	return new Promise((resolve) => {
		
		let ret = false;
		
		if (isAdmin) {
			$('#modal_user_admin')
				.prop('checked', true)
				.prop('disabled', false);
		} else {
			$('#modal_user_admin')
				.prop('checked', false)
				.prop('disabled', true);
		}
		
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
		
		$('#modal_pass_opt1').prop('checked', true);
		$('#modal_pass_opt2').prop('checked', true);
		$('#modal_pass_opt3').prop('checked', true);
		$('#modal_pass_opt4').prop('checked', false);
		$('#modal_pass_gen_enter').prop('checked', false);
		$('#modal_pass_name').removeClass('input_error');
		
		
		$('#modal_pass_name').unbind('change').on('change', () => {
			if (!modalValidateName($('#modal_pass_name').val())) {
				$('#modal_pass_name').addClass('input_error');
			} else {
				$('#modal_pass_name').removeClass('input_error');
			}
		});
		

		$('#modal_pass_login').unbind('change').on('change', () => {
			const userData = $('#modal_pass_login').val() + '\\t' + $('#modal_pass_data1').val();
			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_login2').unbind('change').on('change', () => {
			const userData = $('#modal_pass_url').val() + '\\f' + $('#modal_pass_login2').val() + '\\t' + $('#modal_pass_data2').val();
			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			
			$('#modal_pass_data').val(handler);
		});

		$('#modal_pass_data1').unbind('change').on('change', () => {
			const userData = $('#modal_pass_login').val() + '\\t' + $('#modal_pass_data1').val();
			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_data2').unbind('change').on('change', () => {
			const userData = $('#modal_pass_url').val() + '\\f' + $('#modal_pass_login2').val() + '\\t' + $('#modal_pass_data2').val();
			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_url').unbind('change').on('change', () => {
			const userData = $('#modal_pass_url').val() + '\\f' + $('#modal_pass_login2').val() + '\\t' + $('#modal_pass_data2').val();
			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			
			$('#modal_pass_data').val(handler);
		});

		$('#modal_pass_gen_enter').unbind('change').on('change', () => {
			let userData = $('#modal_pass_data').val();
			addEnter = $('#modal_pass_gen_enter').is(':checked');
			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			
			$('#modal_pass_data').val(handler);
		});
		
		//---------------  Credit card1  --------------------------
		$('#modal_pass_card1_num').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card1_holder').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card1_date').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card1_cvv').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		//---------------  Credit card1  --------------------------
		
		
		//---------------  Credit card2  --------------------------
		$('#modal_pass_card2_num').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card2_date').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card2_cvv').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
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
				
				if (modalValidateName($('#modal_pass_name').val())) {
					ret = false;

					if ($('#modal_pass_type').val() === 'Random password' && $('#modal_pass_rnd_len').val()) {
						
						let options = 0;
						
						if ($('#modal_pass_opt1').is(':checked')) {
							options |= (1 << 0);
						}
						
						if ($('#modal_pass_opt2').is(':checked')) {
							options |= (1 << 1);
						}
						
						if ($('#modal_pass_opt3').is(':checked')) {
							options |= (1 << 2);
						}
						
						if ($('#modal_pass_opt4').is(':checked')) {
							options |= (1 << 3);
						}
						
						ret = {
							Symbols: options,
							Name: $('#modal_pass_name').val(),
							Rnd: $('#modal_pass_rnd_len').val()
						};
					} else {
						if ($('#modal_pass_data').val()){
							ret = {
								Name: $('#modal_pass_name').val(),
								Password: $('#modal_pass_data').val()
							};
						}
					}
					
					$('#modal_pass_data').val('');
					$('#modal_pass_name').val('');
					$('#modal_add_pass').modal('hide');
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
		let testnet = ['BTC', 'LTC', 'DOGE', 'DASH', 'XRP', 'ZEC', 'ETH'];
										
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
			.val('BTC')
			.unbind('change').on('change', () => {
				
				let val = $('#modal_wallet_type').val();
												
				if (segwit.indexOf(val) >= 0) {
					$('#modal_wallet_segwit')
						.prop('checked', false)
						.prop('disabled', false);
				} else {
					$('#modal_wallet_segwit')
						.prop('checked', false)
						.prop('disabled', true);
				}
												
				if (testnet.indexOf(val) >= 0) {
					$('#modal_wallet_testnet').prop('disabled', false);
				} else {
					$('#modal_wallet_testnet')
						.prop('checked', false)
						.prop('disabled', true);
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
					let options = {};
					
					if ($('#modal_wallet_rnd').is(':checked')) options = Object.assign(options, {Rnd: true});
					if ($('#modal_wallet_segwit').is(':checked')) options = Object.assign(options, {SegWit: true});
					if ($('#modal_wallet_testnet').is(':checked')) options = Object.assign(options, {TestNet: true});
					
					ret = {
						Options: options,
						Name: $('#modal_wallet_name').val(),
						Key: $('#modal_wallet_key').val(),
						Type: $('#modal_wallet_type').val()
					};
					
					$('#modal_wallet_key').val('');
					$('#modal_wallet_name').val('');
					$('#modal_add_wallet').modal('hide');
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
			$('#modal_wallet_name').focus();
		});
										
		$('#modal_add_wallet').modal();
	});
}
//-------------------------------------  Wallet modals  -------------------------------------------------------------------



//-------------------------------------  Transaction modal  ---------------------------------------------------------------
function modalTransactionSetTx(tx) {
	$('#modal_tarnsaction_transaction').text(tx);
}

function modalTransactionSetStatus(stat) {
	$('#modal_tarnsaction_status').text(stat);
}

function modalTransactionEnable() {
	$('#modal_transaction_btn_cancel').prop('disabled', false);
	$('#modal_transaction_btn_broadcast').prop('disabled', false);
}

function modalTransactionHide() {
	$('#modal_transaction').modal('hide');
}

function modalTransactionShow(from, to, amount, fee, remainder, ticker, stat) {
	return new Promise((resolve) => {
		
		$('#modal_tarnsaction_to').text(to);
		$('#modal_tarnsaction_from').text(from);
		$('#modal_tarnsaction_fee').text(fee + ticker);
		$('#modal_tarnsaction_status').text(stat);
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
			.on('click', () => {$("#modal_update_fw").modal('hide')});
			
		$('#modal_update_fw_cancel')
			.show()
			.prop('disabled', false)
			.unbind('click')
			.on('click', () => {$("#modal_update_fw").modal('hide')});
			
		$('#modal_update_fw_start')
			.show()
			.prop('disabled', true);
			
		$(document)
			.unbind('keyup')
			.keyup((e) => {
				if (e.which === 13) {
					if (!$('#modal_update_fw_start').is(':disabled'))
					{
						$("#modal_update_fw_start").click();
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
		$("#modal_update_fw")
			.unbind("hidden.bs.modal")
			.on("hidden.bs.modal", () => resolve());
	});
}
//-------------------------------------  Update firmware modals  ----------------------------------------------------------




//-------------------------------------  Backup/restore modals  -----------------------------------------------------------
function modalBackupRestoreShow(title) {
	return new Promise((resolve) => {
		
		$('#modal_backup_title').text(title);
		$('#modal_backup_progress').css('width', 0 + '%').attr('aria-valuenow', 0); 
		
		$("#modal_backup")
			.unbind("shown.bs.modal")
			.on("shown.bs.modal", () => resolve())
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
