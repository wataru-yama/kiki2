/**
 * 機材貸出管理システム
 * メインスクリプト - アプリケーション初期化と共通機能
 */

// グローバル変数
let equipmentList = [];    // 機材リスト
let rentalData = [];       // 貸出データ
let currentUser = null;    // 現在のユーザー情報
let locations = [];        // 置場のマスターデータ
let sites = [];            // 現場のマスターデータ
let fontSizeLevel = 1;     // フォントサイズレベル (0: 小, 1: 中, 2: 大)
let materializeInitialized = false; // Materializeの初期化状態

// アプリケーション起動時の処理
document.addEventListener('DOMContentLoaded', function() {
  console.log('機材貸出管理システムを起動中...');
  
  // デバッグ領域を追加
  setupDebugContainer();
  
  // フォントサイズコントロールを追加
  addFontSizeControls();
  
  // Materializeを初期化
  initializeMaterialize();
  
  // アプリケーションを初期化
  initializeApp();
  
  // イベントリスナーの設定
  setupEventListeners();
  
  // カレンダーを初期化
  initializeCalendar();
  
  logDebug('DOMContentLoaded イベントを処理しました');
});

/**
 * アプリケーションの初期化
 */
function initializeApp() {
  logDebug('アプリケーション初期化開始');
  
  // ローディング表示
  showLoadingMessage('データを読み込んでいます...');
  
  // セーフティタイマー（30秒後に強制的にローディングを消す）
  const safetyTimer = setTimeout(function() {
    hideLoadingMessage();
    logDebug('セーフティタイマーによりローディング表示を終了しました');
  }, 30000);
  
  // 現在のユーザー情報を取得
  google.script.run
    .withSuccessHandler(function(user) {
      handleUserInfo(user);
      checkInitComplete();
    })
    .withFailureHandler(function(error) {
      console.error('ユーザー情報取得エラー:', error);
      logDebug('ユーザー情報取得エラー: ' + (error.message || error));
      
      // ダミーユーザー情報を設定
      handleUserInfo({
        email: 'guest@example.com',
        displayName: 'ゲストユーザー',
        role: 'guest'
      });
      
      checkInitComplete();
    })
    .getCurrentUser();
  
  // マスターデータを取得
  google.script.run
    .withSuccessHandler(function(data) {
      handleMasterData(data);
      checkInitComplete();
    })
    .withFailureHandler(function(error) {
      console.error('マスターデータ取得エラー:', error);
      logDebug('マスターデータ取得エラー: ' + (error.message || error));
      
      // ダミーデータを設定
      handleMasterData({
        locations: [],
        sites: []
      });
      
      checkInitComplete();
    })
    .getMasterData();
  
  // 機材リストを取得
  google.script.run
    .withSuccessHandler(function(data) {
      handleEquipmentList(data);
      checkInitComplete();
    })
    .withFailureHandler(function(error) {
      console.error('機材リスト取得エラー:', error);
      logDebug('機材リスト取得エラー: ' + (error.message || error));
      
      // 空の機材リストで初期化
      handleEquipmentList([]);
      
      checkInitComplete();
    })
    .getEquipmentList();
  
  // 貸出データを取得
  google.script.run
    .withSuccessHandler(function(data) {
      handleRentalData(data);
      checkInitComplete();
    })
    .withFailureHandler(function(error) {
      console.error('貸出データ取得エラー:', error);
      logDebug('貸出データ取得エラー: ' + (error.message || error));
      
      // 空の貸出データで初期化
      handleRentalData([]);
      
      checkInitComplete();
    })
    .getRentalData();
  
  // 初期化完了チェック用変数
  let initStatus = {
    user: false,
    master: false,
    equipment: false,
    rental: false
  };
  
  // 初期化完了をチェックする関数
  function checkInitComplete() {
    // 各データの読み込み状態を更新
    if (currentUser) initStatus.user = true;
    if (locations && sites) initStatus.master = true;
    if (equipmentList !== null) initStatus.equipment = true;
    if (rentalData !== null) initStatus.rental = true;
    
    // すべて読み込み完了したかチェック
    const allLoaded = Object.values(initStatus).every(loaded => loaded);
    
    logDebug(`初期化状態: ユーザー=${initStatus.user}, マスター=${initStatus.master}, 機材=${initStatus.equipment}, 貸出=${initStatus.rental}`);
    
    if (allLoaded) {
      clearTimeout(safetyTimer);
      hideLoadingMessage();
      logDebug('すべてのデータ読み込みが完了しました');
      
      // 機材セレクターの初期化
      updateEquipmentSelector();
      
      // カレンダーを描画
      renderCalendar();
      
      // Materializeの再初期化（動的に生成された要素のため）
      setTimeout(function() {
        try {
          initializeMaterialize();
        } catch (e) {
          console.error('Materializeの再初期化エラー:', e);
          logDebug('Materializeの再初期化エラー: ' + e.message);
        }
      }, 500);
    }
  }
  
  logDebug('アプリケーション初期化完了');
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // マスター管理ボタン
  const manageProjectsBtn = document.getElementById('manage-projects-btn');
  if (manageProjectsBtn) {
    manageProjectsBtn.addEventListener('click', function() {
      loadProjectsList(); // 現場リストをロードしてから表示
      showModal('projects-modal');
    });
  }
  
  const manageEquipmentBtn = document.getElementById('manage-equipment-btn');
  if (manageEquipmentBtn) {
    manageEquipmentBtn.addEventListener('click', function() {
      updateEquipmentTable(); // 機器リストを更新してから表示
      showModal('equipment-modal');
    });
  }
  
  // ヘルプボタンのイベントリスナー
  const helpBtn = document.getElementById('help-btn');
  if (helpBtn) {
    helpBtn.addEventListener('click', function() {
      toggleHelpHint();
    });
  }
  
  // 機材選択ドロップダウンのイベントリスナー
  const equipmentSelector = document.getElementById('equipment-selector');
  if (equipmentSelector) {
    equipmentSelector.addEventListener('change', function() {
      selectedEquipmentId = this.value;
      logDebug(`機材フィルターを変更: ID=${selectedEquipmentId}`);
      renderCalendar(); // カレンダーを再描画
    });
  }
  
  // 貸出保存ボタン
  const saveRentalBtn = document.getElementById('save-rental');
  if (saveRentalBtn) {
    saveRentalBtn.addEventListener('click', function() {
      saveRental();
    });
  }
  
  // 返却保存ボタン
  const saveReturnBtn = document.getElementById('save-return');
  if (saveReturnBtn) {
    saveReturnBtn.addEventListener('click', function() {
      returnEquipment();
    });
  }
  
  // ヒントを閉じるボタン
  const hideHintBtn = document.getElementById('hide-hint');
  if (hideHintBtn) {
    hideHintBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const hintBox = document.querySelector('.touch-hint');
      if (hintBox) {
        hintBox.style.display = 'none';
      }
    });
  }
  
  // 現場追加ボタン
  const addProjectBtn = document.getElementById('add-project-btn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', function() {
      addProject();
    });
  }
  
  // 現場削除ボタン
  const deleteProjectsBtn = document.getElementById('delete-projects-btn');
  if (deleteProjectsBtn) {
    deleteProjectsBtn.addEventListener('click', function() {
      deleteSelectedProjects();
    });
  }
  
  // 機器追加ボタン
  const addEquipmentBtn = document.getElementById('add-equipment-btn');
  if (addEquipmentBtn) {
    addEquipmentBtn.addEventListener('click', function() {
      addEquipment();
    });
  }
  
  // 機器削除ボタン
  const deleteEquipmentBtn = document.getElementById('delete-equipment-btn');
  if (deleteEquipmentBtn) {
    deleteEquipmentBtn.addEventListener('click', function() {
      deleteSelectedEquipment();
    });
  }
  
  // リサイズイベントを監視
  window.addEventListener('resize', debounce(function() {
    // カレンダー表示高さの調整
    adjustCalendarHeight();
  }, 250));
  
  logDebug('イベントリスナーが設定されました');
}

/**
 * Materializeの初期化
 */
function initializeMaterialize() {
  if (materializeInitialized) return;
  
  try {
    // セレクトボックスの初期化
    const selects = document.querySelectorAll('select');
    if (selects.length > 0) {
      M.FormSelect.init(selects);
    }
    
    // モーダルの初期化
    const modals = document.querySelectorAll('.modal');
    if (modals.length > 0) {
      M.Modal.init(modals, {
        dismissible: true,
        opacity: 0.5,
        inDuration: 300,
        outDuration: 200,
        startingTop: '4%',
        endingTop: '10%'
      });
    }
    
    // ツールチップの初期化（もしあれば）
    const tooltips = document.querySelectorAll('.tooltipped');
    if (tooltips.length > 0) {
      M.Tooltip.init(tooltips);
    }
    
    materializeInitialized = true;
    logDebug('Materializeの初期化が完了しました');
  } catch (error) {
    console.error('Materializeの初期化中にエラーが発生しました:', error);
    logDebug('Materialize初期化エラー: ' + error.message);
  }
}

/**
 * デバッグコンテナの設定
 */
function setupDebugContainer() {
  const debugContainer = document.createElement('div');
  debugContainer.id = 'debug-container';
  debugContainer.className = 'debug-info';
  debugContainer.style.display = 'none'; // 初期状態では非表示
  
  const debugTitle = document.createElement('div');
  debugTitle.className = 'debug-title';
  debugTitle.textContent = 'デバッグ情報';
  
  const debugContent = document.createElement('div');
  debugContent.id = 'debug-content';
  
  const debugToggle = document.createElement('button');
  debugToggle.className = 'btn-small waves-effect waves-light grey';
  debugToggle.textContent = 'Debug';
  debugToggle.style.position = 'fixed';
  debugToggle.style.bottom = '10px';
  debugToggle.style.left = '10px';
  debugToggle.style.zIndex = '1000';
  debugToggle.onclick = function() {
    const container = document.getElementById('debug-container');
    if (container) {
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
  };
  
  debugContainer.appendChild(debugTitle);
  debugContainer.appendChild(debugContent);
  
  // コンテナの先頭に追加
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(debugToggle, container.firstChild);
      container.insertBefore(debugContainer, container.firstChild);
      
      // クリアボタンも追加
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn-small waves-effect waves-light red';
      clearBtn.textContent = 'Clear';
      clearBtn.style.marginLeft = '10px';
      clearBtn.onclick = function() {
        const content = document.getElementById('debug-content');
        if (content) {
          content.innerHTML = '';
        }
      };
      debugTitle.appendChild(clearBtn);
    }
  });
}

/**
 * デバッグログを出力
 */
function logDebug(message) {
  console.log(message);
  const debugContent = document.getElementById('debug-content');
  if (debugContent) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugContent.appendChild(logEntry);
    
    // スクロールを最下部に
    debugContent.scrollTop = debugContent.scrollHeight;
  }
}

/**
 * フォントサイズコントロールを追加
 */
function addFontSizeControls() {
  // コントロール要素を作成
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'font-size-controls';
  
  // ヘルプボタン
  const helpBtn = document.createElement('button');
  helpBtn.className = 'btn-floating btn-small waves-effect waves-light blue-grey lighten-2';
  helpBtn.innerHTML = '<i class="material-icons">help</i>';
  helpBtn.title = '操作ヒントを表示';
  helpBtn.addEventListener('click', function() {
    toggleHelpHint();
  });
  
  // 小さくするボタン
  const decreaseBtn = document.createElement('button');
  decreaseBtn.className = 'btn-floating btn-small waves-effect waves-light blue';
  decreaseBtn.innerHTML = '<i class="material-icons">remove</i>';
  decreaseBtn.title = '文字サイズを小さくする';
  decreaseBtn.addEventListener('click', function() {
    changeFontSize('decrease');
  });
  
  // 大きくするボタン
  const increaseBtn = document.createElement('button');
  increaseBtn.className = 'btn-floating btn-small waves-effect waves-light blue';
  increaseBtn.innerHTML = '<i class="material-icons">add</i>';
  increaseBtn.title = '文字サイズを大きくする';
  increaseBtn.addEventListener('click', function() {
    changeFontSize('increase');
  });
  
  // リセットボタン
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn-floating btn-small waves-effect waves-light green';
  resetBtn.innerHTML = '<i class="material-icons">refresh</i>';
  resetBtn.title = '文字サイズを標準に戻す';
  resetBtn.addEventListener('click', function() {
    changeFontSize('reset');
  });
  
  // コントロールに追加
  controlsDiv.appendChild(helpBtn);
  controlsDiv.appendChild(decreaseBtn);
  controlsDiv.appendChild(resetBtn);
  controlsDiv.appendChild(increaseBtn);
  
  // ページに追加
  document.body.appendChild(controlsDiv);
  
  // ヘルプボタンの元の位置のボタンを非表示
  document.addEventListener('DOMContentLoaded', function() {
    const originalHelpBtn = document.getElementById('help-btn');
    if (originalHelpBtn) {
      originalHelpBtn.style.display = 'none';
    }
  });
  
  logDebug('フォントサイズコントロールを追加しました');
}

/**
 * フォントサイズを変更
 */
function changeFontSize(action) {
  // 現在のサイズレベルを更新
  if (action === 'increase' && fontSizeLevel < 2) {
    fontSizeLevel++;
  } else if (action === 'decrease' && fontSizeLevel > 0) {
    fontSizeLevel--;
  } else if (action === 'reset') {
    fontSizeLevel = 1;
  }
  
  // HTMLのルート要素にクラスを設定
  const htmlElement = document.documentElement;
  htmlElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
  
  switch (fontSizeLevel) {
    case 0:
      htmlElement.classList.add('font-size-small');
      break;
    case 1:
      htmlElement.classList.add('font-size-medium');
      break;
    case 2:
      htmlElement.classList.add('font-size-large');
      break;
  }
  
  // カレンダーを再描画
  adjustCalendarHeight();
  
  logDebug(`フォントサイズを変更: レベル=${fontSizeLevel}`);
}

/**
 * ヘルプヒントの表示/非表示を切り替え
 */
function toggleHelpHint() {
  const hintBox = document.querySelector('.touch-hint');
  if (hintBox) {
    if (hintBox.style.display === 'none' || !hintBox.style.display) {
      hintBox.style.display = 'block';
    } else {
      hintBox.style.display = 'none';
    }
  }
  
  logDebug('操作ヒント表示を切り替えました');
}

/**
 * ユーザー情報の処理
 */
function handleUserInfo(user) {
  logDebug('ユーザー情報取得: ' + (user ? user.displayName : 'ユーザー情報なし'));
  
  if (!user) {
    console.error('ユーザー情報がnullです');
    // デフォルトユーザー情報を設定
    currentUser = {
      email: 'guest@example.com',
      displayName: 'ゲストユーザー',
      role: 'guest'
    };
  } else {
    currentUser = user;
  }
  
  const usernameElement = document.getElementById('username');
  if (usernameElement) {
    usernameElement.textContent = currentUser.displayName || 'ゲストユーザー';
  }
  
  // ユーザー情報をグローバルに保持
  window.currentUser = currentUser;
  
  // デバッグ情報表示
  logDebug(`ユーザー情報: ${currentUser.displayName} (${currentUser.email}) [${currentUser.role}]`);
}

/**
 * マスターデータの処理
 */
function handleMasterData(data) {
  logDebug('マスターデータ取得完了');
  // nullチェックを追加
  if (!data) {
    console.error('マスターデータがnullです');
    return;
  }
  
  // 置場と現場のマスターデータを保存
  locations = data.locations || [];
  sites = data.sites || [];
  
  // グローバル変数に保存
  window.locations = locations;
  window.sites = sites;
  
  // 現場のリストをセレクトボックスに反映
  updateProjectSelector();
  
  // 置場のリストを機材登録フォームに反映
  updateLocationSelector();
  
  logDebug('マスターデータ設定完了 - 現場数: ' + sites.length + ', 置場数: ' + locations.length);
}

/**
 * 現場セレクタの更新
 */
function updateProjectSelector() {
  const projectSelect = document.getElementById('rental-project');
  if (projectSelect) {
    projectSelect.innerHTML = '';
    
    // 空のオプションを追加
    const emptySiteOption = document.createElement('option');
    emptySiteOption.value = '';
    emptySiteOption.textContent = '選択してください';
    emptySiteOption.disabled = true;
    emptySiteOption.selected = true;
    projectSelect.appendChild(emptySiteOption);
    
    // 現場の選択肢を追加
    sites.forEach(site => {
      const option = document.createElement('option');
      option.value = site.name;
      option.textContent = site.name;
      projectSelect.appendChild(option);
    });
    
    // Materializeのselect更新
    try {
      if (typeof M !== 'undefined' && M.FormSelect) {
        M.FormSelect.init(projectSelect);
      }
    } catch (e) {
      console.error('現場セレクトの初期化エラー:', e);
      logDebug('現場セレクトの初期化エラー: ' + e.message);
    }
  }
}

/**
 * 置場セレクタの更新
 */
function updateLocationSelector() {
  const locationSelect = document.getElementById('new-equipment-location');
  if (locationSelect) {
    locationSelect.innerHTML = '';
    
    // 空のオプションを追加
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '選択してください';
    locationSelect.appendChild(emptyOption);
    
    // 置場の選択肢を追加
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.name;
      option.textContent = location.name;
      locationSelect.appendChild(option);
    });
    
    // Materializeのselect更新
    try {
      if (typeof M !== 'undefined' && M.FormSelect) {
        M.FormSelect.init(locationSelect);
      }
    } catch (e) {
      console.error('置場セレクトの初期化エラー:', e);
      logDebug('置場セレクトの初期化エラー: ' + e.message);
    }
  }
}

/**
 * 機材リストの処理
 */
function handleEquipmentList(data) {
  // nullチェックを追加
  if (!data) {
    console.error('機材リストがnullです');
    logDebug('機材リストがnullです');
    equipmentList = [];
    return;
  }
  
  logDebug(`機材リスト取得完了: ${data.length}件`);
  equipmentList = data;
  
  // グローバル変数に保持
  window.equipmentList = equipmentList;
  
  // 機材管理テーブルを更新
  updateEquipmentTable();
  
  // デバッグ表示
  if (equipmentList.length > 0) {
    logDebug(`機材の例: ${equipmentList[0].id}, ${equipmentList[0].name}`);
  }
  
  // 機材セレクターの更新
  updateEquipmentSelector();
  
  logDebug('機材リストを設定しました: ' + equipmentList.length + '件');
}

/**
 * 機材セレクターの更新
 */
function updateEquipmentSelector() {
  // ドロップダウンセレクターがあれば更新
  const selector = document.getElementById('equipment-selector');
  if (selector) {
    selector.innerHTML = '';
    
    // デフォルトオプション（全表示）
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '全ての機材を表示';
    defaultOption.selected = true;
    selector.appendChild(defaultOption);
    
    // 機材オプションを追加
    equipmentList.forEach(equipment => {
      const option = document.createElement('option');
      option.value = equipment.id;
      option.textContent = `${equipment.name} (#${equipment.id})`;
      selector.appendChild(option);
    });
    
    // Materializeのselect更新
    try {
      if (typeof M !== 'undefined' && M.FormSelect) {
        M.FormSelect.init(selector);
      }
    } catch (e) {
      console.error('機材セレクターの初期化エラー:', e);
      logDebug('機材セレクターの初期化エラー: ' + e.message);
    }
  }
}

/**
 * 機材管理テーブルを更新
 */
function updateEquipmentTable() {
  const tableBody = document.getElementById('equipment-list-table');
  if (!tableBody) return;
  
  // テーブルをクリア
  tableBody.innerHTML = '';
  
  // 機材リストがない場合
  if (!equipmentList || equipmentList.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="4" class="center-align">機材データがありません</td>';
    tableBody.appendChild(emptyRow);
    return;
  }
  
  // 機材リストを表示
  equipmentList.forEach(equipment => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td><input type="checkbox" id="eq-${equipment.id}" class="equipment-checkbox" />
          <label for="eq-${equipment.id}"></label></td>
      <td>${equipment.id}</td>
      <td>${equipment.name}</td>
      <td>${equipment.totalQuantity || 0}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  logDebug('機材管理テーブルを更新しました: ' + equipmentList.length + '件');
}

/**
 * 貸出データの処理
 */
function handleRentalData(data) {
  // nullチェックを追加
  if (!data) {
    console.error('貸出データがnullです');
    logDebug('貸出データがnullです');
    rentalData = [];
    return;
  }
  
  logDebug(`貸出データ取得完了: ${data.length}件`);
  rentalData = data;
  
  // グローバル変数に保持
  window.rentalData = rentalData;
  
  // すでにカレンダーが描画されている場合は貸出バーのみ更新
  if (document.querySelector('.calendar-row')) {
    refreshRentalBars();
  }
  
  logDebug('貸出データを設定しました: ' + rentalData.length + '件');
}

/**
 * ローディングメッセージの表示
 */
function showLoadingMessage(message) {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    const messageElement = document.createElement('div');
    messageElement.className = 'loading-message';
    messageElement.textContent = message;
    
    // 既存のメッセージがあれば削除
    const existingMessage = loadingElement.querySelector('.loading-message');
    if (existingMessage) {
      loadingElement.removeChild(existingMessage);
    }
    
    loadingElement.appendChild(messageElement);
    loadingElement.classList.remove('hidden');
    
    logDebug(`ローディング表示: ${message}`);
  }
}

/**
 * ローディングメッセージの非表示
 */
function hideLoadingMessage() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
    
    const messageElement = loadingElement.querySelector('.loading-message');
    if (messageElement) {
      loadingElement.removeChild(messageElement);
    }
    
    logDebug('ローディング表示を非表示');
  }
}

/**
 * 成功メッセージの表示
 */
function showSuccessMessage(message) {
  try {
    // Materialize CSSのトースト機能を使用
    if (typeof M !== 'undefined' && M.toast) {
      M.toast({html: message, classes: 'green', displayLength: 3000});
    } else {
      // フォールバック：アラート
      alert(message);
    }
    
    logDebug(`成功メッセージ: ${message}`);
  } catch (e) {
    console.error('トースト表示エラー:', e);
    logDebug('トースト表示エラー: ' + e.message);
    // 最終フォールバック
    alert(message);
  }
}

/**
 * エラーハンドリング
 */
function handleError(error) {
  console.error('エラーが発生しました:', error);
  logDebug('エラー: ' + (error.message || error));
  
  try {
    // Materialize CSSのトースト機能を使用
    if (typeof M !== 'undefined' && M.toast) {
      M.toast({html: `エラー: ${error.message || error}`, classes: 'red', displayLength: 4000});
    } else {
      // フォールバック：アラート
      alert(`エラー: ${error.message || error}`);
    }
  } catch (e) {
    console.error('エラートースト表示エラー:', e);
    logDebug('エラートースト表示エラー: ' + e.message);
    // 最終フォールバック
    alert(`エラー: ${error.message || error}`);
  }
}

/**
 * 日付フォーマット (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * デバウンス関数
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 更新メッセージの表示
 */
function showUpdateMessage(message, type = 'info') {
  // 既存のメッセージがあれば削除
  const existingMsg = document.getElementById('update-message');
  if (existingMsg) {
    existingMsg.remove();
  }
  
  // メッセージ要素を作成
  const messageDiv = document.createElement('div');
  messageDiv.id = 'update-message';
  messageDiv.textContent = message;
  
  // タイプに応じたスタイル
  if (type === 'error') {
    messageDiv.style.backgroundColor = 'rgba(244, 67, 54, 0.8)'; // 赤
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.8)'; // 緑
  } else {
    messageDiv.style.backgroundColor = 'rgba(33, 150, 243, 0.8)'; // 青
  }
  
  // 共通スタイル
  messageDiv.style.color = 'white';
  messageDiv.style.padding = '10px 15px';
  messageDiv.style.borderRadius = '4px';
  messageDiv.style.position = 'fixed';
  messageDiv.style.top = '50%';
  messageDiv.style.left = '50%';
  messageDiv.style.transform = 'translate(-50%, -50%)';
  messageDiv.style.zIndex = '9999';
  messageDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  
  // ドキュメントに追加
  document.body.appendChild(messageDiv);
  
  // 自動的に消える
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

/**
 * 貸出データの再取得
 */
function refreshRentalData() {
  showLoadingMessage('データ更新中...');
  
  google.script.run
    .withSuccessHandler(function(data) {
      handleRentalData(data);
      hideLoadingMessage();
    })
    .withFailureHandler(function(error) {
      handleError(error);
      hideLoadingMessage();
    })
    .getRentalData();
}

/**
 * 機材リストの再取得
 */
function refreshEquipmentList() {
  showLoadingMessage('機材リスト更新中...');
  
  google.script.run
    .withSuccessHandler(function(data) {
      handleEquipmentList(data);
      hideLoadingMessage();
    })
    .withFailureHandler(function(error) {
      handleError(error);
      hideLoadingMessage();
    })
    .getEquipmentList();
}

/**
 * モーダルの表示
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  try {
    // Materialize CSSのモーダル機能を使用
    if (typeof M !== 'undefined' && M.Modal) {
      const modalInstance = M.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.open();
      } else {
        const newInstance = M.Modal.init(modal, {
          dismissible: true,
          opacity: 0.5,
          inDuration: 300,
          outDuration: 200,
          startingTop: '4%',
          endingTop: '10%'
        });
        newInstance.open();
      }
      
      logDebug(`モーダルインスタンスを開く: ${modalId}`);
    } else {
      // フォールバック：CSSで表示
      modal.style.display = 'block';
      modal.classList.add('open');
      
      logDebug(`フォールバックでモーダルを表示: ${modalId}`);
    }
  } catch (e) {
    console.error(`モーダル表示エラー(${modalId}):`, e);
    logDebug(`モーダル表示エラー(${modalId}): ${e.message}`);
    
    // 最終フォールバック
    try {
      modal.style.display = 'block';
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.opacity = '0.5';
      overlay.style.display = 'block';
      document.body.appendChild(overlay);
      
      logDebug(`緊急フォールバックでモーダルを表示: ${modalId}`);
    } catch (err) {
      console.error('緊急モーダル表示エラー:', err);
    }
  }
}

/**
 * モーダルの非表示
 */
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  try {
    if (typeof M !== 'undefined' && M.Modal) {
      const instance = M.Modal.getInstance(modal);
      if (instance) {
        instance.close();
      }
    } else {
      // フォールバック：CSSで非表示
      modal.style.display = 'none';
      modal.classList.remove('open');
      
      // オーバーレイを削除
      const overlays = document.querySelectorAll('.modal-overlay');
      overlays.forEach(overlay => {
        overlay.remove();
      });
    }
    
    logDebug(`モーダルを非表示: ${modalId}`);
  } catch (e) {
    console.error(`モーダル非表示エラー(${modalId}):`, e);
    logDebug(`モーダル非表示エラー(${modalId}): ${e.message}`);
    
    // 最終フォールバック
    modal.style.display = 'none';
    
    // オーバーレイを削除
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
      overlay.remove();
    });
  }
}