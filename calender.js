/**
 * 機材貸出管理システム
 * カレンダーと貸出バー表示の中核機能
 */

// グローバル変数
let currentStartDate = null;    // 表示開始日
let currentEndDate = null;      // 表示終了日
let selectedEquipmentId = null; // 選択された機材ID
const CELL_WIDTH = 80;          // カレンダーセルの幅（ピクセル）
const DISPLAY_DAYS = 28;        // 表示する日数

/**
 * カレンダーの初期化
 */
function initializeCalendar() {
  logDebug('カレンダー初期化を開始');
  
  // 日付の初期設定（今日から28日間）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  currentStartDate = new Date(today);
  
  // 終了日は開始日+表示日数-1
  currentEndDate = new Date(today);
  currentEndDate.setDate(today.getDate() + DISPLAY_DAYS - 1);
  
  // ナビゲーションボタンのイベントリスナー設定
  setupCalendarNav();
  
  logDebug('カレンダー初期化完了');
}

/**
 * カレンダーナビゲーションの設定
 */
function setupCalendarNav() {
  // 前へボタン
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      navigateCalendar('prev');
    });
  }
  
  // 次へボタン
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      navigateCalendar('next');
    });
  }
  
  // 今日ボタン
  const todayBtn = document.getElementById('view-today');
  if (todayBtn) {
    todayBtn.addEventListener('click', function() {
      goToToday();
    });
  }
  
  logDebug('カレンダーナビゲーションを設定しました');
}

/**
 * カレンダーの描画
 */
function renderCalendar() {
  logDebug('カレンダー描画を開始します');
  
  // カレンダーのコンテナを取得
  const dateHeaderContainer = document.getElementById('date-header-container');
  const equipmentListContainer = document.getElementById('equipment-list');
  const calendarContainer = document.getElementById('calendar-container');
  
  if (!dateHeaderContainer || !equipmentListContainer || !calendarContainer) {
    console.error('カレンダーコンテナが見つかりません');
    logDebug('カレンダーコンテナが見つかりません');
    return;
  }
  
  // コンテナをクリア
  dateHeaderContainer.innerHTML = '';
  equipmentListContainer.innerHTML = '';
  calendarContainer.innerHTML = '';
  
  // 機材リストがない場合は何も表示しない
  if (!equipmentList || equipmentList.length === 0) {
    logDebug('機材リストが空のため、カレンダーを描画しません');
    // メッセージを表示
    const noDataMessage = document.createElement('div');
    noDataMessage.className = 'no-data-message';
    noDataMessage.textContent = '機材データがありません。機器マスター管理から機材を追加してください。';
    calendarContainer.appendChild(noDataMessage);
    return;
  }
  
  logDebug(`カレンダー期間: ${formatDate(currentStartDate)} から ${DISPLAY_DAYS}日間`);
  
  // 日付ヘッダーを追加
  for (let i = 0; i < DISPLAY_DAYS; i++) {
    const date = new Date(currentStartDate);
    date.setDate(date.getDate() + i);
    
    const dateCell = document.createElement('div');
    dateCell.className = 'date-cell';
    
    // 土日や今日の日付にクラスを追加
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      dateCell.classList.add('sunday');
    } else if (dayOfWeek === 6) {
      dateCell.classList.add('saturday');
    }
    
    // 今日の日付を強調
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) {
      dateCell.classList.add('today');
    }
    
    // 日付表示のフォーマット
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    dateCell.textContent = `${date.getMonth() + 1}/${date.getDate()}(${weekdays[dayOfWeek]})`;
    dateCell.setAttribute('data-date', formatDate(date));
    
    dateHeaderContainer.appendChild(dateCell);
  }
  
  // 表示する機材のフィルタリング
  let displayEquipmentList = [...equipmentList]; // コピーを作成
  
  // 機材が選択されている場合はフィルタリング
  if (selectedEquipmentId) {
    displayEquipmentList = equipmentList.filter(equipment => 
      equipment.id === selectedEquipmentId
    );
    logDebug(`機材フィルター適用: ${selectedEquipmentId}, 表示件数=${displayEquipmentList.length}`);
  }
  
  // 機材リストとカレンダー行を生成
  displayEquipmentList.forEach(equipment => {
    // 機材情報を左側のリストに追加
    const equipmentItem = document.createElement('div');
    equipmentItem.className = 'equipment-item';
    equipmentItem.setAttribute('data-equipment-id', equipment.id);
    
    // 機材の詳細情報を3行表示に変更
    equipmentItem.innerHTML = `
      <div class="equipment-info-layout">
        <div class="equipment-name">${equipment.name}</div>
        <div class="equipment-spec-model">
          <span class="equipment-total">${equipment.totalQuantity || 0}台</span>
          ${equipment.alias ? `/ ${equipment.alias}` : ''}
        </div>
        <div class="equipment-details">
          ${equipment.specification || ''} ${equipment.model || ''}
        </div>
        <div class="equipment-notes">
          ${equipment.note1 || ''} ${equipment.note2 || ''}
        </div>
      </div>
    `;
    
    equipmentListContainer.appendChild(equipmentItem);
    
    // カレンダー行を作成
    const calendarRow = document.createElement('div');
    calendarRow.className = 'calendar-row';
    calendarRow.setAttribute('data-equipment-id', equipment.id);
    
    // 日付分のセルを生成
    for (let i = 0; i < DISPLAY_DAYS; i++) {
      const date = new Date(currentStartDate);
      date.setDate(date.getDate() + i);
      
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      dayCell.setAttribute('data-date', formatDate(date));
      dayCell.setAttribute('data-equipment-id', equipment.id);
      
      // 土日や今日の日付にクラスを追加
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0) {
        dayCell.classList.add('sunday');
      } else if (dayOfWeek === 6) {
        dayCell.classList.add('saturday');
      }
      
      // 今日の日付を強調
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date.getTime() === today.getTime()) {
        dayCell.classList.add('today');
      }
      
      calendarRow.appendChild(dayCell);
    }
    
    calendarContainer.appendChild(calendarRow);
  });
  
  // 貸出バーを描画
  renderRentalBars();
  
  // ドラッグ選択機能を設定
  setupDragSelection();
  
  // カレンダーの高さを調整
  adjustCalendarHeight();
  
  // スクロール同期を設定
  setupScrollSynchronization();
  
  logDebug('カレンダー描画完了');
}

/**
 * スクロール同期の設定
 */
function setupScrollSynchronization() {
  // 日付ヘッダーとカレンダーのX軸同期
  const dateHeaderContainer = document.getElementById('date-header-container');
  const calendarContainer = document.getElementById('calendar-container');
  
  if (dateHeaderContainer && calendarContainer) {
    // カレンダーがスクロールされたら日付ヘッダーも連動させる
    calendarContainer.addEventListener('scroll', function() {
      dateHeaderContainer.scrollLeft = this.scrollLeft;
    });
    
    // 日付ヘッダーがスクロールされたらカレンダーも連動させる
    dateHeaderContainer.addEventListener('scroll', function() {
      calendarContainer.scrollLeft = this.scrollLeft;
    });
  }
  
  // 機材リストとカレンダーのY軸同期
  const equipmentList = document.getElementById('equipment-list');
  
  if (equipmentList && calendarContainer) {
    // カレンダーが縦スクロールされたら機材リストも連動させる
    calendarContainer.addEventListener('scroll', function() {
      equipmentList.scrollTop = this.scrollTop;
    });
    
    // 機材リストが縦スクロールされたらカレンダーも連動させる
    equipmentList.addEventListener('scroll', function() {
      calendarContainer.scrollTop = this.scrollTop;
    });
  }
}

/**
 * カレンダー表示の高さを調整
 */
function adjustCalendarHeight() {
  const container = document.querySelector('.gantt-container');
  if (container) {
    const viewportHeight = window.innerHeight;
    const containerRect = container.getBoundingClientRect();
    const topOffset = containerRect.top;
    const bottomMargin = 50; // 下部の余白
    
    const newHeight = Math.max(400, viewportHeight - topOffset - bottomMargin);
    container.style.height = `${newHeight}px`;
    
    logDebug(`カレンダー高さを調整: ${newHeight}px`);
  }
}

/**
 * 貸出バーを描画
 */
function renderRentalBars() {
  // アクティブな貸出データを抽出
  if (!rentalData || !Array.isArray(rentalData)) {
    logDebug('有効な貸出データがありません');
    return;
  }
  
  const activeRentals = rentalData.filter(rental => rental.status === 'active');
  
  if (activeRentals.length === 0) {
    logDebug('表示する貸出データがありません');
    return;
  }
  
  logDebug(`アクティブな貸出: ${activeRentals.length}件を描画します`);
  
  // 貸出バーを描画
  activeRentals.forEach(rental => {
    try {
      // 選択機材フィルターが適用されていて、選択されていない機材の場合はスキップ
      if (selectedEquipmentId && rental.equipmentId !== selectedEquipmentId) {
        return;
      }
      
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      
      // 表示期間内かチェック（一部でも重なっていれば表示）
      if (endDate < currentStartDate || startDate > currentEndDate) {
        return; // 表示期間外
      }
      
      // 該当する機材の行を検索
      const calendarRow = document.querySelector(`.calendar-row[data-equipment-id="${rental.equipmentId}"]`);
      if (!calendarRow) {
        logDebug(`機材ID: ${rental.equipmentId}の行が見つかりません`);
        return;
      }
      
      // 開始日からの日数とオフセットを計算
      let startDayOffset = Math.floor((startDate - currentStartDate) / (24 * 60 * 60 * 1000));
      startDayOffset = Math.max(0, startDayOffset); // 負の値は0に
      
      // 表示期間内の終了日を計算
      const displayEndDate = new Date(Math.min(endDate.getTime(), currentEndDate.getTime()));
      const durationDays = Math.ceil((displayEndDate - Math.max(startDate, currentStartDate)) / (24 * 60 * 60 * 1000)) + 1;
      
      // 貸出バーの作成
      const rentalBar = document.createElement('div');
      rentalBar.className = 'rental-bar';
      rentalBar.setAttribute('data-rental-id', rental.id);
      rentalBar.setAttribute('data-equipment-id', rental.equipmentId);
      rentalBar.setAttribute('data-start-date', formatDate(startDate));
      rentalBar.setAttribute('data-end-date', formatDate(endDate));
      
      // バーの位置とサイズを設定
      rentalBar.style.left = `${startDayOffset * CELL_WIDTH}px`;
      rentalBar.style.width = `${durationDays * CELL_WIDTH - 6}px`;
      
      // 貸出情報を表示
      rentalBar.innerHTML = `
        <div class="rental-title">${rental.site || '不明'} - ${rental.quantity || 1}台</div>
        <div class="rental-detail">${rental.borrower || ''}</div>
        <div class="rental-actions">
          <i class="material-icons rental-action-icon edit-rental">edit</i>
          <i class="material-icons rental-action-icon return-rental">undo</i>
        </div>
      `;
      
      // 左右のリサイズハンドルを追加
      const leftHandle = document.createElement('div');
      leftHandle.className = 'resize-handle left-handle';
      
      const rightHandle = document.createElement('div');
      rightHandle.className = 'resize-handle right-handle';
      
      rentalBar.appendChild(leftHandle);
      rentalBar.appendChild(rightHandle);
      
      // 貸出バーのイベント設定
      setupRentalBarEvents(rentalBar, leftHandle, rightHandle, rental);
      
      // 貸出バーを行に追加
      calendarRow.appendChild(rentalBar);
      
      logDebug(`貸出バー描画: ID=${rental.id}, 機材=${rental.equipmentId}, 開始オフセット=${startDayOffset}, 期間=${durationDays}日`);
      
    } catch (error) {
      console.error(`貸出バー描画エラー: ID=${rental.id}`, error);
      logDebug(`貸出バー描画エラー: ID=${rental.id}, ${error.message}`);
    }
  });
  
  logDebug('貸出バーの描画が完了しました');
}

/**
 * 貸出バーのイベント設定
 */
function setupRentalBarEvents(bar, leftHandle, rightHandle, rental) {
  // クリックイベント
  bar.addEventListener('click', function(e) {
    // リサイズハンドルのクリックは無視
    if (e.target.classList.contains('resize-handle')) {
      e.stopPropagation();
      return;
    }
    
    // アイコンクリック処理
    if (e.target.classList.contains('edit-rental')) {
      e.stopPropagation();
      showEditRentalModal(rental);
      return;
    }
    
    if (e.target.classList.contains('return-rental')) {
      e.stopPropagation();
      showReturnModal(rental);
      return;
    }
    
    // 通常クリックは編集モーダル表示
    showEditRentalModal(rental);
  });
  
  // ドラッグ機能
  makeRentalBarDraggable(bar);
  
  // リサイズ機能
  makeRentalBarResizable(bar, leftHandle, rightHandle);
}

/**
 * 貸出バーをドラッグ可能にする
 */
function makeRentalBarDraggable(bar) {
  let isDragging = false;
  let startX, startLeft;
  let originalStartDate, originalEndDate;
  
  // マウスイベント
  bar.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  
  // タッチイベント（モバイル対応）
  bar.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    startDrag({ clientX: touch.clientX, preventDefault: () => e.preventDefault(), target: e.target });
  });
  
  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    drag({ clientX: touch.clientX, preventDefault: () => e.preventDefault() });
  });
  
  document.addEventListener('touchend', endDrag);
  
  function startDrag(e) {
    // リサイズハンドルやアクションアイコンがクリックされた場合はドラッグを開始しない
    if (e.target.classList.contains('resize-handle') || 
        e.target.classList.contains('rental-action-icon')) {
      return;
    }
    
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startLeft = parseInt(bar.style.left) || 0;
    
    // 元の日付を保存
    originalStartDate = bar.getAttribute('data-start-date');
    originalEndDate = bar.getAttribute('data-end-date');
    
    bar.classList.add('dragging');
  }
  
  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const newLeft = startLeft + deltaX;
    
    // 左端のバウンダリーチェック
    if (newLeft < 0) return;
    
    // グリッドにスナップするように調整
    const cellOffset = Math.round(newLeft / CELL_WIDTH);
    const snappedLeft = cellOffset * CELL_WIDTH;
    
    bar.style.left = `${snappedLeft}px`;
    
    // 新しい日付を計算
    const startDateObj = new Date(originalStartDate);
    const endDateObj = new Date(originalEndDate);
    const duration = Math.round((endDateObj - startDateObj) / (24 * 60 * 60 * 1000));
    
    const newStartDate = new Date(currentStartDate);
    newStartDate.setDate(currentStartDate.getDate() + cellOffset);
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + duration);
    
    // 日付属性を更新
    bar.setAttribute('data-start-date', formatDate(newStartDate));
    bar.setAttribute('data-end-date', formatDate(newEndDate));
  }
  
  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    
    bar.classList.remove('dragging');
    
    // サーバーに日付変更を保存
    const rentalId = bar.getAttribute('data-rental-id');
    const newStartDate = bar.getAttribute('data-start-date');
    const newEndDate = bar.getAttribute('data-end-date');
    
    if (rentalId && newStartDate && newEndDate && 
        (newStartDate !== originalStartDate || newEndDate !== originalEndDate)) {
      updateRentalPeriod(parseInt(rentalId), newStartDate, newEndDate);
    }
  }
}

/**
 * 貸出バーをリサイズ可能にする
 */
function makeRentalBarResizable(bar, leftHandle, rightHandle) {
  let isResizing = false;
  let startX, startWidth, startLeft;
  let resizeType; // 'left' or 'right'
  let originalStartDate, originalEndDate;
  
  // 左ハンドルのリサイズ機能
  leftHandle.addEventListener('mousedown', function(e) {
    startResizing(e, 'left');
  });
  
  leftHandle.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    startResizing({ clientX: touch.clientX, preventDefault: () => e.preventDefault() }, 'left');
  });
  
  // 右ハンドルのリサイズ機能
  rightHandle.addEventListener('mousedown', function(e) {
    startResizing(e, 'right');
  });
  
  rightHandle.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    startResizing({ clientX: touch.clientX, preventDefault: () => e.preventDefault() }, 'right');
  });
  
  document.addEventListener('mousemove', resize);
  document.addEventListener('touchmove', function(e) {
    if (!isResizing) return;
    const touch = e.touches[0];
    resize({ clientX: touch.clientX, preventDefault: () => e.preventDefault() });
  });
  
  document.addEventListener('mouseup', endResize);
  document.addEventListener('touchend', endResize);
  
  function startResizing(e, type) {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    resizeType = type;
    startX = e.clientX;
    startWidth = parseInt(bar.offsetWidth);
    startLeft = parseInt(bar.style.left) || 0;
    
    // 元の日付を保存
    originalStartDate = bar.getAttribute('data-start-date');
    originalEndDate = bar.getAttribute('data-end-date');
    
    bar.classList.add('resizing');
  }
  
  function resize(e) {
    if (!isResizing) return;
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    
    if (resizeType === 'right') {
      // 右側のリサイズ
      let newWidth = startWidth + deltaX;
      
      // 最小幅を確保
      if (newWidth < CELL_WIDTH) {
        newWidth = CELL_WIDTH;
      }
      
      // グリッドにスナップするように調整
      const cellCount = Math.round(newWidth / CELL_WIDTH);
      const snappedWidth = cellCount * CELL_WIDTH - 6; // マージン調整
      
      bar.style.width = `${snappedWidth}px`;
      
      // 新しい終了日を計算
      const startDateObj = new Date(originalStartDate);
      const newEndDate = new Date(startDateObj);
      newEndDate.setDate(startDateObj.getDate() + cellCount - 1);
      
      // 日付属性を更新
      bar.setAttribute('data-end-date', formatDate(newEndDate));
      
    } else if (resizeType === 'left') {
      // 左側のリサイズ
      let newLeft = startLeft + deltaX;
      let newWidth = startWidth - deltaX;
      
      // 左端のバウンダリーチェック
      if (newLeft < 0) {
        newLeft = 0;
        newWidth = startWidth + startLeft;
      }
      
      // 最小幅を確保
      if (newWidth < CELL_WIDTH) {
        newWidth = CELL_WIDTH;
        newLeft = startLeft + startWidth - CELL_WIDTH;
      }
      
      // グリッドにスナップするように調整
      const cellLeftOffset = Math.round(newLeft / CELL_WIDTH);
      const snappedLeft = cellLeftOffset * CELL_WIDTH;
      
      const cellWidthOffset = Math.round(newWidth / CELL_WIDTH);
      const snappedWidth = cellWidthOffset * CELL_WIDTH - 6; // マージン調整
      
      bar.style.left = `${snappedLeft}px`;
      bar.style.width = `${snappedWidth}px`;
      
      // 新しい開始日を計算
      const newStartDate = new Date(currentStartDate);
      newStartDate.setDate(currentStartDate.getDate() + cellLeftOffset);
      
      // 日付属性を更新
      bar.setAttribute('data-start-date', formatDate(newStartDate));
    }
  }
  
  function endResize() {
    if (!isResizing) return;
    isResizing = false;
    
    bar.classList.remove('resizing');
    
    // サーバーに日付変更を保存
    const rentalId = bar.getAttribute('data-rental-id');
    const newStartDate = bar.getAttribute('data-start-date');
    const newEndDate = bar.getAttribute('data-end-date');
    
    if (rentalId && newStartDate && newEndDate && 
        (newStartDate !== originalStartDate || newEndDate !== originalEndDate)) {
      updateRentalPeriod(parseInt(rentalId), newStartDate, newEndDate);
    }
  }
}

/**
 * ドラッグ選択機能の設定
 */
function setupDragSelection() {
  const calendarContainer = document.getElementById('calendar-container');
  if (!calendarContainer) return;
  
  let isDragging = false;
  let startCell = null;
  let endCell = null;
  let dragEquipmentId = null;
  
  // マウスダウンイベント
  calendarContainer.addEventListener('mousedown', function(e) {
    // 日付セルのみを対象とする
    const cell = e.target.closest('.calendar-day');
    if (!cell) return;
    
    e.preventDefault();
    isDragging = true;
    startCell = cell;
    dragEquipmentId = cell.getAttribute('data-equipment-id');
    
    // ハイライト初期化
    resetHighlight();
    highlightCell(cell);
  });
  
  // マウス移動イベント
  calendarContainer.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const cell = e.target.closest('.calendar-day');
    if (!cell) return;
    
    // 同じ機材行のセルのみ対象とする
    const cellEquipmentId = cell.getAttribute('data-equipment-id');
    if (cellEquipmentId !== dragEquipmentId) return;
    
    endCell = cell;
    updateHighlight();
  });
  
  // マウスアップイベント
  document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    // ドラッグ選択が有効な場合、モーダルを表示
    if (startCell && endCell) {
      const startDate = startCell.getAttribute('data-date');
      const endDate = endCell.getAttribute('data-date');
      
      // 開始日と終了日を調整（開始日が終了日より後の場合は入れ替え）
      const adjustedStartDate = new Date(startDate) < new Date(endDate) ? startDate : endDate;
      const adjustedEndDate = new Date(startDate) < new Date(endDate) ? endDate : startDate;
      
      // 機材情報を取得
      const equipment = equipmentList.find(eq => eq.id === dragEquipmentId);
      if (equipment) {
        logDebug(`ドラッグ選択完了: ${equipment.name}, 期間=${adjustedStartDate}~${adjustedEndDate}`);
        
        // 貸出モーダルを表示
        showRentalModal(equipment, adjustedStartDate, adjustedEndDate);
      }
    }
    
    resetHighlight();
    startCell = null;
    endCell = null;
    dragEquipmentId = null;
  });
  
  // タッチイベント対応
  calendarContainer.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    
    const cell = element.closest('.calendar-day');
    if (!cell) return;
    
    e.preventDefault();
    isDragging = true;
    startCell = cell;
    dragEquipmentId = cell.getAttribute('data-equipment-id');
    
    resetHighlight();
    highlightCell(cell);
  });
  
  calendarContainer.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    
    const cell = element.closest('.calendar-day');
    if (!cell) return;
    
    const cellEquipmentId = cell.getAttribute('data-equipment-id');
    if (cellEquipmentId !== dragEquipmentId) return;
    
    endCell = cell;
    updateHighlight();
  });
  
  calendarContainer.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    if (startCell && endCell) {
      const startDate = startCell.getAttribute('data-date');
      const endDate = endCell.getAttribute('data-date');
      
      // 開始日と終了日を調整（開始日が終了日より後の場合は入れ替え）
      const adjustedStartDate = new Date(startDate) < new Date(endDate) ? startDate : endDate;
      const adjustedEndDate = new Date(startDate) < new Date(endDate) ? endDate : startDate;
      
      // 機材情報を取得
      const equipment = equipmentList.find(eq => eq.id === dragEquipmentId);
      if (equipment) {
        logDebug(`タッチドラッグ選択完了: ${equipment.name}, 期間=${adjustedStartDate}~${adjustedEndDate}`);
        
        // 貸出モーダルを表示
        showRentalModal(equipment, adjustedStartDate, adjustedEndDate);
      }
    }
    
    resetHighlight();
    startCell = null;
    endCell = null;
    dragEquipmentId = null;
  });
  
  // ハイライトをリセット
  function resetHighlight() {
    const highlightedCells = document.querySelectorAll('.calendar-day.drag-highlight');
    highlightedCells.forEach(cell => {
      cell.classList.remove('drag-highlight');
    });
  }
  
  // セルをハイライト
  function highlightCell(cell) {
    if (cell) {
      cell.classList.add('drag-highlight');
    }
  }
  
  // ハイライトの更新
  function updateHighlight() {
    resetHighlight();
    
    if (!startCell || !endCell) return;
    
    // 開始日と終了日の取得
    const startDate = new Date(startCell.getAttribute('data-date'));
    const endDate = new Date(endCell.getAttribute('data-date'));
    
    // 開始日と終了日の調整（開始日が終了日より後の場合は入れ替え）
    const minDate = startDate < endDate ? startDate : endDate;
    const maxDate = startDate < endDate ? endDate : startDate;
    
    // 該当する機材行のすべてのセル
    const row = startCell.parentElement;
    const cells = row.querySelectorAll('.calendar-day');
    
    // 日付範囲内のセルをハイライト
    cells.forEach(cell => {
      const cellDate = new Date(cell.getAttribute('data-date'));
      if (cellDate >= minDate && cellDate <= maxDate) {
        highlightCell(cell);
      }
    });
  }
}

/**
 * カレンダーのナビゲーション処理
 */
function navigateCalendar(direction) {
  // カレンダーのナビゲーションを1週間単位に変更
  const dayDiff = direction === 'prev' ? -7 : 7;
  
  // 新しい開始日と終了日を計算
  const newStartDate = new Date(currentStartDate);
  newStartDate.setDate(newStartDate.getDate() + dayDiff);
  
  const newEndDate = new Date(newStartDate);
  newEndDate.setDate(newStartDate.getDate() + DISPLAY_DAYS - 1);
  
  // 日付を更新
  currentStartDate = newStartDate;
  currentEndDate = newEndDate;
  
  // カレンダーを再描画
  renderCalendar();
  
  logDebug(`カレンダーをナビゲート: ${direction}, 新開始日: ${formatDate(currentStartDate)}`);
}

/**
 * 今日の日付に移動
 */
function goToToday() {
  // 今日の日付を開始日に設定
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  currentStartDate = today;
  
  // 終了日も更新
  currentEndDate = new Date(today);
  currentEndDate.setDate(today.getDate() + DISPLAY_DAYS - 1);
  
  // カレンダーを再描画
  renderCalendar();
  
  // スクロールを調整（左端に戻す）
  resetScroll();
  
  logDebug(`今日の日付に移動: ${formatDate(today)}`);
}

/**
 * 指定した日付に移動
 */
function goToDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      logDebug('無効な日付形式です: ' + dateStr);
      return;
    }
    
    date.setHours(0, 0, 0, 0);
    currentStartDate = date;
    
    // 終了日も更新
    currentEndDate = new Date(date);
    currentEndDate.setDate(date.getDate() + DISPLAY_DAYS - 1);
    
    // カレンダーを再描画
    renderCalendar();
    
    // スクロールを調整（左端に戻す）
    resetScroll();
    
    logDebug(`指定日に移動: ${formatDate(date)}`);
  } catch (error) {
    console.error('日付移動エラー:', error);
    logDebug('日付移動エラー: ' + error.message);
  }
}

/**
 * スクロール位置をリセット
 */
function resetScroll() {
  const dateHeaderContainer = document.getElementById('date-header-container');
  const calendarContainer = document.getElementById('calendar-container');
  
  if (dateHeaderContainer) {
    dateHeaderContainer.scrollLeft = 0;
  }
  
  if (calendarContainer) {
    calendarContainer.scrollLeft = 0;
  }
}

/**
 * 貸出データを再描画（貸出バーのみ更新）
 */
function refreshRentalBars() {
  // 既存の貸出バーをすべて削除
  const rentalBars = document.querySelectorAll('.rental-bar');
  rentalBars.forEach(bar => {
    bar.remove();
  });
  
  // 貸出バーを再描画
  renderRentalBars();
  
  logDebug('貸出バーを再描画しました');
}