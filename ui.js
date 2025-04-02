/**
 * 機材貸出管理システム
 * UI操作、モーダル、フォーム処理
 */

/**
 * UI要素の初期化
 */
function initializeUI() {
  logDebug('UI初期化を開始');
  
  // モバイル端末の検出
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobileDevice) {
    document.querySelector('html').classList.add('mobile-device');
    
    // モバイル向け操作ヒントを表示
    const hintBox = document.querySelector('.touch-hint');
    if (hintBox) {
      hintBox.style.display = 'block';
    }
    
    logDebug('モバイル端末を検出しました');
  }
  
  // 現在の日付範囲を表示
  updateDateRangeDisplay();
  
  logDebug('UI初期化完了');
}

/**
 * 日付範囲表示の更新
 */
function updateDateRangeDisplay() {
  const dateRangeElement = document.getElementById('currentDateRange');
  if (dateRangeElement && currentStartDate && currentEndDate) {
    const startDateStr = formatDisplayDate(currentStartDate);
    const endDateStr = formatDisplayDate(currentEndDate);
    dateRangeElement.textContent = `表示期間: ${startDateStr} 〜 ${endDateStr}`;
  }
}

/**
 * 表示用の日付フォーマット (M/D)
 */
function formatDisplayDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}

/**
 * フォームバリデーション - 必須入力チェック
 */
function validateRequiredField(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  if (!field) return true; // フィールドが存在しない場合は検証をスキップ
  
  const value = field.value.trim();
  if (!value) {
    showFieldError(field, errorMessage || '入力必須です');
    return false;
  }
  
  clearFieldError(field);
  return true;
}

/**
 * フィールドエラー表示
 */
function showFieldError(field, message) {
  // 既存のエラーメッセージがあれば削除
  clearFieldError(field);
  
  // エラーメッセージのHTML要素を作成
  const errorElement = document.createElement('div');
  errorElement.className = 'field-error';
  errorElement.textContent = message;
  
  // フィールドの親要素（input-field）の後に追加
  const parentElement = field.closest('.input-field');
  if (parentElement) {
    parentElement.appendChild(errorElement);
    parentElement.classList.add('has-error');
  } else {
    // 親要素が見つからない場合はフィールドの後に直接追加
    const nextElement = field.nextElementSibling;
    if (nextElement) {
      field.parentNode.insertBefore(errorElement, nextElement);
    } else {
      field.parentNode.appendChild(errorElement);
    }
  }
  
  // フィールドにフォーカス
  field.focus();
}

/**
 * フィールドエラーをクリア
 */
function clearFieldError(field) {
  const parentElement = field.closest('.input-field');
  if (parentElement) {
    const errorElement = parentElement.querySelector('.field-error');
    if (errorElement) {
      parentElement.removeChild(errorElement);
    }
    parentElement.classList.remove('has-error');
  }
}

/**
 * 全フィールドエラーをクリア
 */
function clearAllFieldErrors(formElement) {
  const errorElements = formElement.querySelectorAll('.field-error');
  errorElements.forEach(element => {
    element.parentElement.classList.remove('has-error');
    element.remove();
  });
}

/**
 * フォームのリセット
 */
function resetForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.reset();
  
  // エラー表示をクリア
  clearAllFieldErrors(form);
  
  // セレクトボックスの初期化
  const selects = form.querySelectorAll('select');
  if (selects.length > 0 && typeof M !== 'undefined' && M.FormSelect) {
    M.FormSelect.init(selects);
  }
  
  // 日付入力フィールドの更新
  if (typeof M !== 'undefined' && M.updateTextFields) {
    M.updateTextFields();
  }
}

/**
 * 確認ダイアログの表示
 */
function showConfirmDialog(message, onConfirm, onCancel) {
  // まず既存のダイアログがあれば削除
  const existingDialog = document.getElementById('confirm-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }
  
  // 確認ダイアログの作成
  const dialogOverlay = document.createElement('div');
  dialogOverlay.className = 'modal-overlay';
  dialogOverlay.style.display = 'block';
  dialogOverlay.style.zIndex = '1000';
  dialogOverlay.style.opacity = '0.5';
  
  const dialogContainer = document.createElement('div');
  dialogContainer.id = 'confirm-dialog';
  dialogContainer.className = 'modal open';
  dialogContainer.style.display = 'block';
  dialogContainer.style.zIndex = '1001';
  dialogContainer.style.opacity = '1';
  dialogContainer.style.transform = 'scaleX(1) scaleY(1)';
  
  dialogContainer.innerHTML = `
    <div class="modal-content">
      <h4>確認</h4>
      <p>${message}</p>
    </div>
    <div class="modal-footer">
      <button id="confirm-cancel" class="modal-close waves-effect waves-green btn-flat">キャンセル</button>
      <button id="confirm-ok" class="waves-effect waves-light btn">OK</button>
    </div>
  `;
  
  // ボディに追加
  document.body.appendChild(dialogOverlay);
  document.body.appendChild(dialogContainer);
  
  // ボタンイベント
  document.getElementById('confirm-ok').addEventListener('click', function() {
    closeConfirmDialog();
    if (onConfirm) onConfirm();
  });
  
  document.getElementById('confirm-cancel').addEventListener('click', function() {
    closeConfirmDialog();
    if (onCancel) onCancel();
  });
  
  // ESCキーでもキャンセル
  const escHandler = function(e) {
    if (e.key === 'Escape') {
      closeConfirmDialog();
      if (onCancel) onCancel();
      document.removeEventListener('keydown', escHandler);
    }
  };
  
  document.addEventListener('keydown', escHandler);
  
  function closeConfirmDialog() {
    dialogOverlay.remove();
    dialogContainer.remove();
    document.removeEventListener('keydown', escHandler);
  }
  
  return { 
    close: closeConfirmDialog 
  };
}

/**
 * トースト通知
 */
function showToast(message, type = 'info', duration = 3000) {
  // 既存のトーストを削除
  const existingToast = document.querySelector('.custom-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // トースト要素作成
  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    </div>
  `;
  
  // スタイル設定
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.padding = '10px 15px';
  toast.style.borderRadius = '4px';
  toast.style.color = 'white';
  toast.style.zIndex = '1000';
  toast.style.minWidth = '250px';
  toast.style.textAlign = 'center';
  toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  
  // タイプによって背景色を変更
  if (type === 'success') {
    toast.style.backgroundColor = '#4CAF50';
  } else if (type === 'error') {
    toast.style.backgroundColor = '#F44336';
  } else if (type === 'warning') {
    toast.style.backgroundColor = '#FF9800';
  } else {
    toast.style.backgroundColor = '#2196F3';
  }
  
  // 閉じるボタンのスタイル
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.style.marginLeft = '10px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'white';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  
  // 閉じるボタンのイベント
  closeBtn.addEventListener('click', function() {
    document.body.removeChild(toast);
  });
  
  // ドキュメントに追加
  document.body.appendChild(toast);
  
  // 一定時間後に自動的に消す
  setTimeout(function() {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, duration);
  
  return toast;
}

/**
 * 入力フォームから機材オブジェクトを作成
 */
function createEquipmentFromForm() {
  const equipmentData = {
    name: document.getElementById('new-equipment-name').value.trim(),
    totalQuantity: parseInt(document.getElementById('new-equipment-quantity').value) || 1,
    specification: document.getElementById('new-equipment-spec').value.trim(),
    model: document.getElementById('new-equipment-model').value.trim(),
    manufacturer: document.getElementById('new-equipment-maker').value.trim(),
    serialNumber: document.getElementById('new-equipment-serial').value.trim(),
    alias: document.getElementById('new-equipment-alias').value.trim(),
    location: document.getElementById('new-equipment-location').value,
    note1: document.getElementById('new-equipment-note1').value.trim(),
    note2: document.getElementById('new-equipment-note2').value.trim()
  };
  
  return equipmentData;
}

/**
 * 入力フォームから貸出オブジェクトを作成
 */
function createRentalFromForm(equipmentId) {
  // 現場名の取得（新規入力か選択かを判定）
  let siteName = document.getElementById('rental-project').value;
  const newProject = document.getElementById('new-project').value.trim();
  
  // 新規入力がある場合はそちらを優先
  if (newProject) {
    siteName = newProject;
  }
  
  // 機材情報の取得
  const equipment = equipmentList.find(eq => eq.id === equipmentId);
  if (!equipment) {
    throw new Error('選択された機材情報が見つかりません');
  }
  
  const rentalData = {
    equipmentId: equipmentId,
    equipmentName: equipment.name,
    startDate: document.getElementById('rental-start').value,
    endDate: document.getElementById('rental-end').value,
    quantity: parseInt(document.getElementById('rental-quantity').value) || 1,
    site: siteName,
    borrower: currentUser.displayName || '名称未設定',
    status: 'active'  // アクティブステータスを明示的に設定
  };
  
  return rentalData;
}

/**
 * フォーム送信ボタンの無効化/有効化
 */
function toggleSubmitButton(buttonId, disabled, loadingText = null) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  button.disabled = disabled;
  
  if (disabled && loadingText) {
    // 元のテキストを保存
    if (!button.hasAttribute('data-original-text')) {
      button.setAttribute('data-original-text', button.innerHTML);
    }
    button.innerHTML = `<i class="material-icons left">hourglass_empty</i>${loadingText}`;
  } else if (!disabled && button.hasAttribute('data-original-text')) {
    // 元のテキストに戻す
    button.innerHTML = button.getAttribute('data-original-text');
    button.removeAttribute('data-original-text');
  }
}

/**
 * タブ切り替え機能
 */
function setupTabs(tabContainerId) {
  const tabContainer = document.getElementById(tabContainerId);
  if (!tabContainer) return;
  
  const tabButtons = tabContainer.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // すべてのタブとコンテンツを非アクティブにする
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // 選択されたタブとコンテンツをアクティブにする
      this.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // 初期タブをアクティブにする
  if (tabButtons.length > 0) {
    tabButtons[0].click();
  }
}

// ウィンドウサイズ変更時のリサイズ処理
window.addEventListener('resize', debounce(function() {
  adjustUIForScreenSize();
}, 250));

// 画面サイズに応じたUI調整
function adjustUIForScreenSize() {
  const width = window.innerWidth;
  
  // モバイル判定（768px以下）
  const isMobile = width <= 768;
  
  // モバイル時の処理
  if (isMobile) {
    document.body.classList.add('mobile-view');
    
    // モバイル向けにボタンテキスト調整
    document.querySelectorAll('.btn .hide-on-mobile').forEach(el => {
      el.style.display = 'none';
    });
  } else {
    document.body.classList.remove('mobile-view');
    
    // デスクトップ向けにボタンテキスト復元
    document.querySelectorAll('.btn .hide-on-mobile').forEach(el => {
      el.style.display = 'inline';
    });
  }
  
  // カレンダー表示調整
  adjustCalendarHeight();
}

// 初期ロード時にUIサイズ調整を実行
document.addEventListener('DOMContentLoaded', function() {
  adjustUIForScreenSize();
  initializeUI();
});