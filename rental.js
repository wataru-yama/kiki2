/**
 * 機材貸出管理システム
 * 貸出・返却処理の実装
 */

/**
 * 貸出モーダルの表示
 */
function showRentalModal(equipment, startDate, endDate) {
  if (!equipment) {
    console.error('機材データがnullです');
    logDebug('機材データがnullです');
    return;
  }
  
  // モーダル内の値をリセット
  document.getElementById('rental-equipment').value = `${equipment.name} (#${equipment.id})`;
  
  // 日付の設定
  if (startDate && endDate) {
    document.getElementById('rental-start').value = startDate;
    document.getElementById('rental-end').value = endDate;
  } else {
    // デフォルト値として今日の日付と1週間後を設定
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('rental-start').value = formatDate(today);
    document.getElementById('rental-end').value = formatDate(nextWeek);
  }
  
  document.getElementById('rental-project').value = '';
  document.getElementById('rental-quantity').value = '1';
  document.getElementById('new-project').value = '';
  
  // 数量の最大値を設定
  const quantityInput = document.getElementById('rental-quantity');
  if (quantityInput) {
    quantityInput.max = equipment.totalQuantity || 1;
  }
  
  // モーダル表示
  const modal = document.getElementById('rental-modal');
  modal.setAttribute('data-equipment-id', equipment.id);
  modal.removeAttribute('data-rental-id'); // 新規モードでは貸出IDを削除
  showModal('rental-modal');
  
  // 返却ボタンがあれば削除
  const returnBtn = document.getElementById('return-btn');
  if (returnBtn) {
    returnBtn.remove();
  }
  
  logDebug(`貸出モーダルを表示: 機材=${equipment.name}, 開始=${startDate}, 終了=${endDate}`);
  
  // Materializeフォーム更新
  setTimeout(function() {
    M.updateTextFields();
    const selectElements = document.querySelectorAll('select');
    M.FormSelect.init(selectElements);
  }, 100);
}

/**
 * 貸出編集モーダルの表示
 */
function showEditRentalModal(rental) {
  if (!rental) {
    console.error('貸出データがnullです');
    logDebug('貸出データがnullです');
    return;
  }
  
  // モーダル内の値を設定
  document.getElementById('rental-equipment').value = `${rental.equipmentName} (#${rental.equipmentId})`;
  document.getElementById('rental-start').value = rental.startDate;
  document.getElementById('rental-end').value = rental.endDate;
  document.getElementById('rental-project').value = rental.site;
  document.getElementById('rental-quantity').value = rental.quantity;
  document.getElementById('new-project').value = '';
  
  // モーダル表示
  const modal = document.getElementById('rental-modal');
  modal.setAttribute('data-rental-id', rental.id);
  modal.setAttribute('data-equipment-id', rental.equipmentId);
  showModal('rental-modal');
  
  // 返却ボタンの表示
  const footer = modal.querySelector('.modal-footer');
  
  // 返却ボタンが既に存在する場合は削除
  const existingReturnBtn = document.getElementById('return-btn');
  if (existingReturnBtn) {
    footer.removeChild(existingReturnBtn);
  }
  
  // 返却ボタンを追加
  const returnBtn = document.createElement('button');
  returnBtn.id = 'return-btn';
  returnBtn.className = 'waves-effect waves-light btn orange';
  returnBtn.innerHTML = '<i class="material-icons left">replay</i>返却';
  returnBtn.addEventListener('click', function() {
    hideModal('rental-modal');
    showReturnModal(rental);
  });
  
  footer.insertBefore(returnBtn, document.querySelector('#rental-modal .modal-close'));
  
  logDebug(`貸出編集モーダルを表示: ID=${rental.id}, 機材=${rental.equipmentName}`);
  
  // Materializeフォーム更新
  setTimeout(function() {
    M.updateTextFields();
    const selectElements = document.querySelectorAll('select');
    M.FormSelect.init(selectElements);
  }, 100);
}

/**
 * 返却モーダルの表示
 */
function showReturnModal(rental) {
  if (!rental) {
    console.error('貸出データがnullです');
    logDebug('貸出データがnullです');
    return;
  }
  
  // モーダル内の値を設定
  document.getElementById('return-equipment').value = `${rental.equipmentName} (#${rental.equipmentId})`;
  document.getElementById('return-date').value = formatDate(new Date());
  
  // 返却数量の選択肢を設定
  const quantitySelect = document.getElementById('return-quantity');
  if (quantitySelect) {
    quantitySelect.innerHTML = '';
    
    // 貸出数量分の選択肢を作成
    for (let i = 1; i <= rental.quantity; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}台`;
      quantitySelect.appendChild(option);
    }
    
    // デフォルトで全数量を返却
    quantitySelect.value = rental.quantity;
    
    // Materializeのselect更新
    try {
      if (typeof M !== 'undefined' && M.FormSelect) {
        M.FormSelect.init(quantitySelect);
      }
    } catch (e) {
      console.error('返却数量セレクトの初期化エラー:', e);
      logDebug('返却数量セレクトの初期化エラー: ' + e.message);
    }
  }
  
  // モーダル表示
  const modal = document.getElementById('return-modal');
  modal.setAttribute('data-rental-id', rental.id);
  showModal('return-modal');
  
  logDebug(`返却モーダルを表示: ID=${rental.id}, 機材=${rental.equipmentName}`);
  
  // Materializeフォーム更新
  setTimeout(function() {
    M.updateTextFields();
  }, 100);
}

/**
 * 貸出データの保存
 */
function saveRental() {
  try {
    const modal = document.getElementById('rental-modal');
    const equipmentId = modal.getAttribute('data-equipment-id');
    const rentalId = modal.getAttribute('data-rental-id');
    
    // バリデーション
    const startDate = document.getElementById('rental-start').value;
    const endDate = document.getElementById('rental-end').value;
    let site = document.getElementById('rental-project').value;
    const newProject = document.getElementById('new-project').value;
    const quantity = parseInt(document.getElementById('rental-quantity').value);
    
    // 新しい現場名が入力されている場合はそちらを優先
    if (newProject) {
      site = newProject;
    }
    
    if (!startDate || !endDate || !site || isNaN(quantity) || quantity <= 0) {
      alert('すべての必須項目を入力してください。');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      alert('開始日は終了日より前の日付を選択してください。');
      return;
    }
    
    // 対応する機材を検索
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    if (!equipment) {
      console.error('機材が見つかりません:', equipmentId);
      logDebug('機材が見つかりません: ' + equipmentId);
      alert('選択された機材の情報が見つかりません。ページを再読み込みしてください。');
      return;
    }
    
    // 保存中メッセージ表示
    showLoadingMessage('保存中...');
    
    // 既存の貸出データの編集の場合
    if (rentalId) {
      // 貸出データを更新
      const rentalData = {
        id: rentalId,
        equipmentId: equipmentId,
        equipmentName: equipment.name,
        startDate: startDate,
        endDate: endDate,
        quantity: quantity,
        site: site,
        borrower: currentUser.displayName
      };
      
      logDebug('貸出データを更新: ' + JSON.stringify(rentalData));
      
      google.script.run
        .withSuccessHandler(function() {
          hideLoadingMessage();
          showSuccessMessage('貸出情報を更新しました');
          hideModal('rental-modal');
          refreshRentalData();
        })
        .withFailureHandler(function(error) {
          hideLoadingMessage();
          handleError(error);
        })
        .updateRental(rentalData);
    } else {
      // 新規貸出データ
      const rentalData = {
        equipmentId: equipmentId,
        equipmentName: equipment.name,
        startDate: startDate,
        endDate: endDate,
        quantity: quantity,
        site: site,
        borrower: currentUser.displayName
      };
      
      logDebug('新規貸出データを保存: ' + JSON.stringify(rentalData));
      
      google.script.run
        .withSuccessHandler(function() {
          hideLoadingMessage();
          showSuccessMessage('貸出を登録しました');
          hideModal('rental-modal');
          
          // 新しい現場を追加した場合はマスターデータを更新
          if (newProject && !sites.some(site => site.name === newProject)) {
            sites.push({ name: newProject });
            updateProjectSelector();
          }
          
          refreshRentalData();
        })
        .withFailureHandler(function(error) {
          hideLoadingMessage();
          handleError(error);
        })
        .saveRental(rentalData);
    }
  } catch (error) {
    hideLoadingMessage();
    console.error('貸出保存処理エラー:', error);
    logDebug('貸出保存処理エラー: ' + error.message);
    alert(`貸出保存中にエラーが発生しました: ${error.message || error}`);
  }
}

/**
 * 機材返却処理
 */
function returnEquipment() {
  const modal = document.getElementById('return-modal');
  const rentalId = modal.getAttribute('data-rental-id');
  const returnDate = document.getElementById('return-date').value;
  const returnQuantity = parseInt(document.getElementById('return-quantity').value);
  
  if (!returnDate) {
    alert('返却日を選択してください。');
    return;
  }
  
  if (!returnQuantity || returnQuantity <= 0) {
    alert('返却台数を選択してください。');
    return;
  }
  
  // 保存中メッセージ表示
  showLoadingMessage('返却処理中...');
  
  logDebug(`機材返却: ID=${rentalId}, 返却日=${returnDate}, 数量=${returnQuantity}`);
  
  google.script.run
    .withSuccessHandler(function() {
      hideLoadingMessage();
      showSuccessMessage('機材を返却しました');
      hideModal('return-modal');
      refreshRentalData();
    })
    .withFailureHandler(function(error) {
      hideLoadingMessage();
      handleError(error);
    })
    .returnEquipment(rentalId, returnDate, returnQuantity);
}

/**
 * 貸出期間の更新
 */
function updateRentalPeriod(rentalId, startDate, endDate) {
  // 保存中メッセージ表示
  showLoadingMessage('期間更新中...');
  
  logDebug(`貸出期間更新: ID=${rentalId}, 開始=${startDate}, 終了=${endDate}`);
  
  google.script.run
    .withSuccessHandler(function() {
      hideLoadingMessage();
      showSuccessMessage('貸出期間を更新しました');
      refreshRentalData();
    })
    .withFailureHandler(function(error) {
      hideLoadingMessage();
      handleError(error);
    })
    .updateRentalPeriod(rentalId, startDate, endDate);
}

/**
 * 現場リストを更新
 */
function loadProjectsList() {
  const projectsList = document.getElementById('projects-list');
  if (!projectsList) return;
  
  // リストをクリア
  projectsList.innerHTML = '';
  
  // 現場リストがない場合
  if (!sites || sites.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="2" class="center-align">現場データがありません</td>';
    projectsList.appendChild(emptyRow);
    return;
  }
  
  // 現場リストを表示
  sites.forEach((site, index) => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td><input type="checkbox" id="site-${index}" class="site-checkbox" data-site-name="${site.name}" />
          <label for="site-${index}"></label></td>
      <td>${site.name}</td>
    `;
    
    projectsList.appendChild(row);
  });
  
  logDebug('現場リストを更新しました: ' + sites.length + '件');
}

/**
 * 現場追加処理
 */
function addProject() {
  const projectNameInput = document.getElementById('new-project-name');
  if (!projectNameInput) return;
  
  const projectName = projectNameInput.value.trim();
  if (!projectName) {
    alert('現場名を入力してください');
    return;
  }
  
  // 既存の現場名と重複チェック
  if (sites.some(site => site.name === projectName)) {
    alert('同じ名前の現場が既に存在します');
    return;
  }
  
  // ボタンの状態を変更して多重送信を防止
  const addButton = document.getElementById('add-project-btn');
  if (addButton) {
    addButton.disabled = true;
    addButton.innerHTML = '<i class="material-icons left">hourglass_empty</i>追加中...';
  }
  
  showLoadingMessage('現場を追加中...');
  
  // タイムアウト設定 (15秒後に強制的にUIを復帰 - 短めに設定)
  const timeout = setTimeout(() => {
    if (addButton) {
      addButton.disabled = false;
      addButton.innerHTML = '<i class="material-icons left">add</i>追加';
    }
    hideLoadingMessage();
    showUpdateMessage('応答がありません。ネットワーク接続を確認してください。', 'error');
    logDebug('現場追加処理がタイムアウトしました');
  }, 15000);
  
  // サーバーに現場追加リクエスト - withUserObject を使用して状態を維持
  google.script.run
    .withUserObject({
      button: addButton,
      input: projectNameInput,
      timeout: timeout
    })
    .withSuccessHandler(function(result, userObject) {
      // タイムアウトをクリア
      clearTimeout(userObject.timeout);
      
      // ボタンを元に戻す
      if (userObject.button) {
        userObject.button.disabled = false;
        userObject.button.innerHTML = '<i class="material-icons left">add</i>追加';
      }
      
      hideLoadingMessage();
      
      if (result && result.success) {
        // 現場リストを更新
        sites.push({ name: result.siteName || projectName });
        
        // 現場セレクタを更新
        updateProjectSelector();
        
        // 現場リストを再表示
        loadProjectsList();
        
        // 入力フィールドをクリア
        userObject.input.value = '';
        
        showSuccessMessage('現場を追加しました');
        logDebug('現場追加成功: ' + (result.siteName || projectName));
      } else {
        handleError(result && result.error ? result.error : '現場の追加に失敗しました');
      }
    })
    .withFailureHandler(function(error, userObject) {
      // タイムアウトをクリア
      clearTimeout(userObject.timeout);
      
      // ボタンを元に戻す
      if (userObject.button) {
        userObject.button.disabled = false;
        userObject.button.innerHTML = '<i class="material-icons left">add</i>追加';
      }
      
      hideLoadingMessage();
      handleError(error);
      logDebug('現場追加エラー: ' + (error.message || error));
    })
    .addSite(projectName);
}

/**
 * 選択された現場の削除
 */
function deleteSelectedProjects() {
  const checkboxes = document.querySelectorAll('.site-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('削除する現場を選択してください');
    return;
  }
  
  if (!confirm(`選択された ${checkboxes.length} 件の現場を削除しますか？`)) {
    return;
  }
  
  const siteNames = Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-site-name'));
  
  // ボタンの状態を変更
  const deleteButton = document.getElementById('delete-projects-btn');
  if (deleteButton) {
    deleteButton.disabled = true;
    deleteButton.innerHTML = '<i class="material-icons left">hourglass_empty</i>削除中...';
  }
  
  showLoadingMessage('現場を削除中...');
  
  // タイムアウト設定 (15秒後に強制的にUIを復帰 - 短めに設定)
  const timeout = setTimeout(() => {
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.innerHTML = '<i class="material-icons left">delete</i>選択した現場を削除';
    }
    hideLoadingMessage();
    showUpdateMessage('応答がありません。ネットワーク接続を確認してください。', 'error');
    logDebug('現場削除処理がタイムアウトしました');
  }, 15000);
  
  // サーバーに現場削除リクエスト - withUserObject を使用して状態を維持
  google.script.run
    .withUserObject({
      button: deleteButton,
      timeout: timeout,
      siteNames: siteNames
    })
    .withSuccessHandler(function(result, userObject) {
      // タイムアウトをクリア
      clearTimeout(userObject.timeout);
      
      // ボタンを元に戻す
      if (userObject.button) {
        userObject.button.disabled = false;
        userObject.button.innerHTML = '<i class="material-icons left">delete</i>選択した現場を削除';
      }
      
      hideLoadingMessage();
      
      if (result && result.success) {
        // 現場リストから削除
        userObject.siteNames.forEach(siteName => {
          const index = sites.findIndex(site => site.name === siteName);
          if (index !== -1) {
            sites.splice(index, 1);
          }
        });
        
        // 現場セレクタを更新
        updateProjectSelector();
        
        // 現場リストを再表示
        loadProjectsList();
        
        showSuccessMessage(`${userObject.siteNames.length}件の現場を削除しました`);
        logDebug('現場削除成功: ' + userObject.siteNames.length + '件');
      } else {
        handleError(result && result.error ? result.error : '現場の削除に失敗しました');
      }
    })
    .withFailureHandler(function(error, userObject) {
      // タイムアウトをクリア
      clearTimeout(userObject.timeout);
      
      // ボタンを元に戻す
      if (userObject.button) {
        userObject.button.disabled = false;
        userObject.button.innerHTML = '<i class="material-icons left">delete</i>選択した現場を削除';
      }
      
      hideLoadingMessage();
      handleError(error);
      logDebug('現場削除エラー: ' + (error.message || error));
    })
    .deleteSites(siteNames);
}

/**
 * 機器追加処理
 */
function addEquipment() {
  // 必須フィールドの取得
  const nameInput = document.getElementById('new-equipment-name');
  const quantityInput = document.getElementById('new-equipment-quantity');
  
  if (!nameInput || !quantityInput) return;
  
  const name = nameInput.value.trim();
  const quantity = parseInt(quantityInput.value);
  
  // バリデーション
  if (!name) {
    alert('機器名称を入力してください');
    return;
  }
  
  if (isNaN(quantity) || quantity <= 0) {
    alert('有効な総台数を入力してください');
    return;
  }
  
  // その他のフィールド
  const specification = document.getElementById('new-equipment-spec').value.trim();
  const model = document.getElementById('new-equipment-model').value.trim();
  const manufacturer = document.getElementById('new-equipment-maker').value.trim();
  const serialNumber = document.getElementById('new-equipment-serial').value.trim();
  const alias = document.getElementById('new-equipment-alias').value.trim();
  const location = document.getElementById('new-equipment-location').value;
  const note1 = document.getElementById('new-equipment-note1').value.trim();
  const note2 = document.getElementById('new-equipment-note2').value.trim();
  
  // 機器データの作成
  const equipmentData = {
    name: name,
    totalQuantity: quantity,
    specification: specification,
    model: model,
    manufacturer: manufacturer,
    serialNumber: serialNumber,
    alias: alias,
    location: location,
    note1: note1,
    note2: note2
  };
  
  showLoadingMessage('機器を追加中...');
  
  // サーバーに機器追加リクエスト
  google.script.run
    .withSuccessHandler(function(result) {
      hideLoadingMessage();
      
      if (result && result.success) {
        // 機材リストを再読み込み
        refreshEquipmentList();
        
        // 入力フィールドをクリア
        clearEquipmentForm();
        
        showSuccessMessage('機器を追加しました');
      } else {
        handleError(result.error || '機器の追加に失敗しました');
      }
    })
    .withFailureHandler(function(error) {
      hideLoadingMessage();
      handleError(error);
    })
    .addEquipment(equipmentData);
}

/**
 * 機器フォームをクリア
 */
function clearEquipmentForm() {
  document.getElementById('new-equipment-name').value = '';
  document.getElementById('new-equipment-spec').value = '';
  document.getElementById('new-equipment-model').value = '';
  document.getElementById('new-equipment-maker').value = '';
  document.getElementById('new-equipment-serial').value = '';
  document.getElementById('new-equipment-quantity').value = '';
  document.getElementById('new-equipment-alias').value = '';
  document.getElementById('new-equipment-location').value = '';
  document.getElementById('new-equipment-note1').value = '';
  document.getElementById('new-equipment-note2').value = '';
  
  // ラベルを再アクティブ化
  if (typeof M !== 'undefined' && M.updateTextFields) {
    M.updateTextFields();
  }
}

/**
 * 選択された機器の削除
 */
function deleteSelectedEquipment() {
  const checkboxes = document.querySelectorAll('.equipment-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('削除する機器を選択してください');
    return;
  }
  
  if (!confirm(`選択された ${checkboxes.length} 件の機器を削除しますか？`)) {
    return;
  }
  
  const equipmentIds = Array.from(checkboxes).map(checkbox => {
    const id = checkbox.id.replace('eq-', '');
    return id;
  });
  
  showLoadingMessage('機器を削除中...');
  
  // サーバーに機器削除リクエスト
  google.script.run
    .withSuccessHandler(function(result) {
      hideLoadingMessage();
      
      if (result && result.success) {
        // 機材リストを再読み込み
        refreshEquipmentList();
        
        showSuccessMessage(`${equipmentIds.length}件の機器を削除しました`);
      } else {
        handleError(result.error || '機器の削除に失敗しました');
      }
    })
    .withFailureHandler(function(error) {
      hideLoadingMessage();
      handleError(error);
    })
    .deleteEquipment(equipmentIds);
}