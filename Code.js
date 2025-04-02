/**
 * 機材貸出管理システム
 * Google Apps Script用バックエンドコード
 */

// グローバル変数
const EQUIPMENT_SHEET_NAME = '機材マスター';  // 機材マスターシート名
const RENTAL_SHEET_NAME = '貸出履歴';         // 貸出履歴シート名
const SITE_SHEET_NAME = '現場マスター';       // 現場マスターシート名
const LOCATION_SHEET_NAME = '置場マスター';   // 置場マスターシート名

/**
 * ウェブアプリケーションとしてのエントリーポイント
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('機材貸出管理システム')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTMLファイルをインクルード
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * スタイルシートURLを取得
 */
function getStylesheetUrl() {
  return ScriptApp.getService().getUrl() + '?style=1';
}

/**
 * スクリプトコンテンツを取得
 */
function getScriptContent(scriptName) {
  return HtmlService.createHtmlOutputFromFile(scriptName).getContent();
}

/**
 * 現在のユーザー情報を取得
 */
function getCurrentUser() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const userProperties = PropertiesService.getUserProperties();
    
    // ユーザーロールの取得（デフォルトは一般ユーザー）
    let userRole = 'user';
    
    // 管理者リストをチェック
    const adminEmails = getAdminEmails();
    if (adminEmails.includes(userEmail)) {
      userRole = 'admin';
    }
    
    return {
      email: userEmail,
      displayName: getUserDisplayName(userEmail),
      role: userRole
    };
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    
    // エラー時はゲストユーザー情報を返す
    return {
      email: 'guest@example.com',
      displayName: 'ゲストユーザー',
      role: 'guest'
    };
  }
}

/**
 * ユーザー表示名を取得
 */
function getUserDisplayName(email) {
  // ドメイン部分を削除してユーザー名だけを使用
  const username = email.split('@')[0];
  
  // カスタム名前マッピング（必要に応じて）
  const nameMap = {
    // 'user1': '山田 太郎',
    // 'user2': '佐藤 次郎'
  };
  
  return nameMap[username] || username;
}

/**
 * 管理者メールアドレスリストを取得
 */
function getAdminEmails() {
  // スクリプトプロパティから管理者リストを取得
  const scriptProperties = PropertiesService.getScriptProperties();
  const adminList = scriptProperties.getProperty('ADMIN_EMAILS') || '';
  
  // カンマ区切りでメールアドレスを分割
  return adminList.split(',').map(email => email.trim());
}

/**
 * マスターデータを取得
 */
function getMasterData() {
  try {
    // 置場マスターデータの取得
    const locationSheet = getOrCreateSheet(LOCATION_SHEET_NAME);
    const locationData = getSheetData(locationSheet);
    
    // 現場マスターデータの取得
    const siteSheet = getOrCreateSheet(SITE_SHEET_NAME);
    const siteData = getSheetData(siteSheet);
    
    return {
      locations: locationData,
      sites: siteData
    };
  } catch (error) {
    console.error('マスターデータ取得エラー:', error);
    throw new Error('マスターデータの取得に失敗しました: ' + error.message);
  }
}

/**
 * 機材リストを取得
 */
function getEquipmentList() {
  try {
    const sheet = getOrCreateSheet(EQUIPMENT_SHEET_NAME);
    const data = getSheetData(sheet);
    
    return data;
  } catch (error) {
    console.error('機材リスト取得エラー:', error);
    throw new Error('機材リストの取得に失敗しました: ' + error.message);
  }
}

/**
 * 貸出データを取得
 */
function getRentalData() {
  try {
    const sheet = getOrCreateSheet(RENTAL_SHEET_NAME);
    let data = getSheetData(sheet);
    
    // アクティブな貸出のみを抽出
    // ここでは全データを返しクライアント側でフィルタリングする方がよいかもしれません
    return data;
  } catch (error) {
    console.error('貸出データ取得エラー:', error);
    throw new Error('貸出データの取得に失敗しました: ' + error.message);
  }
}

/**
 * シートを取得または作成
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    // シートが存在しない場合は新規作成
    sheet = ss.insertSheet(sheetName);
    
    // シートのタイプに応じて初期化
    switch (sheetName) {
      case EQUIPMENT_SHEET_NAME:
        initializeEquipmentSheet(sheet);
        break;
      case RENTAL_SHEET_NAME:
        initializeRentalSheet(sheet);
        break;
      case SITE_SHEET_NAME:
        initializeSiteSheet(sheet);
        break;
      case LOCATION_SHEET_NAME:
        initializeLocationSheet(sheet);
        break;
    }
  }
  
  return sheet;
}

/**
 * 機材マスターシートの初期化
 */
function initializeEquipmentSheet(sheet) {
  // ヘッダー行を設定
  const headers = [
    'id', 'name', 'totalQuantity', 'specification', 'model',
    'manufacturer', 'serialNumber', 'alias', 'location', 'note1', 'note2'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

/**
 * 貸出履歴シートの初期化
 */
function initializeRentalSheet(sheet) {
  // ヘッダー行を設定
  const headers = [
    'id', 'equipmentId', 'equipmentName', 'startDate', 'endDate',
    'returnDate', 'quantity', 'site', 'borrower', 'timestamp', 'status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

/**
 * 現場マスターシートの初期化
 */
function initializeSiteSheet(sheet) {
  const headers = ['id', 'name', 'address', 'note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

/**
 * 置場マスターシートの初期化
 */
function initializeLocationSheet(sheet) {
  const headers = ['id', 'name', 'note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

/**
 * シートデータを取得して配列オブジェクトに変換
 */
function getSheetData(sheet) {
  // データが存在しなければ空配列を返す
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }
  
  // ヘッダー行を取得
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // データ行を取得
  const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const data = dataRange.getValues();
  
  // 各行をオブジェクトに変換
  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * 機材を追加
 */
function addEquipment(equipmentData) {
  try {
    const sheet = getOrCreateSheet(EQUIPMENT_SHEET_NAME);
    
    // 新しいIDを生成（現在の最大ID + 1）
    const data = getSheetData(sheet);
    const maxId = data.length > 0 ? Math.max(...data.map(item => parseInt(item.id) || 0)) : 0;
    const newId = maxId + 1;
    
    // データを行に変換
    const row = [
      newId,
      equipmentData.name,
      equipmentData.totalQuantity || 1,
      equipmentData.specification || '',
      equipmentData.model || '',
      equipmentData.manufacturer || '',
      equipmentData.serialNumber || '',
      equipmentData.alias || '',
      equipmentData.location || '',
      equipmentData.note1 || '',
      equipmentData.note2 || ''
    ];
    
    // シートに追加
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);
    
    return { success: true, equipment: { ...equipmentData, id: newId } };
  } catch (error) {
    console.error('機材追加エラー:', error);
    return { success: false, error: '機材の追加に失敗しました: ' + error.message };
  }
}

/**
 * 機材を削除
 */
function deleteEquipment(equipmentIds) {
  try {
    const sheet = getOrCreateSheet(EQUIPMENT_SHEET_NAME);
    
    // データを取得
    const data = getSheetData(sheet);
    
    // 削除する行番号を特定（降順でソート）
    const rowsToDelete = [];
    data.forEach((row, index) => {
      if (equipmentIds.includes(row.id.toString())) {
        // インデックス+2（ヘッダー行+0から始まるインデックス）
        rowsToDelete.push(index + 2);
      }
    });
    
    // 行を降順で削除（上から削除すると行番号がずれるため）
    rowsToDelete.sort((a, b) => b - a);
    rowsToDelete.forEach(rowNum => {
      sheet.deleteRow(rowNum);
    });
    
    return { success: true, deletedCount: rowsToDelete.length };
  } catch (error) {
    console.error('機材削除エラー:', error);
    return { success: false, error: '機材の削除に失敗しました: ' + error.message };
  }
}

/**
 * 現場を追加
 */
function addSite(siteName) {
  try {
    const sheet = getOrCreateSheet(SITE_SHEET_NAME);
    
    // 既存の現場名をチェック
    const data = getSheetData(sheet);
    const existingSite = data.find(site => site.name === siteName);
    
    if (existingSite) {
      return { success: false, error: '同じ名前の現場が既に存在します' };
    }
    
    // 新しいIDを生成
    const maxId = data.length > 0 ? Math.max(...data.map(item => parseInt(item.id) || 0)) : 0;
    const newId = maxId + 1;
    
    // データを行に変換
    const row = [newId, siteName, '', ''];
    
    // シートに追加
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);
    
    return { success: true, siteId: newId, siteName: siteName };
  } catch (error) {
    console.error('現場追加エラー:', error);
    return { success: false, error: '現場の追加に失敗しました: ' + error.message };
  }
}

/**
 * 現場を削除
 */
function deleteSites(siteNames) {
  try {
    const sheet = getOrCreateSheet(SITE_SHEET_NAME);
    
    // データを取得
    const data = getSheetData(sheet);
    
    // 削除する行番号を特定（降順でソート）
    const rowsToDelete = [];
    data.forEach((row, index) => {
      if (siteNames.includes(row.name)) {
        rowsToDelete.push(index + 2);
      }
    });
    
    // 行を降順で削除
    rowsToDelete.sort((a, b) => b - a);
    rowsToDelete.forEach(rowNum => {
      sheet.deleteRow(rowNum);
    });
    
    return { success: true, deletedCount: rowsToDelete.length };
  } catch (error) {
    console.error('現場削除エラー:', error);
    return { success: false, error: '現場の削除に失敗しました: ' + error.message };
  }
}

/**
 * 貸出を登録
 */
function saveRental(rentalData) {
  try {
    const sheet = getOrCreateSheet(RENTAL_SHEET_NAME);
    
    // 新しいIDを生成
    const data = getSheetData(sheet);
    const maxId = data.length > 0 ? Math.max(...data.map(item => parseInt(item.id) || 0)) : 0;
    const newId = maxId + 1;
    
    // タイムスタンプを生成
    const timestamp = new Date().toISOString();
    
    // データを行に変換
    const row = [
      newId,
      rentalData.equipmentId,
      rentalData.equipmentName,
      rentalData.startDate,
      rentalData.endDate,
      '', // returnDate（空）
      rentalData.quantity,
      rentalData.site,
      rentalData.borrower,
      timestamp,
      'active' // ステータス：アクティブ
    ];
    
    // シートに追加
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);
    
    return { success: true, rental: { ...rentalData, id: newId, timestamp: timestamp } };
  } catch (error) {
    console.error('貸出登録エラー:', error);
    return { success: false, error: '貸出の登録に失敗しました: ' + error.message };
  }
}

/**
 * 貸出を更新
 */
function updateRental(rentalData) {
  try {
    const sheet = getOrCreateSheet(RENTAL_SHEET_NAME);
    
    // データを取得
    const data = getSheetData(sheet);
    
    // 更新対象の貸出を検索
    const rentalIndex = data.findIndex(rental => rental.id == rentalData.id);
    
    if (rentalIndex === -1) {
      return { success: false, error: '更新する貸出データが見つかりません' };
    }
    
    // 行番号（インデックス+2）
    const rowNum = rentalIndex + 2;
    
    // 更新用のデータを作成
    const updatedRow = [
      rentalData.id,
      rentalData.equipmentId,
      rentalData.equipmentName,
      rentalData.startDate,
      rentalData.endDate,
      data[rentalIndex].returnDate || '', // 既存の返却日を維持
      rentalData.quantity,
      rentalData.site,
      rentalData.borrower,
      data[rentalIndex].timestamp, // 元のタイムスタンプを維持
      data[rentalIndex].status || 'active' // 元のステータスを維持
    ];
    
    // シートの行を更新
    sheet.getRange(rowNum, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    return { success: true, rental: rentalData };
  } catch (error) {
    console.error('貸出更新エラー:', error);
    return { success: false, error: '貸出の更新に失敗しました: ' + error.message };
  }
}

/**
 * 貸出期間の更新
 */
function updateRentalPeriod(rentalId, startDate, endDate) {
  try {
    const sheet = getOrCreateSheet(RENTAL_SHEET_NAME);
    
    // データを取得
    const data = getSheetData(sheet);
    
    // 更新対象の貸出を検索
    const rentalIndex = data.findIndex(rental => rental.id == rentalId);
    
    if (rentalIndex === -1) {
      return { success: false, error: '更新する貸出データが見つかりません' };
    }
    
    // 行番号（インデックス+2）
    const rowNum = rentalIndex + 2;
    
    // 開始日と終了日のカラムインデックス
    const startDateColIndex = 4; // startDateのカラム位置
    const endDateColIndex = 5; // endDateのカラム位置
    
    // 日付を更新
    sheet.getRange(rowNum, startDateColIndex).setValue(startDate);
    sheet.getRange(rowNum, endDateColIndex).setValue(endDate);
    
    return { success: true, rental: { id: rentalId, startDate: startDate, endDate: endDate } };
  } catch (error) {
    console.error('貸出期間更新エラー:', error);
    return { success: false, error: '貸出期間の更新に失敗しました: ' + error.message };
  }
}

/**
 * 機材返却
 */
function returnEquipment(rentalId, returnDate, returnQuantity) {
  try {
    const sheet = getOrCreateSheet(RENTAL_SHEET_NAME);
    
    // データを取得
    const data = getSheetData(sheet);
    
    // 対象の貸出を検索
    const rentalIndex = data.findIndex(rental => rental.id == rentalId);
    
    if (rentalIndex === -1) {
      return { success: false, error: '対象の貸出データが見つかりません' };
    }
    
    const rental = data[rentalIndex];
    const originalQuantity = rental.quantity;
    
    // 行番号（インデックス+2）
    const rowNum = rentalIndex + 2;
    
    // 返却数が貸出数と同じ場合は完了処理
    if (returnQuantity >= originalQuantity) {
      // 返却日と状態を更新
      sheet.getRange(rowNum, 6).setValue(returnDate); // returnDateを設定
      sheet.getRange(rowNum, 11).setValue('returned'); // statusを'returned'に変更
      
      return { success: true, rental: { id: rentalId, status: 'returned', returnDate: returnDate } };
    } else {
      // 部分返却の場合
      
      // 既存の貸出数を減らす
      const remainingQuantity = originalQuantity - returnQuantity;
      sheet.getRange(rowNum, 7).setValue(remainingQuantity); // quantityを更新
      
      // 返却分の新規レコードを作成（履歴として）
      const maxId = data.length > 0 ? Math.max(...data.map(item => parseInt(item.id) || 0)) : 0;
      const newId = maxId + 1;
      
      // タイムスタンプを生成
      const timestamp = new Date().toISOString();
      
      // 返却分のレコードを作成
      const returnedRow = [
        newId,
        rental.equipmentId,
        rental.equipmentName,
        rental.startDate,
        rental.endDate,
        returnDate, // returnDate
        returnQuantity, // 返却数
        rental.site,
        rental.borrower,
        timestamp,
        'returned' // ステータス：返却済み
      ];
      
      // シートに追加
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, 1, returnedRow.length).setValues([returnedRow]);
      
      return { 
        success: true, 
        rental: { 
          id: rentalId, 
          remainingQuantity: remainingQuantity, 
          returnedQuantity: returnQuantity, 
          returnDate: returnDate 
        } 
      };
    }
  } catch (error) {
    console.error('機材返却エラー:', error);
    return { success: false, error: '機材返却処理に失敗しました: ' + error.message };
  }
}