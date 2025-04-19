/**
 * @OnlyCurrentDoc
 */

// --- グローバル変数 ---
/** @type {GoogleAppsScript.Spreadsheet.Spreadsheet} */
let ss;
/** @type {GoogleAppsScript.Spreadsheet.Sheet} */
let equipmentSheet;
/** @type {GoogleAppsScript.Spreadsheet.Sheet} */
let rentalHistorySheet;
/** @type {GoogleAppsScript.Spreadsheet.Sheet} */
let locationMasterSheet;
/** @type {GoogleAppsScript.Spreadsheet.Sheet} */
let siteMasterSheet;
/** @type {GoogleAppsScript.Spreadsheet.Sheet} */
let userMasterSheet;
/** @type {GoogleAppsScript.Spreadsheet.Sheet} */
let backupSheet;

// --- 定数 ---
// ★ スクリプトプロパティのキー名 (ここで一度だけ宣言)
const SPREADSHEET_ID_PROPERTY = 'SPREADSHEET_ID';

// --- シート名 ---
const SHEET_NAMES = {
  EQUIPMENT: '機器リスト',
  RENTAL_HISTORY: '貸出履歴',
  LOCATION_MASTER: '置場マスター',
  SITE_MASTER: '現場マスター',
  USER_MASTER: 'ユーザーマスター',
  BACKUP: '機器バックアップ'
};

// --- 列インデックス (0始まり) ---
const COL_INDEX = {
  EQUIPMENT: { ID: 0, NAME: 1, SPEC: 2, MODEL: 3, MAKER: 4, SERIAL: 5, TOTAL: 6, UNIT: 7, LOCATION: 8, NOTE1: 9, NOTE2: 10 },
  RENTAL_HISTORY: { EQUIPMENT_ID: 0, EQUIPMENT_NAME: 1, START_DATE: 2, END_DATE: 3, QUANTITY: 4, SITE: 5, BORROWER: 6, REGISTERED_AT: 7, STATUS: 8, RETURN_DATE: 9, SOURCE: 10, RENTAL_ID: 11 },
  LOCATION_MASTER: { LOCATION: 0 },
  SITE_MASTER: { NAME: 0, CREATED_AT: 1 },
  USER_MASTER: { EMAIL: 0, DISPLAY_NAME: 1, PERMISSION: 2 },
  BACKUP: { TIMESTAMP: 0, TYPE: 1, EQUIPMENT_ID: 2, NAME: 3, SPEC: 4, MODEL: 5, MAKER: 6, SERIAL: 7, TOTAL: 8, UNIT: 9, LOCATION: 10, NOTE1: 11, NOTE2: 12, USER: 13 }
};

// --- 初期化 ---

/**
 * スプレッドシートとシートを初期化します。
 * スクリプトプロパティからIDを読み込み、なければ新規作成します。
 * @param {boolean} forceReinit - trueの場合、強制的にシート変数を再割り当てします。
 */
function initializeSpreadsheetAndSheets(forceReinit = false) {
  // キャッシュチェック
  if (ss && equipmentSheet && !forceReinit) {
    try { if (ss.getId() && equipmentSheet.getSheetId()) return true; } catch(e) {}
  }

  Logger.log('Initializing spreadsheet and sheets...');
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const ssIdFromProps = scriptProperties.getProperty(SPREADSHEET_ID_PROPERTY);
    Logger.log(`スクリプトプロパティ '${SPREADSHEET_ID_PROPERTY}' から取得した値: [${ssIdFromProps}]`);

    let ssId = ssIdFromProps;

    if (!ssId) {
      Logger.log('スプレッドシートIDがプロパティに見つかりません。新規作成を試みます。');
      try {
          const newSS = SpreadsheetApp.create('機材貸出管理システム - データ');
          ssId = newSS.getId();
          scriptProperties.setProperty(SPREADSHEET_ID_PROPERTY, ssId); // ★ 新規作成時にプロパティをセット
          ss = newSS;
          Logger.log(`新しいスプレッドシートを作成しました: ID=${ssId}`);
          initializeAllSheets(); // 新規作成後にシート初期化
      } catch (createError) {
          Logger.log(`新規スプレッドシートの作成に失敗しました: ${createError}`);
          if (createError.message.includes("Specified permissions are not sufficient")) {
              throw new Error(`スプレッドシートを作成する権限がありません。スクリプトの承認を再確認してください。Error: ${createError.message}`);
          } else {
              throw new Error(`スプレッドシートの新規作成中に予期せぬエラーが発生しました: ${createError.message}`);
          }
      }
    } else {
      // IDが見つかった場合
      if (!ss || ss.getId() !== ssId || forceReinit) {
        Logger.log(`取得したID [${ssId}] でスプレッドシートを開きます...`);
        try {
          ss = SpreadsheetApp.openById(ssId); // ★ プロパティから取得したIDで開く
          Logger.log(`既存のスプレッドシートを開きました: ID=${ssId}`);
        } catch (openError) {
          Logger.log(`指定されたスプレッドシートID (${ssId}) を開けませんでした。Error: ${openError}`);
          throw new Error(`指定されたスプレッドシートID [${ssId}] を開けません。IDが正しいか、アクセス権があるか確認してください。元のエラー: ${openError.message}`);
        }
      }
      initializeAllSheets(); // シートの存在確認・初期化
    }

    // --- シート変数への割り当て ---
    assignGlobalSheetVariables();

    Logger.log('スプレッドシートとシートの初期化が完了しました。');
    return true;

  } catch (e) {
    Logger.log(`スプレッドシートの初期化中に最終的なエラーが発生しました: ${e}`);
    Logger.log(`Final Stack Trace: ${e.stack}`);
    throw new Error(`スプレッドシートの初期化に失敗しました: ${e.message}`);
  }
}

/**
 * グローバル変数にシートオブジェクトを割り当てます。
 */
function assignGlobalSheetVariables() {
    if (!ss) throw new Error("Spreadsheet object (ss) is not available.");
    equipmentSheet = ss.getSheetByName(SHEET_NAMES.EQUIPMENT);
    rentalHistorySheet = ss.getSheetByName(SHEET_NAMES.RENTAL_HISTORY);
    locationMasterSheet = ss.getSheetByName(SHEET_NAMES.LOCATION_MASTER);
    siteMasterSheet = ss.getSheetByName(SHEET_NAMES.SITE_MASTER);
    userMasterSheet = ss.getSheetByName(SHEET_NAMES.USER_MASTER);
    backupSheet = ss.getSheetByName(SHEET_NAMES.BACKUP);

    // シート取得失敗チェック
    const missingSheets = Object.entries(SHEET_NAMES)
        .filter(([key, name]) => !ss.getSheetByName(name))
        .map(([key, name]) => name);

    if (missingSheets.length > 0) {
         Logger.log(`必要なシートが見つかりません: ${missingSheets.join(', ')}。再度シート初期化を試みます。`);
         initializeAllSheets(); // 再度初期化を試みる
         // 再度取得して最終確認
         equipmentSheet = ss.getSheetByName(SHEET_NAMES.EQUIPMENT);
         rentalHistorySheet = ss.getSheetByName(SHEET_NAMES.RENTAL_HISTORY);
         locationMasterSheet = ss.getSheetByName(SHEET_NAMES.LOCATION_MASTER);
         siteMasterSheet = ss.getSheetByName(SHEET_NAMES.SITE_MASTER);
         userMasterSheet = ss.getSheetByName(SHEET_NAMES.USER_MASTER);
         backupSheet = ss.getSheetByName(SHEET_NAMES.BACKUP);
         const stillMissing = Object.entries(SHEET_NAMES)
             .filter(([key, name]) => !ss.getSheetByName(name))
             .map(([key, name]) => name);
         if (stillMissing.length > 0) {
             throw new Error(`必要なシートの取得に失敗しました: ${stillMissing.join(', ')}`);
         }
    }
}


/**
 * すべての必要なシートを初期化（存在しない場合は作成）します。
 */
function initializeAllSheets() {
  if (!ss) throw new Error('Spreadsheet is not initialized before initializing sheets.');
  initializeSheet(SHEET_NAMES.EQUIPMENT, ['機器管理番号', '機器名称', '仕様', '型番', 'メーカー', 'シリアルNo', '総台数', '呼称', '定置場所', '備考1', '備考2']);
  initializeSheet(SHEET_NAMES.RENTAL_HISTORY, ['機器管理番号', '機器名称', '借用開始日', '借用終了日', '数量', '使用場所', '借用者', '登録日時', 'ステータス', '返却日', '貸出元', '貸出ID']);
  initializeSheet(SHEET_NAMES.LOCATION_MASTER, ['定置場所']);
  initializeSheet(SHEET_NAMES.SITE_MASTER, ['現場名', '作成日']);
  initializeSheet(SHEET_NAMES.USER_MASTER, ['メールアドレス', '表示名', '権限']);
  initializeSheet(SHEET_NAMES.BACKUP, ['操作日時', '操作タイプ', '機器管理番号', '機器名称', '仕様', '型番', 'メーカー', 'シリアルNo', '総台数', '呼称', '定置場所', '備考1', '備考2', '操作ユーザー']);
  addUniqueRentalIds();
}

/**
 * 指定された名前のシートが存在しない場合に作成し、ヘッダー行を追加します。
 */
function initializeSheet(sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      try {
        if (sheet.getLastRow() === 0) {
            sheet.appendRow(headers);
        } else {
             try {
                 sheet.insertRowBefore(1);
                 sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
             } catch(insertError) {
                 Logger.log(`シート '${sheetName}' への行挿入失敗、1行目を上書きします: ${insertError}`);
                 sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
             }
        }
        sheet.setFrozenRows(1);
        Logger.log(`シート '${sheetName}' を作成/ヘッダー設定しました。`);
      } catch (e) {
        Logger.log(`シート '${sheetName}' のヘッダー設定中にエラー: ${e}`);
      }
    }
  } else {
    // 既存シートのヘッダー確認・修正
    if (headers && headers.length > 0 && sheet.getLastRow() >= 1) {
      try {
        const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
        if (currentHeaders.length < headers.length || JSON.stringify(currentHeaders.slice(0, headers.length)) !== JSON.stringify(headers)) {
          if (currentHeaders.length < headers.length) {
            sheet.insertColumns(currentHeaders.length + 1, headers.length - currentHeaders.length);
          }
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          if (sheet.getFrozenRows() === 0) sheet.setFrozenRows(1);
          Logger.log(`シート '${sheetName}' のヘッダーを更新/確認しました。`);
        }
      } catch (e) {
        Logger.log(`シート '${sheetName}' の既存ヘッダー確認中にエラー: ${e}`);
      }
    }
  }
}

/**
 * 貸出履歴シートの各行にユニークな貸出IDを付与します（まだIDがない場合）。
 */
function addUniqueRentalIds() {
  const sheet = ss.getSheetByName(SHEET_NAMES.RENTAL_HISTORY);
  if (!sheet) return;
  const idColIndex = COL_INDEX.RENTAL_HISTORY.RENTAL_ID;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  try {
    const idRange = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1);
    const ids = idRange.getValues();
    let updated = false;
    let idsToUpdate = [];
    for (let i = 0; i < ids.length; i++) {
      if (!ids[i][0]) {
        idsToUpdate.push({row: i + 2, id: Utilities.getUuid()});
        updated = true;
      }
    }
    if (updated) {
      idsToUpdate.forEach(item => sheet.getRange(item.row, idColIndex + 1).setValue(item.id));
      SpreadsheetApp.flush();
      Logger.log(`貸出履歴に ${idsToUpdate.length} 件のユニークIDを付与しました。`);
    }
  } catch (e) {
    Logger.log(`貸出履歴へのユニークID付与中にエラー: ${e}`);
  }
}

// --- Web アプリのエントリーポイント ---
function doGet() {
  try {
    initializeSpreadsheetAndSheets(true); // doGet時は強制的に初期化
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('機材貸出管理システム')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    Logger.log(`doGet エラー: ${e}`);
    return HtmlService.createHtmlOutput(
      `<html><body><h1>エラーが発生しました</h1><p>${e.message}</p><p>ログを確認してください。</p></body></html>`
    ).setTitle('エラー - 機材貸出管理システム');
  }
}
function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

// --- ユーザー情報 ---
function getCurrentUser() {
  initializeSpreadsheetAndSheets();
  try {
    const email = Session.getActiveUser().getEmail();
    if (!email) { Logger.log('ゲストユーザーとして扱います。'); return { email: 'guest@example.com', displayName: 'ゲスト', permission: 'viewer' }; }
    if (!userMasterSheet) throw new Error("ユーザーマスターシートが初期化されていません。");
    const userMasterData = userMasterSheet.getDataRange().getValues();
    const emailCol = COL_INDEX.USER_MASTER.EMAIL; const nameCol = COL_INDEX.USER_MASTER.DISPLAY_NAME; const permCol = COL_INDEX.USER_MASTER.PERMISSION;
    for (let i = 1; i < userMasterData.length; i++) { if (userMasterData[i][emailCol] === email) return { email: email, displayName: userMasterData[i][nameCol] || email.split('@')[0], permission: userMasterData[i][permCol] || 'viewer' }; }
    Logger.log(`ユーザーが見つかりません。新規登録します: ${email}`);
    const displayName = email.split('@')[0]; const defaultPermission = 'viewer';
    userMasterSheet.appendRow([email, displayName, defaultPermission]); SpreadsheetApp.flush();
    return { email: email, displayName: displayName, permission: defaultPermission };
  } catch (e) { Logger.log(`ユーザー情報取得エラー: ${e}`); throw new Error(`ユーザー情報の取得に失敗しました: ${e.message}`); }
}

// --- データ取得関数 ---
function getEquipmentList() { initializeSpreadsheetAndSheets(); try { if (!equipmentSheet) throw new Error("機器リストシートが初期化されていません。"); const data = equipmentSheet.getDataRange().getValues(); if (data.length <= 1) return []; const headers = data[0]; return data.slice(1).map(row => { const equipment = {}; headers.forEach((header, index) => equipment[header] = row[index]); return equipment; }); } catch (e) { Logger.log(`機器リスト取得エラー: ${e}`); throw new Error(`機器リストの取得に失敗しました: ${e.message}`); } }
function getCurrentRentals() { initializeSpreadsheetAndSheets(); try { if (!rentalHistorySheet) throw new Error("貸出履歴シートが初期化されていません。"); const data = rentalHistorySheet.getDataRange().getValues(); if (data.length <= 1) return []; const headers = data[0]; const statusCol = headers.indexOf('ステータス'); const idCol = headers.indexOf('貸出ID'); if (statusCol === -1 || idCol === -1) { Logger.log('貸出履歴シートに必要な列（ステータスまたは貸出ID）が見つかりません。'); return []; } const rentals = []; for (let i = 1; i < data.length; i++) { const row = data[i]; if (row[statusCol] !== '返却済') { const rental = {}; headers.forEach((header, index) => { if ((header === '借用開始日' || header === '借用終了日' || header === '登録日時' || header === '返却日') && row[index] instanceof Date) { try { rental[header] = Utilities.formatDate(row[index], Session.getScriptTimeZone(), 'yyyy-MM-dd'); } catch (dateError) { Logger.log(`日付のフォーマットエラー (${header}): ${dateError}, 元の値: ${row[index]}`); rental[header] = row[index]; } } else rental[header] = row[index]; }); if (!rental['貸出ID']) rental['貸出ID'] = `TEMP_${i}`; rentals.push(rental); } } return rentals; } catch (e) { Logger.log(`現在の貸出状況取得エラー: ${e}`); throw new Error(`現在の貸出状況の取得に失敗しました: ${e.message}`); } }
function getSiteList() { initializeSpreadsheetAndSheets(); try { if (!siteMasterSheet) throw new Error("現場マスターシートが初期化されていません。"); const data = siteMasterSheet.getDataRange().getValues(); if (data.length <= 1) return []; const nameCol = COL_INDEX.SITE_MASTER.NAME; const dateCol = COL_INDEX.SITE_MASTER.CREATED_AT; return data.slice(1).map(row => ({ siteName: row[nameCol], createdDate: row[dateCol] instanceof Date ? Utilities.formatDate(row[dateCol], Session.getScriptTimeZone(), 'yyyy-MM-dd') : row[dateCol] })); } catch (e) { Logger.log(`現場マスター取得エラー: ${e}`); throw new Error(`現場マスターの取得に失敗しました: ${e.message}`); } }
function getLocationList() { initializeSpreadsheetAndSheets(); try { if (!locationMasterSheet) throw new Error("置場マスターシートが初期化されていません。"); const data = locationMasterSheet.getDataRange().getValues(); if (data.length <= 1) return []; const locationCol = COL_INDEX.LOCATION_MASTER.LOCATION; return data.slice(1).map(row => row[locationCol]).filter(location => location); } catch (e) { Logger.log(`置場マスター取得エラー: ${e}`); Logger.log(`Stack trace: ${e.stack}`); throw new Error(`置場マスターの取得に失敗しました: ${e.message}`); } }

// --- データ操作関数 ---
function addEquipment(equipmentData) { initializeSpreadsheetAndSheets(); try { if (!equipmentSheet) throw new Error("機器リストシートが初期化されていません。"); if (!equipmentData.機器名称 || !equipmentData.総台数) throw new Error('機器名称と総台数は必須です。'); if (isNaN(Number(equipmentData.総台数)) || Number(equipmentData.総台数) <= 0) throw new Error('総台数は正の数値である必要があります。'); const lastRow = equipmentSheet.getLastRow(); const newId = lastRow > 1 ? (Number(equipmentSheet.getRange(lastRow, COL_INDEX.EQUIPMENT.ID + 1).getValue()) || 0) + 1 : 1; const newRow = [newId, equipmentData.機器名称, equipmentData.仕様 || '', equipmentData.型番 || '', equipmentData.メーカー || '', equipmentData.シリアルNo || '', Number(equipmentData.総台数), equipmentData.呼称 || '', equipmentData.定置場所 || '', equipmentData.備考1 || '', equipmentData.備考2 || '']; equipmentSheet.appendRow(newRow); logBackup('add', newRow, COL_INDEX.EQUIPMENT); SpreadsheetApp.flush(); Logger.log(`機器を追加しました: ID=${newId}, 名称=${equipmentData.機器名称}`); return newId; } catch (e) { Logger.log(`機器追加エラー: ${e}`); throw new Error(`機器の追加に失敗しました: ${e.message}`); } }
function updateEquipment(equipmentData) { initializeSpreadsheetAndSheets(); try { if (!equipmentSheet) throw new Error("機器リストシートが初期化されていません。"); if (!equipmentData.機器管理番号) throw new Error('更新対象の機器管理番号が必要です。'); if (!equipmentData.機器名称 || !equipmentData.総台数) throw new Error('機器名称と総台数は必須です。'); if (isNaN(Number(equipmentData.総台数)) || Number(equipmentData.総台数) <= 0) throw new Error('総台数は正の数値である必要があります。'); const equipmentId = Number(equipmentData.機器管理番号); const data = equipmentSheet.getDataRange().getValues(); let rowIndex = -1; for (let i = 1; i < data.length; i++) { if (Number(data[i][COL_INDEX.EQUIPMENT.ID]) === equipmentId) { rowIndex = i + 1; break; } } if (rowIndex === -1) throw new Error(`指定された機器管理番号が見つかりません: ${equipmentId}`); const updatedRow = [equipmentId, equipmentData.機器名称, equipmentData.仕様 || '', equipmentData.型番 || '', equipmentData.メーカー || '', equipmentData.シリアルNo || '', Number(equipmentData.総台数), equipmentData.呼称 || '', equipmentData.定置場所 || '', equipmentData.備考1 || '', equipmentData.備考2 || '']; equipmentSheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]); logBackup('update', updatedRow, COL_INDEX.EQUIPMENT); SpreadsheetApp.flush(); Logger.log(`機器を更新しました: ID=${equipmentId}, 名称=${equipmentData.機器名称}`); return true; } catch (e) { Logger.log(`機器更新エラー: ${e}`); throw new Error(`機器の更新に失敗しました: ${e.message}`); } }
function deleteEquipment(ids) { initializeSpreadsheetAndSheets(); try { if (!equipmentSheet) throw new Error("機器リストシートが初期化されていません。"); if (!Array.isArray(ids) || ids.length === 0) throw new Error('削除する機器IDを指定してください。'); const data = equipmentSheet.getDataRange().getValues(); const rowsToDelete = []; const numericIds = ids.map(id => Number(id)); for (let i = data.length - 1; i > 0; i--) { const rowId = Number(data[i][COL_INDEX.EQUIPMENT.ID]); if (numericIds.includes(rowId)) { rowsToDelete.push(i + 1); logBackup('delete', data[i], COL_INDEX.EQUIPMENT); } } if (rowsToDelete.length === 0) return 0; rowsToDelete.sort((a, b) => b - a); rowsToDelete.forEach(rowIndex => equipmentSheet.deleteRow(rowIndex)); SpreadsheetApp.flush(); Logger.log(`機器を削除しました: ${rowsToDelete.length} 件, IDs=${ids.join(', ')}`); return rowsToDelete.length; } catch (e) { Logger.log(`機器削除エラー: ${e}`); throw new Error(`機器の削除に失敗しました: ${e.message}`); } }
function addSite(siteName) { initializeSpreadsheetAndSheets(); try { if (!siteMasterSheet) throw new Error("現場マスターシートが初期化されていません。"); if (!siteName || siteName.trim() === '') throw new Error('現場名を入力してください。'); siteName = siteName.trim(); const sites = getSiteList(); if (sites.some(site => site.siteName === siteName)) throw new Error(`現場 '${siteName}' は既に登録されています。`); const today = new Date(); siteMasterSheet.appendRow([siteName, today]); SpreadsheetApp.flush(); Logger.log(`現場を追加しました: ${siteName}`); return { siteName: siteName, createdDate: Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd') }; } catch (e) { Logger.log(`現場追加エラー: ${e}`); throw new Error(`現場の追加に失敗しました: ${e.message}`); } }
function deleteSites(siteNames) { initializeSpreadsheetAndSheets(); try { if (!siteMasterSheet) throw new Error("現場マスターシートが初期化されていません。"); if (!Array.isArray(siteNames) || siteNames.length === 0) throw new Error('削除する現場名を選択してください。'); const data = siteMasterSheet.getDataRange().getValues(); const rowsToDelete = []; for (let i = data.length - 1; i > 0; i--) { if (siteNames.includes(data[i][COL_INDEX.SITE_MASTER.NAME])) rowsToDelete.push(i + 1); } if (rowsToDelete.length === 0) return 0; rowsToDelete.sort((a, b) => b - a); rowsToDelete.forEach(rowIndex => siteMasterSheet.deleteRow(rowIndex)); SpreadsheetApp.flush(); Logger.log(`現場を削除しました: ${rowsToDelete.length} 件, Names=${siteNames.join(', ')}`); return rowsToDelete.length; } catch (e) { Logger.log(`現場削除エラー: ${e}`); throw new Error(`現場の削除に失敗しました: ${e.message}`); } }
function registerRental(rentalData) { initializeSpreadsheetAndSheets(); try { if (!rentalHistorySheet) throw new Error("貸出履歴シートが初期化されていません。"); if (!rentalData.機器管理番号 || !rentalData.借用開始日 || !rentalData.借用終了日 || !rentalData.数量 || !rentalData.使用場所) throw new Error('必須項目（機器管理番号, 開始日, 終了日, 数量, 使用場所）が不足しています。'); if (isNaN(Number(rentalData.数量)) || Number(rentalData.数量) <= 0) throw new Error('数量は正の数値である必要があります。'); const startDate = parseDate_(rentalData.借用開始日); const endDate = parseDate_(rentalData.借用終了日); if (!startDate || !endDate) throw new Error('日付の形式が無効です。YYYY-MM-DD 形式で入力してください。'); if (startDate > endDate) throw new Error('借用開始日は借用終了日以前である必要があります。'); const equipmentId = Number(rentalData.機器管理番号); const quantity = Number(rentalData.数量); if (!isRentalPossible(equipmentId, startDate, endDate, quantity)) { Logger.log(`貸出不可: 機器ID=${equipmentId}, 期間=${Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')}~${Utilities.formatDate(endDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')}, 数量=${quantity}`); throw new Error('指定された期間と数量では、機器の総台数を超えてしまうため貸出できません。'); } let equipmentName = rentalData.機器名称; if (!equipmentName) { const equipment = getEquipmentById_(equipmentId); equipmentName = equipment ? equipment[COL_INDEX.EQUIPMENT.NAME] : `機器ID:${equipmentId}`; } const user = getCurrentUser(); const timestamp = new Date(); const rentalId = Utilities.getUuid(); const newRow = [equipmentId, equipmentName, startDate, endDate, quantity, rentalData.使用場所, user.email, timestamp, '貸出中', '', rentalData.貸出元 || '', rentalId]; rentalHistorySheet.appendRow(newRow); SpreadsheetApp.flush(); Logger.log(`貸出登録完了: ID=${rentalId}, 機器=${equipmentName}, 数量=${quantity}, 場所=${rentalData.使用場所}, 借用者=${user.email}`); return { success: true, message: '貸出を登録しました。', rentalId: rentalId }; } catch (e) { Logger.log(`貸出登録エラー: ${e}`); throw new Error(`貸出の登録に失敗しました: ${e.message}`); } }
function updateRentalPeriod(rentalId, startDateStr, endDateStr) { initializeSpreadsheetAndSheets(); try { if (!rentalHistorySheet) throw new Error("貸出履歴シートが初期化されていません。"); if (!rentalId || !startDateStr || !endDateStr) throw new Error('貸出ID、開始日、終了日を指定してください。'); const startDate = parseDate_(startDateStr); const endDate = parseDate_(endDateStr); if (!startDate || !endDate) throw new Error('日付の形式が無効です。YYYY-MM-DD 形式で入力してください。'); if (startDate > endDate) throw new Error('借用開始日は借用終了日以前である必要があります。'); const data = rentalHistorySheet.getDataRange().getValues(); const idCol = COL_INDEX.RENTAL_HISTORY.RENTAL_ID; const startCol = COL_INDEX.RENTAL_HISTORY.START_DATE; const endCol = COL_INDEX.RENTAL_HISTORY.END_DATE; const equipmentIdCol = COL_INDEX.RENTAL_HISTORY.EQUIPMENT_ID; const quantityCol = COL_INDEX.RENTAL_HISTORY.QUANTITY; let rowIndex = -1; let currentRentalData = null; for (let i = 1; i < data.length; i++) { if (data[i][idCol] === rentalId) { rowIndex = i + 1; currentRentalData = data[i]; break; } } if (rowIndex === -1) throw new Error(`指定された貸出IDが見つかりません: ${rentalId}`); const equipmentId = Number(currentRentalData[equipmentIdCol]); const quantity = Number(currentRentalData[quantityCol]); if (!isRentalPossible(equipmentId, startDate, endDate, quantity, rentalId)) { Logger.log(`貸出期間更新不可: 機器ID=${equipmentId}, 期間=${startDateStr}~${endDateStr}, 数量=${quantity}`); throw new Error('指定された期間では、機器の総台数を超えてしまうため更新できません。'); } rentalHistorySheet.getRange(rowIndex, startCol + 1).setValue(startDate); rentalHistorySheet.getRange(rowIndex, endCol + 1).setValue(endDate); SpreadsheetApp.flush(); Logger.log(`貸出期間更新完了: ID=${rentalId}, 新期間=${startDateStr} ~ ${endDateStr}`); return { success: true, message: '貸出期間を更新しました。' }; } catch (e) { Logger.log(`貸出期間更新エラー: ${e}`); throw new Error(`貸出期間の更新に失敗しました: ${e.message}`); } }
function returnEquipment(rentalId, returnDateStr, quantity) { initializeSpreadsheetAndSheets(); try { if (!rentalHistorySheet) throw new Error("貸出履歴シートが初期化されていません。"); if (!rentalId || !returnDateStr || !quantity) throw new Error('貸出ID、返却日、数量を指定してください。'); if (isNaN(Number(quantity)) || Number(quantity) <= 0) throw new Error('数量は正の数値である必要があります。'); quantity = Number(quantity); const returnDate = parseDate_(returnDateStr); if (!returnDate) throw new Error('返却日の形式が無効です。YYYY-MM-DD 形式で入力してください。'); const data = rentalHistorySheet.getDataRange().getValues(); const idCol = COL_INDEX.RENTAL_HISTORY.RENTAL_ID; const quantityCol = COL_INDEX.RENTAL_HISTORY.QUANTITY; const statusCol = COL_INDEX.RENTAL_HISTORY.STATUS; const returnDateCol = COL_INDEX.RENTAL_HISTORY.RETURN_DATE; let rowIndex = -1; let currentRentalData = null; for (let i = 1; i < data.length; i++) { if (data[i][idCol] === rentalId) { rowIndex = i + 1; currentRentalData = data[i]; break; } } if (rowIndex === -1) throw new Error(`指定された貸出IDが見つかりません: ${rentalId}`); const currentQuantity = Number(currentRentalData[quantityCol]); const currentStatus = currentRentalData[statusCol]; if (currentStatus === '返却済') throw new Error('この貸出は既に返却済みです。'); if (quantity > currentQuantity) throw new Error(`返却数量(${quantity})が現在の貸出数量(${currentQuantity})を超えています。`); const timestamp = new Date(); if (quantity === currentQuantity) { rentalHistorySheet.getRange(rowIndex, statusCol + 1).setValue('返却済'); rentalHistorySheet.getRange(rowIndex, returnDateCol + 1).setValue(returnDate); Logger.log(`全数返却完了: ID=${rentalId}, 数量=${quantity}`); } else { const remainingQuantity = currentQuantity - quantity; rentalHistorySheet.getRange(rowIndex, quantityCol + 1).setValue(remainingQuantity); Logger.log(`一部返却 - 元レコード更新: ID=${rentalId}, 残数量=${remainingQuantity}`); const returnedRow = [...currentRentalData]; returnedRow[quantityCol] = quantity; returnedRow[statusCol] = '返却済'; returnedRow[returnDateCol] = returnDate; returnedRow[idCol] = Utilities.getUuid(); returnedRow[COL_INDEX.RENTAL_HISTORY.REGISTERED_AT] = timestamp; rentalHistorySheet.appendRow(returnedRow); Logger.log(`一部返却 - 返却レコード追加: 元ID=${rentalId}, 新ID=${returnedRow[idCol]}, 数量=${quantity}`); } SpreadsheetApp.flush(); return { success: true, message: '返却処理が完了しました。' }; } catch (e) { Logger.log(`返却処理エラー: ${e}`); throw new Error(`返却処理に失敗しました: ${e.message}`); } }

// --- ヘルパー関数 ---
function parseDate_(dateString) { if (!dateString || typeof dateString !== 'string') return null; const parts = dateString.split('-'); if (parts.length === 3) { const year = parseInt(parts[0], 10); const month = parseInt(parts[1], 10) - 1; const day = parseInt(parts[2], 10); const date = new Date(Date.UTC(year, month, day)); if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) return new Date(year, month, day); } Logger.log(`無効な日付文字列です: ${dateString}`); return null; }
function getEquipmentById_(equipmentId) { initializeSpreadsheetAndSheets(); if (!equipmentSheet) return null; const data = equipmentSheet.getDataRange().getValues(); const idCol = COL_INDEX.EQUIPMENT.ID; for (let i = 1; i < data.length; i++) { if (Number(data[i][idCol]) === Number(equipmentId)) return data[i]; } return null; }
function isRentalPossible(equipmentId, startDate, endDate, quantity, excludeRentalId = null) { initializeSpreadsheetAndSheets(); try { const equipment = getEquipmentById_(equipmentId); if (!equipment) { Logger.log(`貸出可否チェック: 機器ID ${equipmentId} が見つかりません。`); return false; } const totalAvailable = Number(equipment[COL_INDEX.EQUIPMENT.TOTAL]); const rentals = getCurrentRentals(); const checkDate = new Date(startDate); const finalEndDate = new Date(endDate); finalEndDate.setHours(0,0,0,0); while (checkDate <= finalEndDate) { let currentlyRented = 0; rentals.forEach(rental => { if (String(rental.機器管理番号) === String(equipmentId) && String(rental.貸出ID) !== String(excludeRentalId)) { const rentalStart = parseDate_(rental.借用開始日); const rentalEnd = parseDate_(rental.借用終了日); if (rentalStart && rentalEnd && checkDate >= rentalStart && checkDate <= rentalEnd) currentlyRented += Number(rental.数量); } }); if (currentlyRented + quantity > totalAvailable) { Logger.log(`貸出不可(${formatDate_(checkDate)}): 既存(${currentlyRented}) + 新規(${quantity}) > 総数(${totalAvailable})`); return false; } checkDate.setDate(checkDate.getDate() + 1); } return true; } catch (e) { Logger.log(`isRentalPossibleエラー: ${e}`); return false; } }
function formatDate_(date) { if (!(date instanceof Date) || isNaN(date)) return ''; return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function logBackup(type, rowData, colIndexMap) { initializeSpreadsheetAndSheets(); try { if (!backupSheet) { Logger.log('バックアップシートが見つからないため、記録をスキップします。'); return; } const timestamp = new Date(); const user = Session.getActiveUser().getEmail() || '不明'; const backupRow = [ timestamp, type, rowData[colIndexMap.ID] || '', rowData[colIndexMap.NAME] || '', rowData[colIndexMap.SPEC] || '', rowData[colIndexMap.MODEL] || '', rowData[colIndexMap.MAKER] || '', rowData[colIndexMap.SERIAL] || '', rowData[colIndexMap.TOTAL] || '', rowData[colIndexMap.UNIT] || '', rowData[colIndexMap.LOCATION] || '', rowData[colIndexMap.NOTE1] || '', rowData[colIndexMap.NOTE2] || '', user ]; backupSheet.appendRow(backupRow); } catch (e) { Logger.log(`バックアップ記録エラー: ${e}`); } }
function getSpreadsheetUrl() { initializeSpreadsheetAndSheets(); if (ss) return ss.getUrl(); else throw new Error('スプレッドシートが見つかりません。'); }
