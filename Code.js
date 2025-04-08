/**
 * 機材貸出管理システム
 * サーバーサイドスクリプト (Google Apps Script)
 */

// スプレッドシートID
const SPREADSHEET_ID = '1g2yCuM8mDMVi2zU1Dm1C2tFBM0oIDiaLYON5ahVvdDc'; // 実際のスプレッドシートIDに置き換え

// シート名
const EQUIPMENT_SHEET = '機器リスト';
const RENTAL_SHEET = '貸出履歴';
const LOCATION_SHEET = '置場マスター';
const SITE_SHEET = '現場マスター';
const USER_SHEET = 'ユーザーマスター';
const BACKUP_SHEET = '機器バックアップ';

/**
 * Webアプリとして公開した際のGET処理
 */
function doGet(e) {
  // HTMLサービスを使用してWebアプリを返す
  const template = HtmlService.createTemplateFromFile('index');
  
  // テンプレートに初期データを設定
  template.initialData = {
    timestamp: new Date().getTime() // キャッシュ回避用タイムスタンプ
  };
  
  return template
    .evaluate()
    .setTitle('機材貸出管理システム')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTML内で外部ファイルをインクルードするための関数
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * デバッグ用：ログを出力する関数
 */
function logDebugInfo(message) {
  Logger.log(message);
  return "ログを記録しました: " + message;
}

/**
 * 現在ログインしているユーザー情報を取得
 */
function getCurrentUser() {
  try {
    // アクティブユーザーのメールアドレスを取得
    const email = Session.getActiveUser().getEmail();
    Logger.log("取得したメールアドレス: " + email);
    
    // メールアドレスが空の場合
    if (!email) {
      Logger.log("メールアドレスが取得できませんでした");
      return {
        email: "unknown@example.com",
        displayName: "ゲストユーザー",
        role: "guest"
      };
    }
    
    // ユーザーマスターシートが存在するか確認
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(USER_SHEET);
    
    if (!sheet) {
      Logger.log("ユーザーマスターシートが見つかりません");
      return {
        email: email,
        displayName: email.split('@')[0],
        role: "user"
      };
    }
    
    // データ範囲を取得
    const dataRange = sheet.getDataRange();
    if (!dataRange) {
      Logger.log("データ範囲を取得できませんでした");
      return {
        email: email,
        displayName: email.split('@')[0],
        role: "user"
      };
    }
    
    const data = dataRange.getValues();
    Logger.log("ユーザーマスターのデータ行数: " + data.length);
    
    if (data.length === 0) {
      Logger.log("ユーザーマスターにデータがありません");
      return {
        email: email,
        displayName: email.split('@')[0],
        role: "user"
      };
    }
    
    // ヘッダー行を取得
    const headerRow = data[0];
    Logger.log("ヘッダー行: " + headerRow.join(", "));
    
    // カラムのインデックスを取得
    const emailIndex = headerRow.indexOf('メールアドレス');
    const displayNameIndex = headerRow.indexOf('表示名');
    const roleIndex = headerRow.indexOf('権限');
    
    Logger.log("カラムインデックス - メールアドレス: " + emailIndex + ", 表示名: " + displayNameIndex + ", 権限: " + roleIndex);
    
    // カラムが見つからない場合
    if (emailIndex === -1 || displayNameIndex === -1 || roleIndex === -1) {
      Logger.log("必要なカラムが見つかりません");
      return {
        email: email,
        displayName: email.split('@')[0],
        role: "user"
      };
    }
    
    // ユーザーを検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] === email) {
        Logger.log("ユーザーが見つかりました: " + data[i][displayNameIndex]);
        return {
          email: email,
          displayName: data[i][displayNameIndex],
          role: data[i][roleIndex]
        };
      }
    }
    
    // ユーザーマスターに存在しない場合はメールアドレスのみ返す
    Logger.log("ユーザーマスターに該当するユーザーが見つかりませんでした");
    return {
      email: email,
      displayName: email.split('@')[0],
      role: "user"
    };
  } catch (error) {
    // エラー発生時のフォールバック
    Logger.log("ユーザー情報取得エラー: " + error.message);
    return {
      email: "error@example.com",
      displayName: "エラー発生 - " + (error.message || "ユーザー情報取得に失敗しました"),
      role: "guest"
    };
  }
}

/**
 * マスターデータを取得
 */
function getMasterData() {
  try {
    // 置場マスターからデータを取得
    const locationSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOCATION_SHEET);
    const locationData = locationSheet.getDataRange().getValues();
    const locationHeader = locationData[0];
    
    const locations = [];
    for (let i = 1; i < locationData.length; i++) {
      if (locationData[i][0]) { // 空でない行のみ処理
        locations.push({
          name: locationData[i][0]
        });
      }
    }
    
    // 現場マスターからデータを取得
    const siteSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SITE_SHEET);
    const siteData = siteSheet.getDataRange().getValues();
    const siteHeader = siteData[0];
    
    const sites = [];
    for (let i = 1; i < siteData.length; i++) {
      if (siteData[i][0]) { // 空でない行のみ処理
        sites.push({
          name: siteData[i][0]
        });
      }
    }
    
    return {
      locations: locations,
      sites: sites
    };
  } catch (error) {
    Logger.log("マスターデータ取得エラー: " + error.message);
    return {
      locations: [],
      sites: [],
      error: error.message
    };
  }
}

/**
 * 機材リストを取得
 */
function getEquipmentList() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EQUIPMENT_SHEET);
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    
    Logger.log("機材リストのヘッダー: " + headerRow.join(", "));
    
    // カラムのインデックスを取得
    const idIndex = headerRow.indexOf('機器管理番号');
    const nameIndex = headerRow.indexOf('機器名称');
    const specIndex = headerRow.indexOf('仕様');
    const modelIndex = headerRow.indexOf('型番');
    const manufacturerIndex = headerRow.indexOf('メーカー');
    const serialIndex = headerRow.indexOf('シリアルNo');
    const quantityIndex = headerRow.indexOf('総台数');
    const nicknameIndex = headerRow.indexOf('呼称');
    const locationIndex = headerRow.indexOf('定置場所');
    const note1Index = headerRow.indexOf('備考1');
    const note2Index = headerRow.indexOf('備考2');
    
    // カラムが見つからない場合のエラーチェック
    if (idIndex === -1 || nameIndex === -1 || quantityIndex === -1) {
      Logger.log("必須カラムが見つかりません: idIndex=" + idIndex + ", nameIndex=" + nameIndex + ", quantityIndex=" + quantityIndex);
      return [];
    }
    
    const equipmentList = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // 空の行はスキップ
      if (!row[idIndex]) continue;
      
      equipmentList.push({
        id: row[idIndex],
        name: row[nameIndex],
        specification: specIndex > -1 ? row[specIndex] : '',
        model: modelIndex > -1 ? row[modelIndex] : '',
        manufacturer: manufacturerIndex > -1 ? row[manufacturerIndex] : '',
        serialNo: serialIndex > -1 ? row[serialIndex] : '',
        totalQuantity: row[quantityIndex],
        nickname: nicknameIndex > -1 ? row[nicknameIndex] : '',
        location: locationIndex > -1 ? row[locationIndex] : '',
        note1: note1Index > -1 ? row[note1Index] : '',
        note2: note2Index > -1 ? row[note2Index] : ''
      });
    }
    
    Logger.log("機材リスト取得完了: " + equipmentList.length + "件");
    return equipmentList;
  } catch (error) {
    Logger.log("機材リスト取得エラー: " + error.message);
    return [];
  }
}

/**
 * 貸出データを取得（改良版）
 */
function getRentalData() {
  try {
    Logger.log("===== 貸出データ取得を開始 =====");
    
    // スプレッドシートを取得
    let sheet;
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.getSheetByName(RENTAL_SHEET);
      
      if (!sheet) {
        Logger.log("貸出履歴シートが見つかりません: " + RENTAL_SHEET);
        return []; // シートがなければ空配列を返す
      }
    } catch (ssError) {
      Logger.log("スプレッドシート取得エラー: " + ssError.message);
      return []; // エラーの場合は空配列を返す
    }
    
    // データ範囲を取得
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    Logger.log("シート状態: 最終行=" + lastRow + ", 最終列=" + lastColumn);
    
    // データがない場合
    if (lastRow <= 1) {
      Logger.log("データがありません (ヘッダーのみ)");
      return [];
    }
    
    // データを取得
    const data = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    const headerRow = data[0];
    
    Logger.log("ヘッダー行: " + headerRow.join(", "));
    
    // カラムのインデックスを取得
    const idIndex = headerRow.indexOf('機器管理番号');
    const nameIndex = headerRow.indexOf('機器名称');
    const startDateIndex = headerRow.indexOf('借用開始日');
    const endDateIndex = headerRow.indexOf('借用終了日');
    const quantityIndex = headerRow.indexOf('数量');
    const siteIndex = headerRow.indexOf('使用場所');
    const borrowerIndex = headerRow.indexOf('借用者');
    const regDateIndex = headerRow.indexOf('登録日時');
    const statusIndex = headerRow.indexOf('ステータス');
    const returnDateIndex = headerRow.indexOf('返却日');
    
    Logger.log("カラムインデックス: ID=" + idIndex + 
              ", 名称=" + nameIndex + 
              ", 開始日=" + startDateIndex + 
              ", 終了日=" + endDateIndex);
    
    // カラムが見つからない場合のエラーチェック
    if (idIndex === -1 || nameIndex === -1 || startDateIndex === -1 || endDateIndex === -1) {
      Logger.log("必須カラムが見つかりません");
      return [];
    }
    
    const rentalData = [];
    
    // データ行の処理
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // 空の行はスキップ
      if (!row[idIndex]) {
        continue;
      }
      
      try {
        // 日付のフォーマット
        const formatDateValue = function(dateValue) {
          if (!dateValue) return null;
          
          try {
            // 既に日付オブジェクトならそのまま
            if (dateValue instanceof Date) {
              return Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            }
            
            // 文字列なら日付オブジェクトに変換
            const dateObj = new Date(dateValue);
            return Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          } catch (e) {
            Logger.log("日付変換エラー: " + e.message);
            return dateValue.toString();
          }
        };
        
        // 貸出データオブジェクトの作成
        const rental = {
          id: i, // 行番号をIDとして利用
          equipmentId: String(row[idIndex]),
          equipmentName: row[nameIndex] || '',
          startDate: formatDateValue(row[startDateIndex]),
          endDate: formatDateValue(row[endDateIndex]),
          quantity: quantityIndex > -1 ? (row[quantityIndex] || 1) : 1,
          site: siteIndex > -1 ? (row[siteIndex] || '') : '',
          borrower: borrowerIndex > -1 ? (row[borrowerIndex] || '') : '',
          registrationDate: regDateIndex > -1 ? (row[regDateIndex] || '') : '',
          status: statusIndex > -1 ? (row[statusIndex] || 'active') : 'active',
          returnDate: returnDateIndex > -1 && row[returnDateIndex] ? formatDateValue(row[returnDateIndex]) : null
        };
        
        rentalData.push(rental);
      } catch (rowError) {
        Logger.log("行の処理中にエラー: 行=" + i + ", エラー=" + rowError.message);
      }
    }
    
    Logger.log("貸出データ取得完了: " + rentalData.length + "件");
    
    // サンプル出力
    if (rentalData.length > 0) {
      Logger.log("サンプルデータ (最初の行): " + JSON.stringify(rentalData[0]));
    }
    
    return rentalData;
  } catch (error) {
    Logger.log("貸出データ取得エラー (全体): " + error.message);
    return [];
  }
}

/**
 * 複数の可能なカラム名から最初に見つかったインデックスを返す
 */
function findFirstIndex(headerRow, possibleNames) {
  for (const name of possibleNames) {
    const index = headerRow.indexOf(name);
    if (index !== -1) {
      return index;
    }
  }
  return -1; // 見つからない場合
}

/**
 * シンプルガントチャート用のタスクデータを取得
 */
function getSimpleGanttData() {
  try {
    // 貸出データと機材リストを取得
    const rentalData = getRentalData();
    const equipmentList = getEquipmentList();
    
    // アクティブな貸出データのみフィルタリング
    const activeRentals = rentalData.filter(rental => rental.status === 'active');
    
    // 機材ごとにグループ化したデータを準備
    const ganttTasks = [];
    const processedEquipment = {};
    
    // 各貸出データについて処理
    activeRentals.forEach(rental => {
      const equipmentId = rental.equipmentId;
      
      // この機材の親タスクがまだ作成されていない場合
      if (!processedEquipment[equipmentId]) {
        processedEquipment[equipmentId] = true;
        
        // この機材に関連するすべての貸出データを取得
        const relatedRentals = activeRentals.filter(r => r.equipmentId === equipmentId);
        
        if (relatedRentals.length > 0) {
          // 対応する機材情報を検索
          const equipment = equipmentList.find(eq => eq.id === equipmentId) || {
            name: relatedRentals[0].equipmentName
          };
          
          // 親タスク（機材）の開始日と終了日を計算
          const startDates = relatedRentals.map(r => new Date(r.startDate).getTime());
          const endDates = relatedRentals.map(r => new Date(r.endDate).getTime());
          
          const earliestStart = new Date(Math.min(...startDates));
          const latestEnd = new Date(Math.max(...endDates));
          
          // 親タスク（機材）を追加
          ganttTasks.push({
            id: equipmentId,
            name: equipment.name,
            start: formatDate(earliestStart),
            end: formatDate(latestEnd),
            progress: 100,
            custom_class: 'equipment-group'
          });
          
          // 子タスク（貸出）を追加
          relatedRentals.forEach(r => {
            ganttTasks.push({
              id: `rental_${r.id}`,
              name: `${r.quantity}台`,
              parent: equipmentId,
              site: r.site,
              start: r.startDate,
              end: r.endDate,
              progress: 100,
              borrower: r.borrower,
              custom_class: 'rental-bar'
            });
          });
        }
      }
    });
    
    return {
      success: true,
      tasks: ganttTasks
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'ガントチャートデータの生成中にエラーが発生しました'
    };
  }
}

/**
 * テスト用のサンプルデータを取得
 */
function getTestGanttData() {
  // 現在の日付
  const today = new Date();
  
  // 日付の設定ヘルパー関数
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return formatDate(result);
  }
  
  // サンプルデータ
  const tasks = [
    // 機材1とその貸出
    {
      id: "equipment1",
      name: "ビデオカメラA",
      start: addDays(today, -5),
      end: addDays(today, 15),
      progress: 100,
      custom_class: "equipment-group"
    },
    {
      id: "rental1",
      name: "撮影現場1 - 2台",
      parent: "equipment1",
      site: "撮影現場1",
      start: addDays(today, -5),
      end: addDays(today, 2),
      progress: 100
    },
    {
      id: "rental2",
      name: "撮影現場2 - 1台",
      parent: "equipment1",
      site: "撮影現場2",
      start: addDays(today, 5),
      end: addDays(today, 15),
      progress: 100
    },
    
    // 機材2とその貸出
    {
      id: "equipment2",
      name: "照明機材B",
      start: addDays(today, -2),
      end: addDays(today, 10),
      progress: 100,
      custom_class: "equipment-group"
    },
    {
      id: "rental3",
      name: "スタジオ1 - 3台",
      parent: "equipment2",
      site: "スタジオ1",
      start: addDays(today, -2),
      end: addDays(today, 3),
      progress: 100
    },
    {
      id: "rental4",
      name: "スタジオ2 - 2台",
      parent: "equipment2",
      site: "スタジオ2",
      start: addDays(today, 4),
      end: addDays(today, 10),
      progress: 100
    }
  ];
  
  return {
    success: true,
    tasks: tasks
  };
}

/**
 * 貸出データを保存
 */
function saveRental(rentalData) {
  try {
    Logger.log("===== 貸出データ保存処理を開始 =====");
    Logger.log("受信データ: " + JSON.stringify(rentalData));
    
    // バリデーション
    if (!rentalData || !rentalData.equipmentId || !rentalData.startDate || !rentalData.endDate || !rentalData.site) {
      Logger.log("必須項目が不足しています: " + JSON.stringify(rentalData));
      return { 
        success: false, 
        error: '必須項目が不足しています' 
      };
    }
    
    // スプレッドシートの取得部分
    let sheet;
    try {
      Logger.log("スプレッドシートIDを確認: " + SPREADSHEET_ID);
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      
      Logger.log("スプレッドシート名: " + ss.getName());
      Logger.log("シート名を確認: " + RENTAL_SHEET);
      
      sheet = ss.getSheetByName(RENTAL_SHEET);
      
      if (!sheet) {
        // シートが存在しなければ作成する
        Logger.log("貸出履歴シートが見つからないため作成します: " + RENTAL_SHEET);
        sheet = ss.insertSheet(RENTAL_SHEET);
        
        // ヘッダー行を設定
        const headers = ['機器管理番号', '機器名称', '借用開始日', '借用終了日', '数量', '使用場所', '借用者', '登録日時', 'ステータス', '返却日', '貸出元'];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        
        Logger.log("ヘッダー行を設定しました: " + headers.join(", "));
      }
    } catch (ssError) {
      Logger.log("スプレッドシート取得/作成エラー: " + ssError.message);
      return { 
        success: false, 
        error: 'スプレッドシート取得エラー: ' + ssError.message
      };
    }
    
    // シートの状態を確認
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    Logger.log("シート状態: 最終行=" + lastRow + ", 最終列=" + lastColumn);
    
    // ヘッダー行が存在しない場合は作成
    if (lastRow === 0) {
      Logger.log("ヘッダー行が見つからないため作成します");
      const headers = ['機器管理番号', '機器名称', '借用開始日', '借用終了日', '数量', '使用場所', '借用者', '登録日時', 'ステータス', '返却日', '貸出元'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // ヘッダー行の取得
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("ヘッダー行: " + headerRow.join(", "));
    
    // カラムのインデックスを取得
    const idIndex = headerRow.indexOf('機器管理番号') + 1;
    const nameIndex = headerRow.indexOf('機器名称') + 1;
    const startDateIndex = headerRow.indexOf('借用開始日') + 1;
    const endDateIndex = headerRow.indexOf('借用終了日') + 1;
    const quantityIndex = headerRow.indexOf('数量') + 1;
    const siteIndex = headerRow.indexOf('使用場所') + 1;
    const borrowerIndex = headerRow.indexOf('借用者') + 1;
    const regDateIndex = headerRow.indexOf('登録日時') + 1;
    const statusIndex = headerRow.indexOf('ステータス') + 1;
    
    Logger.log("カラムインデックス: ID=" + idIndex + 
              ", 名称=" + nameIndex + 
              ", 開始日=" + startDateIndex + 
              ", 終了日=" + endDateIndex + 
              ", 数量=" + quantityIndex + 
              ", 使用場所=" + siteIndex);
    
    // カラムのチェック - 必須カラムが見つからない場合はヘッダーを再作成
    if (idIndex <= 0 || nameIndex <= 0 || startDateIndex <= 0 || endDateIndex <= 0) {
      Logger.log("必須カラムが見つからないためヘッダーを再作成します");
      
      // ヘッダー行を設定
      const headers = ['機器管理番号', '機器名称', '借用開始日', '借用終了日', '数量', '使用場所', '借用者', '登録日時', 'ステータス', '返却日', '貸出元'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // インデックスを再計算
      headerRow = headers;
      idIndex = 1;
      nameIndex = 2;
      startDateIndex = 3;
      endDateIndex = 4;
      quantityIndex = 5;
      siteIndex = 6;
      borrowerIndex = 7;
      regDateIndex = 8;
      statusIndex = 9;
      
      Logger.log("ヘッダーを再作成しました");
    }
    
    // 新しい行を追加
    const newRow = sheet.getLastRow() + 1;
    Logger.log("新規追加行: " + newRow);
    
    // 行全体を一度に書き込む配列を作成
    const values = new Array(sheet.getLastColumn()).fill("");
    
    try {
      // 各カラムのデータを設定
      values[idIndex - 1] = rentalData.equipmentId;
      values[nameIndex - 1] = rentalData.equipmentName;
      
      // 日付の処理
      const startDate = new Date(rentalData.startDate);
      const endDate = new Date(rentalData.endDate);
      
      values[startDateIndex - 1] = startDate;
      values[endDateIndex - 1] = endDate;
      
      if (quantityIndex > 0) values[quantityIndex - 1] = rentalData.quantity || 1;
      if (siteIndex > 0) values[siteIndex - 1] = rentalData.site || '';
      if (borrowerIndex > 0) values[borrowerIndex - 1] = rentalData.borrower || '';
      if (regDateIndex > 0) values[regDateIndex - 1] = new Date();
      if (statusIndex > 0) values[statusIndex - 1] = 'active';
      
      // 行全体を一度に設定
      sheet.getRange(newRow, 1, 1, values.length).setValues([values]);
      
      Logger.log("行全体を一度に設定しました: " + values.join(", "));
    } catch (writeError) {
      Logger.log("データ書き込みエラー: " + writeError.message);
      return { 
        success: false, 
        error: 'データ書き込みエラー: ' + writeError.message
      };
    }
    
    // スプレッドシート保存を確実にするためのフラッシュ
    SpreadsheetApp.flush();
    Logger.log("スプレッドシートの変更をフラッシュしました");
    
    // データが正しく書き込まれたか確認
    try {
      const writtenData = sheet.getRange(newRow, 1, 1, values.length).getValues()[0];
      Logger.log("書き込まれたデータ: " + writtenData.join(", "));
    } catch (e) {
      Logger.log("書き込みデータの確認時にエラー: " + e.message);
    }
    
    Logger.log("===== 貸出データ保存完了: 行=" + newRow + " =====");
    
    // 成功時は結果オブジェクトを返す
    return { 
      success: true,
      message: '貸出データを保存しました',
      rentalId: newRow
    };
  } catch (error) {
    Logger.log("貸出データ保存エラー (全体): " + error.message);
    return { 
      success: false,
      error: '貸出データの保存に失敗しました: ' + error.message 
    };
  }
}

/**
 * 複数の可能なカラム名からインデックスを検索するヘルパー関数
 */
function findColumnIndex(headerRow, possibleNames) {
  for (const name of possibleNames) {
    const index = headerRow.indexOf(name);
    if (index !== -1) {
      return index + 1; // スプレッドシートは1から始まるため+1
    }
  }
  return 0; // 見つからない場合
}

/**
 * 機材データを保存
 */
function saveEquipment(equipmentData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EQUIPMENT_SHEET);
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // カラムのインデックスを取得
  const idIndex = headerRow.indexOf('機器管理番号') + 1;
  const nameIndex = headerRow.indexOf('機器名称') + 1;
  const specIndex = headerRow.indexOf('仕様') + 1;
  const modelIndex = headerRow.indexOf('型番') + 1;
  const manufacturerIndex = headerRow.indexOf('メーカー') + 1;
  const serialIndex = headerRow.indexOf('シリアルNo') + 1;
  const quantityIndex = headerRow.indexOf('総台数') + 1;
  const nicknameIndex = headerRow.indexOf('呼称') + 1;
  const locationIndex = headerRow.indexOf('定置場所') + 1;
  const note1Index = headerRow.indexOf('備考1') + 1;
  const note2Index = headerRow.indexOf('備考2') + 1;
  
  // 既存の機材かどうかをチェック
  const data = sheet.getDataRange().getValues();
  let existingRow = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex - 1] === equipmentData.id) {
      existingRow = i + 1; // インデックスは0から始まるが、行は1から始まる
      break;
    }
  }
  
  // 現在の機材データをバックアップ
  if (existingRow > 0) {
    backupEquipment('update', data[existingRow - 1]);
  }
  
  // 行番号の決定（既存の場合はその行、新規の場合は最終行の次）
  const rowToUpdate = existingRow > 0 ? existingRow : sheet.getLastRow() + 1;
  
  // データを書き込み
  sheet.getRange(rowToUpdate, idIndex).setValue(equipmentData.id);
  sheet.getRange(rowToUpdate, nameIndex).setValue(equipmentData.name);
  sheet.getRange(rowToUpdate, specIndex).setValue(equipmentData.specification);
  sheet.getRange(rowToUpdate, modelIndex).setValue(equipmentData.model);
  sheet.getRange(rowToUpdate, manufacturerIndex).setValue(equipmentData.manufacturer);
  sheet.getRange(rowToUpdate, serialIndex).setValue(equipmentData.serialNo);
  sheet.getRange(rowToUpdate, quantityIndex).setValue(equipmentData.totalQuantity);
  sheet.getRange(rowToUpdate, nicknameIndex).setValue(equipmentData.nickname);
  sheet.getRange(rowToUpdate, locationIndex).setValue(equipmentData.location);
  sheet.getRange(rowToUpdate, note1Index).setValue(equipmentData.note1);
  sheet.getRange(rowToUpdate, note2Index).setValue(equipmentData.note2);
  
  // 新規追加の場合はバックアップに追加
  if (existingRow <= 0) {
    backupEquipment('add', sheet.getRange(rowToUpdate, 1, 1, sheet.getLastColumn()).getValues()[0]);
  }
  
  // 成功時はtrueを返す
  return true;
}

/**
 * 貸出データを更新
 */
function updateRental(rentalData) {
  try {
    Logger.log("貸出データ更新開始: " + JSON.stringify(rentalData));
    
    if (!rentalData.id) {
      return { 
        success: false, 
        error: '貸出IDが指定されていません' 
      };
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RENTAL_SHEET);
    if (!sheet) {
      return { 
        success: false, 
        error: '貸出履歴シートが見つかりません' 
      };
    }
    
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // カラムのインデックスを取得
    const startDateIndex = headerRow.indexOf('借用開始日') + 1;
    const endDateIndex = headerRow.indexOf('借用終了日') + 1;
    const quantityIndex = headerRow.indexOf('数量') + 1;
    const siteIndex = headerRow.indexOf('使用場所') + 1;
    
    // IDは行番号として使用（GASの制約）
    const rowToUpdate = parseInt(rentalData.id);
    if (isNaN(rowToUpdate) || rowToUpdate < 1 || rowToUpdate > sheet.getLastRow()) {
      return { 
        success: false, 
        error: '無効な貸出IDです: ' + rentalData.id 
      };
    }
    
    // 日付データの変換
    let startDate, endDate;
    try {
      startDate = new Date(rentalData.startDate);
      endDate = new Date(rentalData.endDate);
      
      // 日付の妥当性チェック
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { 
          success: false, 
          error: '無効な日付形式です' 
        };
      }
    } catch (e) {
      Logger.log("日付変換エラー: " + e.message);
      return { 
        success: false, 
        error: '日付の変換に失敗しました: ' + e.message 
      };
    }
    
    // データを更新
    sheet.getRange(rowToUpdate, startDateIndex).setValue(startDate);
    sheet.getRange(rowToUpdate, endDateIndex).setValue(endDate);
    
    if (quantityIndex > 0 && rentalData.quantity)
      sheet.getRange(rowToUpdate, quantityIndex).setValue(rentalData.quantity);
    
    if (siteIndex > 0 && rentalData.site)
      sheet.getRange(rowToUpdate, siteIndex).setValue(rentalData.site);
    
    Logger.log("貸出データを更新しました: 行=" + rowToUpdate);
    
    // 成功時は結果オブジェクトを返す
    return { 
      success: true,
      message: '貸出データを更新しました'
    };
  } catch (error) {
    Logger.log("貸出データ更新エラー: " + error.message);
    return { 
      success: false, 
      error: '貸出データの更新に失敗しました: ' + error.message 
    };
  }
}

/**
 * 貸出期間を更新
 */
function updateRentalPeriod(rentalId, startDate, endDate) {
  // 入力値の検証
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RENTAL_SHEET);
    
    // 行番号が有効な範囲内かチェック
    const rowToUpdate = parseInt(rentalId);
    if (isNaN(rowToUpdate) || rowToUpdate < 1 || rowToUpdate > sheet.getLastRow()) {
      throw new Error('無効な貸出IDです: ' + rentalId);
    }
    
    // 日付の妥当性チェック
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error('無効な日付形式です: ' + startDate + ' または ' + endDate);
    }
    
    if (startDateObj > endDateObj) {
      throw new Error('開始日は終了日より前の日付である必要があります');
    }
    
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // カラムのインデックスを取得
    const startDateIndex = headerRow.indexOf('借用開始日') + 1;
    const endDateIndex = headerRow.indexOf('借用終了日') + 1;
    
    if (startDateIndex <= 0 || endDateIndex <= 0) {
      throw new Error('必要なカラムが見つかりません');
    }
    
    // 日付を更新
    sheet.getRange(rowToUpdate, startDateIndex).setValue(startDateObj);
    sheet.getRange(rowToUpdate, endDateIndex).setValue(endDateObj);
    
    // 成功時はtrueを返す
    return true;
  } catch (error) {
    Logger.log("貸出期間更新エラー: " + error.message);
    throw new Error("貸出期間の更新に失敗しました: " + error.message);
  }
}

/**
 * 機材返却処理
 */
function returnEquipment(rentalId, returnDate) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RENTAL_SHEET);
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // カラムのインデックスを取得
  const statusIndex = headerRow.indexOf('ステータス') + 1;
  const returnDateIndex = headerRow.indexOf('返却日') + 1;
  
  // 行番号は1から始まるため、+1ではなく直接変換
  const rowToUpdate = parseInt(rentalId);
  
  // ステータスと返却日を更新
  sheet.getRange(rowToUpdate, statusIndex).setValue('returned');
  sheet.getRange(rowToUpdate, returnDateIndex).setValue(new Date(returnDate));
  
  // 成功時はtrueを返す
  return true;
}

/**
 * 機材データのバックアップを保存
 */
function backupEquipment(operationType, equipmentData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BACKUP_SHEET);
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // カラムのインデックスを取得
  const dateIndex = headerRow.indexOf('操作日時') + 1;
  const typeIndex = headerRow.indexOf('操作タイプ') + 1;
  const idIndex = headerRow.indexOf('機器管理番号') + 1;
  const nameIndex = headerRow.indexOf('機器名称') + 1;
  const specIndex = headerRow.indexOf('仕様') + 1;
  const modelIndex = headerRow.indexOf('型番') + 1;
  const manufacturerIndex = headerRow.indexOf('メーカー') + 1;
  const serialIndex = headerRow.indexOf('シリアルNo') + 1;
  const quantityIndex = headerRow.indexOf('総台数') + 1;
  const nicknameIndex = headerRow.indexOf('呼称') + 1;
  const locationIndex = headerRow.indexOf('定置場所') + 1;
  const note1Index = headerRow.indexOf('備考1') + 1;
  const note2Index = headerRow.indexOf('備考2') + 1;
  const userIndex = headerRow.indexOf('操作ユーザー') + 1;
  
  // 新しい行を追加
  const newRow = sheet.getLastRow() + 1;
  
  // 機器リストのカラム順序と機器バックアップのカラム順序は一致しないため、個別に設定する必要がある
  // 機器リストのヘッダー行を取得
  const equipmentSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EQUIPMENT_SHEET);
  const equipmentHeaderRow = equipmentSheet.getRange(1, 1, 1, equipmentSheet.getLastColumn()).getValues()[0];
  
  // 機器リストのカラムインデックスを取得
  const eqIdIndex = equipmentHeaderRow.indexOf('機器管理番号');
  const eqNameIndex = equipmentHeaderRow.indexOf('機器名称');
  const eqSpecIndex = equipmentHeaderRow.indexOf('仕様');
  const eqModelIndex = equipmentHeaderRow.indexOf('型番');
  const eqManufacturerIndex = equipmentHeaderRow.indexOf('メーカー');
  const eqSerialIndex = equipmentHeaderRow.indexOf('シリアルNo');
  const eqQuantityIndex = equipmentHeaderRow.indexOf('総台数');
  const eqNicknameIndex = equipmentHeaderRow.indexOf('呼称');
  const eqLocationIndex = equipmentHeaderRow.indexOf('定置場所');
  const eqNote1Index = equipmentHeaderRow.indexOf('備考1');
  const eqNote2Index = equipmentHeaderRow.indexOf('備考2');
  
  // データを書き込み
  sheet.getRange(newRow, dateIndex).setValue(new Date());
  sheet.getRange(newRow, typeIndex).setValue(operationType);
  sheet.getRange(newRow, idIndex).setValue(equipmentData[eqIdIndex]);
  sheet.getRange(newRow, nameIndex).setValue(equipmentData[eqNameIndex]);
  sheet.getRange(newRow, specIndex).setValue(equipmentData[eqSpecIndex]);
  sheet.getRange(newRow, modelIndex).setValue(equipmentData[eqModelIndex]);
  sheet.getRange(newRow, manufacturerIndex).setValue(equipmentData[eqManufacturerIndex]);
  sheet.getRange(newRow, serialIndex).setValue(equipmentData[eqSerialIndex]);
  sheet.getRange(newRow, quantityIndex).setValue(equipmentData[eqQuantityIndex]);
  sheet.getRange(newRow, nicknameIndex).setValue(equipmentData[eqNicknameIndex]);
  sheet.getRange(newRow, locationIndex).setValue(equipmentData[eqLocationIndex]);
  sheet.getRange(newRow, note1Index).setValue(equipmentData[eqNote1Index]);
  sheet.getRange(newRow, note2Index).setValue(equipmentData[eqNote2Index]);
  sheet.getRange(newRow, userIndex).setValue(Session.getActiveUser().getEmail());
}

/**
 * 日付をフォーマット (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!date) return null;
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
/**
 * 現場を追加（改良版）
 * @param {string} siteName - 追加する現場名
 * @returns {Object} 処理結果
 */
function addSite(siteName) {
  try {
    // 引数の検証
    if (!siteName || siteName.trim() === '') {
      return { 
        success: false, 
        error: '現場名が入力されていません'
      };
    }
    
    // スプレッドシートを取得
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SITE_SHEET);
    if (!sheet) {
      return { 
        success: false, 
        error: '現場マスターシートが見つかりません' 
      };
    }
    
    // 現場データを取得
    const data = sheet.getDataRange().getValues();
    
    // 重複チェック
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === siteName) {
        return { 
          success: false, 
          error: '同じ名前の現場が既に存在します' 
        };
      }
    }
    
    // 新しい行を追加
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1).setValue(siteName);
    
    // ユーザー操作のログを記録
    Logger.log('現場を追加しました: ' + siteName + ' (ユーザー: ' + Session.getActiveUser().getEmail() + ')');
    
    return { 
      success: true, 
      message: '現場を追加しました',
      siteName: siteName
    };
  } catch (error) {
    Logger.log('現場追加エラー: ' + error.message);
    return { 
      success: false, 
      error: '現場の追加に失敗しました: ' + error.message 
    };
  }
}

/**
 * 複数の機器を削除
 */
function deleteEquipment(equipmentIds) {
  try {
    Logger.log("削除対象機器IDs: " + JSON.stringify(equipmentIds));
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EQUIPMENT_SHEET);
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    
    // 機器管理番号カラムのインデックスを取得
    const idIndex = headerRow.indexOf('機器管理番号');
    if (idIndex === -1) {
      throw new Error('機器管理番号カラムが見つかりません');
    }
    
    Logger.log("機器管理番号カラムインデックス: " + idIndex);
    
    // 削除する行の番号を収集
    const rowsToDelete = [];
    for (let i = 1; i < data.length; i++) {
      const currentId = data[i][idIndex];
      Logger.log(`行 ${i+1}: ID=${currentId}, タイプ=${typeof currentId}`);
      
      // 文字列化して比較（数値型IDと文字列型IDの両方に対応）
      if (equipmentIds.includes(currentId.toString())) {
        rowsToDelete.push(i + 1); // スプレッドシートの行番号は1から始まるが、配列は0から始まる
        Logger.log(`行 ${i+1} を削除対象に追加`);
      }
    }
    
    Logger.log("削除対象行: " + JSON.stringify(rowsToDelete));
    
    // 削除対象がない場合
    if (rowsToDelete.length === 0) {
      Logger.log("削除対象の行がありません");
      return { 
        success: false,
        error: '削除対象の機器が見つかりませんでした'
      };
    }
    
    // 行を削除（削除すると行番号がずれるため、大きい行番号から削除）
    rowsToDelete.sort((a, b) => b - a);
    for (const row of rowsToDelete) {
      Logger.log(`行 ${row} を削除します`);
      sheet.deleteRow(row);
    }
    
    Logger.log("機器削除完了");
    return { success: true };
  } catch (error) {
    Logger.log("機器削除エラー: " + error.message);
    return { 
      success: false,
      error: error.message 
    };
  }
}

/**
 * 機器追加処理（サーバー側）- 強化版エラーハンドリング
 */
function addEquipment(equipmentData) {
  try {
    // バリデーション強化
    if (!equipmentData || typeof equipmentData !== 'object') {
      return { 
        success: false, 
        error: '無効な機器データ形式です' 
      };
    }
    
    if (!equipmentData.name) {
      return { 
        success: false, 
        error: '機器名称は必須です' 
      };
    }
    
    if (!equipmentData.totalQuantity || isNaN(parseInt(equipmentData.totalQuantity))) {
      return { 
        success: false, 
        error: '有効な総台数を入力してください' 
      };
    }
    
    // 詳細なデバッグログ
    Logger.log("機器追加処理開始 - 受信データ: " + JSON.stringify(equipmentData));
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EQUIPMENT_SHEET);
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // カラムのインデックスを取得
    const idIndex = headerRow.indexOf('機器管理番号') + 1;
    const nameIndex = headerRow.indexOf('機器名称') + 1;
    const specIndex = headerRow.indexOf('仕様') + 1;
    const modelIndex = headerRow.indexOf('型番') + 1;
    const manufacturerIndex = headerRow.indexOf('メーカー') + 1;
    const serialIndex = headerRow.indexOf('シリアルNo') + 1;
    const quantityIndex = headerRow.indexOf('総台数') + 1;
    const nicknameIndex = headerRow.indexOf('呼称') + 1;
    const locationIndex = headerRow.indexOf('定置場所') + 1;
    const note1Index = headerRow.indexOf('備考1') + 1;
    const note2Index = headerRow.indexOf('備考2') + 1;
    
    // 必須カラムのチェック
    if (idIndex <= 0 || nameIndex <= 0 || quantityIndex <= 0) {
      Logger.log("必須カラムが見つかりません: " + 
                "機器管理番号=" + (idIndex-1) + 
                ", 機器名称=" + (nameIndex-1) + 
                ", 総台数=" + (quantityIndex-1));
      return {
        success: false,
        error: '必須カラムがスプレッドシートに見つかりませんでした'
      };
    }
    
    // カラムマッピングをログ出力
    Logger.log("カラムマッピング: " + JSON.stringify({
      '機器管理番号': idIndex,
      '機器名称': nameIndex,
      '仕様': specIndex,
      '型番': modelIndex,
      'メーカー': manufacturerIndex,
      'シリアルNo': serialIndex,
      '総台数': quantityIndex,
      '呼称': nicknameIndex,
      '定置場所': locationIndex,
      '備考1': note1Index,
      '備考2': note2Index
    }));
    
    // 新しい機器ID（最大値+1）を生成
    const data = sheet.getDataRange().getValues();
    let maxId = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex - 1]) {
        const currentId = parseInt(data[i][idIndex - 1]);
        if (!isNaN(currentId) && currentId > maxId) {
          maxId = currentId;
        }
      }
    }
    
    const newId = maxId + 1;
    Logger.log("新規機器ID: " + newId);
    
    // 新しい行を追加
    const newRow = sheet.getLastRow() + 1;
    
    // データ書き込み（null/undefined チェックを追加）
    const setCellValue = function(rowNum, colNum, value) {
      if (value !== undefined && value !== null) {
        sheet.getRange(rowNum, colNum).setValue(value);
      }
    };
    
    // 基本データのセット
    setCellValue(newRow, idIndex, newId);
    setCellValue(newRow, nameIndex, equipmentData.name);
    setCellValue(newRow, quantityIndex, parseInt(equipmentData.totalQuantity));
    
    // オプションデータのセット
    if (specIndex > 0) setCellValue(newRow, specIndex, equipmentData.specification || '');
    if (modelIndex > 0) setCellValue(newRow, modelIndex, equipmentData.model || '');
    if (manufacturerIndex > 0) setCellValue(newRow, manufacturerIndex, equipmentData.manufacturer || '');
    if (serialIndex > 0) setCellValue(newRow, serialIndex, equipmentData.serialNo || '');
    if (nicknameIndex > 0) setCellValue(newRow, nicknameIndex, equipmentData.alias || '');
    if (locationIndex > 0) setCellValue(newRow, locationIndex, equipmentData.location || '');
    if (note1Index > 0) setCellValue(newRow, note1Index, equipmentData.note1 || '');
    if (note2Index > 0) setCellValue(newRow, note2Index, equipmentData.note2 || '');
    
    Logger.log("機器追加完了: ID=" + newId);
    
    // 成功時は新しい機器IDを含めて返す
    return { 
      success: true,
      equipmentId: newId,
      message: '機器を追加しました（ID: ' + newId + '）'
    };
  } catch (error) {
    Logger.log("機器追加エラー: " + error.message + "\n" + error.stack);
    return { 
      success: false,
      error: error.message 
    };
  }
}

/**
 * 複数の現場を削除（改良版）
 * @param {Array} siteNames - 削除する現場名の配列
 * @returns {Object} 処理結果
 */
function deleteSites(siteNames) {
  try {
    // 引数の検証
    if (!Array.isArray(siteNames) || siteNames.length === 0) {
      return { 
        success: false, 
        error: '削除する現場が選択されていません'
      };
    }
    
    // スプレッドシートを取得
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SITE_SHEET);
    if (!sheet) {
      return { 
        success: false, 
        error: '現場マスターシートが見つかりません'
      };
    }
    
    // データ範囲の取得
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
    
    // 削除対象の行番号を特定
    const rowsToDelete = [];
    for (let i = 1; i < data.length; i++) {
      if (siteNames.includes(data[i][0])) {
        // スプレッドシートの行番号は1始まり、データ配列は0始まりなので調整
        rowsToDelete.push(i + 1);
      }
    }
    
    // 削除対象がない場合
    if (rowsToDelete.length === 0) {
      return { 
        success: false, 
        error: '指定された現場が見つかりませんでした'
      };
    }


/**
 * 機器リストシートの検出と必要に応じた作成
 */
function ensureEquipmentSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      Logger.log("スプレッドシートが見つかりません: " + SPREADSHEET_ID);
      return {
        success: false,
        error: "スプレッドシートが見つかりません"
      };
    }
    
    // シート定数の値を確認
    Logger.log("EQUIPMENT_SHEETの値: " + EQUIPMENT_SHEET);
    
    // すべてのシートを取得して名前を確認
    const allSheets = ss.getSheets();
    const sheetNames = allSheets.map(sheet => sheet.getName());
    Logger.log("シート一覧: " + sheetNames.join(", "));
    
    // シートの検索（優先順位順）
    const sheetNameOptions = [
      EQUIPMENT_SHEET,
      "機器リスト",
      "機材リスト",
      "設備機材リスト",
      "Equipment",
      "equipment_list"
    ];
    
    let equipmentSheet = null;
    let usedSheetName = null;
    
    // 既存のシートを検索
    for (const name of sheetNameOptions) {
      if (!name) continue; // 空や未定義の名前はスキップ
      
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        equipmentSheet = sheet;
        usedSheetName = name;
        Logger.log(`機器リストシートを発見: ${name}`);
        break;
      }
    }
    
    // シートがない場合は新規作成
    if (!equipmentSheet) {
      // 作成する名前を決定
      const newSheetName = EQUIPMENT_SHEET || "機器リスト";
      
      Logger.log(`機器リストシートを新規作成: ${newSheetName}`);
      equipmentSheet = ss.insertSheet(newSheetName);
      usedSheetName = newSheetName;
      
      // ヘッダー行を設定
      const headers = [
        "機器管理番号", "機器名称", "仕様", "型番", "メーカー", 
        "シリアルNo", "総台数", "呼称", "定置場所", "備考1", "備考2"
      ];
      
      // ヘッダー行のスタイル設定
      const headerRange = equipmentSheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setBackground('#f3f3f3');
      headerRange.setFontWeight('bold');
      
      // 列幅の自動調整
      for (let i = 1; i <= headers.length; i++) {
        equipmentSheet.autoResizeColumn(i);
      }
      
      Logger.log("ヘッダー行を設定しました");
    }
    
    return {
      success: true,
      sheetName: usedSheetName,
      isNewSheet: usedSheetName !== (EQUIPMENT_SHEET || "機器リスト"),
      headers: equipmentSheet.getRange(1, 1, 1, equipmentSheet.getLastColumn()).getValues()[0]
    };
  } catch (error) {
    Logger.log("シート検出・作成エラー: " + error.message);
    Logger.log("スタックトレース: " + error.stack);
    
    return {
      success: false,
      error: "シートの検出または作成中にエラーが発生しました: " + error.message
    };
  }
}

/**
 * 機器リストシートの診断情報取得
 * (デバッグ用の機能)
 */
function diagnoseSheetIssue() {
  try {
    Logger.log("診断処理を開始");
    
    // スプレッドシートIDの確認
    const spreadsheetId = SPREADSHEET_ID || "[IDが設定されていません]";
    Logger.log("スプレッドシートID: " + spreadsheetId);
    
    // 定数定義の確認
    let constants = [];
    if (typeof EQUIPMENT_SHEET !== 'undefined') constants.push("EQUIPMENT_SHEET = " + EQUIPMENT_SHEET);
    if (typeof RENTAL_SHEET !== 'undefined') constants.push("RENTAL_SHEET = " + RENTAL_SHEET);
    if (typeof LOCATION_SHEET !== 'undefined') constants.push("LOCATION_SHEET = " + LOCATION_SHEET);
    if (typeof SITE_SHEET !== 'undefined') constants.push("SITE_SHEET = " + SITE_SHEET);
    
    Logger.log("定義されている定数: " + constants.join(", "));
    
    // スプレッドシートを開く
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      Logger.log("スプレッドシートを開きました: " + spreadsheet.getName());
    } catch (e) {
      return {
        success: false,
        error: "スプレッドシートを開けませんでした: " + e.message,
        spreadsheetId: spreadsheetId,
        constants: constants
      };
    }
    
    // シート情報を取得
    const sheets = spreadsheet.getSheets();
    const sheetInfo = sheets.map(s => ({
      name: s.getName(),
      rows: s.getLastRow(),
      cols: s.getLastColumn()
    }));
    
    Logger.log("シート情報: " + JSON.stringify(sheetInfo));
    
    // アクセス権のテスト
    let writePermission = false;
    try {
      // テスト用の一時シートを作成
      const testSheet = spreadsheet.insertSheet("___temp_test___");
      testSheet.getRange(1, 1).setValue("test");
      spreadsheet.deleteSheet(testSheet);
      writePermission = true;
      Logger.log("書き込み権限あり");
    } catch (e) {
      Logger.log("書き込み権限なし: " + e.message);
    }
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      spreadsheetName: spreadsheet.getName(),
      constants: constants,
      sheets: sheetInfo,
      writePermission: writePermission
    };
  } catch (error) {
    Logger.log("診断処理エラー: " + error.message);
    return {
      success: false,
      error: "診断中にエラーが発生しました: " + error.message
    };
  }
}
/**
 * シンプルな機器追加機能（直接修正版）
 */
function addEquipmentDirect(data) {
  try {
    // データの基本チェック
    if (!data || !data.name || !data.totalQuantity) {
      return { 
        success: false, 
        error: "機器名称と総台数は必須です" 
      };
    }
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log("スプレッドシートを開きました: " + ss.getName());
    
    // 機器リストシート取得
    const sheet = ss.getSheetByName(EQUIPMENT_SHEET);
    if (!sheet) {
      Logger.log("シート名が見つかりません: " + EQUIPMENT_SHEET);
      return { 
        success: false, 
        error: "機器リストシートが見つかりません" 
      };
    }
    
    // 新規IDを生成
    const lastRow = sheet.getLastRow();
    let maxId = 0;
    
    if (lastRow > 1) {
      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < idValues.length; i++) {
        if (idValues[i][0] && !isNaN(parseInt(idValues[i][0]))) {
          const id = parseInt(idValues[i][0]);
          if (id > maxId) maxId = id;
        }
      }
    }
    
    const newId = maxId + 1;
    Logger.log("新規ID: " + newId);
    
    // 新しい行を追加
    const newRowIndex = lastRow + 1;
    const newRowData = [
      newId,                     // 機器管理番号
      data.name,                 // 機器名称
      data.specification || "",  // 仕様
      data.model || "",          // 型番
      data.manufacturer || "",   // メーカー
      data.serialNo || "",       // シリアルNo
      data.totalQuantity,        // 総台数
      data.alias || "",          // 呼称
      data.location || "",       // 定置場所
      data.note1 || "",          // 備考1
      data.note2 || ""           // 備考2
    ];
    
    // 一括で行に書き込み
    sheet.getRange(newRowIndex, 1, 1, newRowData.length).setValues([newRowData]);
    
    return { 
      success: true, 
      message: "機器を追加しました（ID: " + newId + "）", 
      id: newId 
    };
  } catch (error) {
    Logger.log("機器追加エラー: " + error.message + "\n" + error.stack);
    return { 
      success: false, 
      error: "機器追加エラー: " + error.message 
    };
  }
}

/**
 * 機器追加機能（ブリッジ関数）
 * クライアントからの呼び出しと実装関数の橋渡しをします
 */
function saveEquipment(data) {
  try {
    Logger.log("saveEquipment関数が呼び出されました");
    
    // データフィールド名の変換
    const convertedData = {
      name: data.name,
      totalQuantity: data.totalQuantity,
      specification: data.specification,
      model: data.model,
      manufacturer: data.manufacturer,
      serialNo: data.serialNumber,  // serialNumber → serialNo に変換
      alias: data.alias,
      location: data.location,
      note1: data.note1,
      note2: data.note2
    };
    
    Logger.log("変換後のデータ: " + JSON.stringify(convertedData));
    
    // 実際の処理関数を呼び出し
    return addEquipmentDirect(convertedData);
  } catch (error) {
    Logger.log("saveEquipment呼び出しエラー: " + error.message + "\n" + error.stack);
    return {
      success: false,
      error: "機器の追加に失敗しました: " + error.message
    };
  }
}

/**
 * シート情報の取得（デバッグ用）
 */
function getSheetInfo() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);
    
    if (!sheet) {
      return "貸出履歴シートが見つかりません。";
    }
    
    // シートの基本情報
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    const info = `貸出履歴シート: 行数=${lastRow}, 列数=${lastColumn}`;
    
    // ヘッダー行の取得
    let headerInfo = "";
    if (lastRow > 0 && lastColumn > 0) {
      const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
      headerInfo = "ヘッダー: " + headerRow.join(", ");
    } else {
      headerInfo = "ヘッダーがありません";
    }
    
    // データ量の情報
    let dataInfo = "";
    if (lastRow > 1) {
      dataInfo = `データ行数: ${lastRow - 1}行`;
      
      // サンプルデータ（最初の3行）
      if (lastRow > 1 && lastColumn > 0) {
        const sampleData = sheet.getRange(2, 1, Math.min(3, lastRow - 1), lastColumn).getValues();
        dataInfo += "\nサンプルデータ: " + JSON.stringify(sampleData);
      }
    } else {
      dataInfo = "データがありません";
    }
    
    return `${info}\n${headerInfo}\n${dataInfo}`;
  } catch (error) {
    return "シート情報取得エラー: " + error.message;
  }
}

/**
 * さらに強化された機器追加機能 (シート名問題対応版)
 */
function addEquipmentSimple(data) {
  try {
    Logger.log("機器追加処理開始 (強化版): " + JSON.stringify(data));
    
    // 必須項目の検証
    if (!data.name || !data.totalQuantity) {
      return {
        success: false,
        error: "機器名称と総台数は必須です"
      };
    }
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      Logger.log("スプレッドシートが見つかりません: " + SPREADSHEET_ID);
      return {
        success: false,
        error: "スプレッドシートが見つかりません"
      };
    }
    Logger.log("スプレッドシートを開きました: " + ss.getName());
    
    // すべてのシートを取得して名前を確認
    const allSheets = ss.getSheets();
    const sheetNames = allSheets.map(sheet => sheet.getName());
    Logger.log("スプレッドシート内のシート: " + sheetNames.join(", "));
    
    // 機器リストシートを取得する (EQUIPMENT_SHEET定数または直接名前で)
    let sheet = null;
    
    // まずEQUIPMENT_SHEETを使用
    if (typeof EQUIPMENT_SHEET !== 'undefined') {
      sheet = ss.getSheetByName(EQUIPMENT_SHEET);
      Logger.log("EQUIPMENT_SHEET定数を使用: " + EQUIPMENT_SHEET);
    }
    
    // 見つからなければ「機器リスト」という名前で検索
    if (!sheet) {
      sheet = ss.getSheetByName('機器リスト');
      Logger.log("「機器リスト」という名前でシートを検索");
    }
    
    // それでも見つからなければシート一覧から機器関連のシートを探す
    if (!sheet) {
      const possibleNames = ["機器リスト", "機材リスト", "equipment", "Equipment", "機器マスター", "機材マスター"];
      for (const name of possibleNames) {
        const foundSheet = ss.getSheetByName(name);
        if (foundSheet) {
          sheet = foundSheet;
          Logger.log("代替シート名で発見: " + name);
          break;
        }
      }
    }
    
    // それでも見つからなければ最初のシートを使用（最終手段）
    if (!sheet && allSheets.length > 0) {
      sheet = allSheets[0];
      Logger.log("最初のシートを使用: " + sheet.getName());
    }
    
    // シートが見つからない場合
    if (!sheet) {
      return {
        success: false,
        error: "機器リストシートが見つかりません",
        availableSheets: sheetNames
      };
    }
    
    Logger.log("使用するシート: " + sheet.getName());
    
    // ヘッダー行を取得して確認
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("ヘッダー行: " + headerRow.join(", "));
    
    // 最大IDを取得してインクリメント
    const lastRow = sheet.getLastRow();
    let maxId = 0;
    
    if (lastRow > 1) {
      const idColumn = 1; // 機器管理番号は1列目と仮定
      const idRange = sheet.getRange(2, idColumn, lastRow - 1, 1);
      const idValues = idRange.getValues();
      
      for (const row of idValues) {
        if (row[0] && !isNaN(parseInt(row[0]))) {
          const id = parseInt(row[0]);
          if (id > maxId) {
            maxId = id;
          }
        }
      }
    }
    
    const newId = maxId + 1;
    Logger.log("新規機器ID: " + newId);
    
    // 新しい行を追加
    const newRowIndex = lastRow + 1;
    
    // 安全に値を設定する関数
    const safeSetValue = function(row, col, value) {
      try {
        sheet.getRange(row, col).setValue(value);
        return true;
      } catch (e) {
        Logger.log(`セル(${row},${col})への書き込みエラー: ${e.message}`);
        return false;
      }
    };
    
    // データを行に書き込む
    let writeSuccess = true;
    
    // 機器管理番号を設定
    if (!safeSetValue(newRowIndex, 1, newId)) writeSuccess = false;
    
    // 機器名称を設定
    if (!safeSetValue(newRowIndex, 2, data.name)) writeSuccess = false;
    
    // 仕様を設定
    if (!safeSetValue(newRowIndex, 3, data.specification || "")) writeSuccess = false;
    
    // 型番を設定
    if (!safeSetValue(newRowIndex, 4, data.model || "")) writeSuccess = false;
    
    // メーカーを設定
    if (!safeSetValue(newRowIndex, 5, data.manufacturer || "")) writeSuccess = false;
    
    // シリアルNoを設定
    if (!safeSetValue(newRowIndex, 6, data.serialNo || "")) writeSuccess = false;
    
    // 総台数を設定
    if (!safeSetValue(newRowIndex, 7, data.totalQuantity)) writeSuccess = false;
    
    // 呼称を設定
    if (!safeSetValue(newRowIndex, 8, data.alias || "")) writeSuccess = false;
    
    // 定置場所を設定
    if (!safeSetValue(newRowIndex, 9, data.location || "")) writeSuccess = false;
    
    // 備考1を設定
    if (!safeSetValue(newRowIndex, 10, data.note1 || "")) writeSuccess = false;
    
    // 備考2を設定
    if (!safeSetValue(newRowIndex, 11, data.note2 || "")) writeSuccess = false;
    
    if (!writeSuccess) {
      Logger.log("一部のデータの書き込みに失敗しました");
      return {
        success: false,
        error: "データの一部が書き込めませんでした",
        partialSuccess: true,
        id: newId
      };
    }
    
    Logger.log("新規機器データを追加しました: " + newId);
    return {
      success: true,
      message: "機器を追加しました（ID: " + newId + "）",
      id: newId
    };
    
  } catch (error) {
    // 詳細なエラー情報をログに記録
    Logger.log("機器追加エラー: " + error.message);
    Logger.log("スタックトレース: " + error.stack);
    
    return {
      success: false,
      error: "機器の追加中にエラーが発生しました: " + error.message,
      stack: error.stack
    };
  }
}
    // 貸出データの参照チェック
    // この部分は実装するかどうかをカスタマイズ可能
    
    // 降順ソート（大きい行番号から順に削除してずれを回避）
    rowsToDelete.sort((a, b) => b - a);
    
    // 行を削除
    for (const row of rowsToDelete) {
      sheet.deleteRow(row);
    }
    
    // ユーザー操作のログを記録
    Logger.log(rowsToDelete.length + '件の現場を削除しました (ユーザー: ' + Session.getActiveUser().getEmail() + ')');
    
    return { 
      success: true, 
      message: rowsToDelete.length + '件の現場を削除しました',
      deletedCount: rowsToDelete.length,
      deletedSites: siteNames
    };
  } catch (error) {
    Logger.log('現場削除エラー: ' + error.message);
    return { 
      success: false, 
      error: '現場の削除に失敗しました: ' + error.message
    };
  }
}