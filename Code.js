// Code.gs
/**
 * スプレッドシートの初期設定を行う関数
 */
function setupSpreadsheet() {
  // 新しいスプレッドシートを作成
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 機器リストタブの設定
  let equipmentSheet = ss.getSheetByName('機器リスト');
  if (!equipmentSheet) {
    equipmentSheet = ss.insertSheet('機器リスト');
  }
  
  // 機器リストのヘッダー設定
  const equipmentHeaders = [
    '機器管理番号', '機器名称', '仕様', '型番', 'メーカー', 'シリアルNo', 
    '総台数', '呼称', '定置場所', '備考1', '備考2'
  ];
  equipmentSheet.getRange(1, 1, 1, equipmentHeaders.length).setValues([equipmentHeaders]);
  equipmentSheet.getRange(1, 1, 1, equipmentHeaders.length).setBackground('#f3f3f3').setFontWeight('bold');
  
  // 貸出履歴タブの設定
  let rentalSheet = ss.getSheetByName('貸出履歴');
  if (!rentalSheet) {
    rentalSheet = ss.insertSheet('貸出履歴');
  }
  
  // 貸出履歴のヘッダー設定
  const rentalHeaders = [
    '機器管理番号', '機器名称', '借用開始日', '借用終了日', '数量', 
    '使用場所', '借用者', '登録日時', 'ステータス', '返却日'
  ];
  rentalSheet.getRange(1, 1, 1, rentalHeaders.length).setValues([rentalHeaders]);
  rentalSheet.getRange(1, 1, 1, rentalHeaders.length).setBackground('#f3f3f3').setFontWeight('bold');
  
  // 定置場所マスタータブの設定
  let locationsSheet = ss.getSheetByName('定置場所マスター');
  if (!locationsSheet) {
    locationsSheet = ss.insertSheet('定置場所マスター');
  }
  
  // 定置場所マスターのヘッダー設定
  const locationHeaders = ['定置場所'];
  locationsSheet.getRange(1, 1, 1, locationHeaders.length).setValues([locationHeaders]);
  locationsSheet.getRange(1, 1, 1, locationHeaders.length).setBackground('#f3f3f3').setFontWeight('bold');
  
  // 現場マスタータブの設定（新規追加）
  let projectsSheet = ss.getSheetByName('現場マスター');
  if (!projectsSheet) {
    projectsSheet = ss.insertSheet('現場マスター');
  }
  
  // 現場マスターのヘッダー設定
  const projectHeaders = ['現場名', '作成日'];
  projectsSheet.getRange(1, 1, 1, projectHeaders.length).setValues([projectHeaders]);
  projectsSheet.getRange(1, 1, 1, projectHeaders.length).setBackground('#f3f3f3').setFontWeight('bold');
  
  // ユーザーマスタータブの設定（新規追加）
  let usersSheet = ss.getSheetByName('ユーザーマスター');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('ユーザーマスター');
    
    // サンプルユーザーを追加
    const userHeaders = ['メールアドレス', '表示名', '権限'];
    usersSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
    usersSheet.getRange(1, 1, 1, userHeaders.length).setBackground('#f3f3f3').setFontWeight('bold');
    
    // 実行ユーザーを管理者として追加
    const email = Session.getActiveUser().getEmail();
    if (email && email !== "") {
      usersSheet.appendRow([email, '管理者', 'admin']);
    }
  }
  
  // 機器バックアップタブの設定（新規追加）
  let equipmentBackupSheet = ss.getSheetByName('機器バックアップ');
  if (!equipmentBackupSheet) {
    equipmentBackupSheet = ss.insertSheet('機器バックアップ');
    
    // バックアップヘッダー設定
    const backupHeaders = [
      '操作日時', '操作タイプ', '機器管理番号', '機器名称', '仕様', '型番', 'メーカー', 'シリアルNo', 
      '総台数', '呼称', '定置場所', '備考1', '備考2', '操作ユーザー'
    ];
    equipmentBackupSheet.getRange(1, 1, 1, backupHeaders.length).setValues([backupHeaders]);
    equipmentBackupSheet.getRange(1, 1, 1, backupHeaders.length).setBackground('#f3f3f3').setFontWeight('bold');
  }
  
  // データの検証と書式設定
  setupDataValidation(equipmentSheet);
  formatDateColumns(rentalSheet);
  
  // スプレッドシートの作成が完了したことをユーザーに通知
  SpreadsheetApp.getUi().alert('スプレッドシートの初期設定が完了しました。');
}

/**
 * データの検証ルールを設定する関数
 */
function setupDataValidation(sheet) {
  // 総台数のセルは数値のみ許可
  const dataRange = sheet.getRange(2, 7, 1000, 1); // G列（総台数）
  const rule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 10000)
    .setAllowInvalid(false)
    .setHelpText('1以上の数値を入力してください')
    .build();
  dataRange.setDataValidation(rule);
  
  // 数値形式に設定
  dataRange.setNumberFormat("0");
}

/**
 * 日付関連のカラムに日付フォーマットを適用する関数
 */
function formatDateColumns(sheet) {
  // 借用開始日、借用終了日、登録日時、返却日のカラムに日付フォーマットを適用
  sheet.getRange(2, 3, 1000, 1).setNumberFormat('yyyy/MM/dd'); // 借用開始日
  sheet.getRange(2, 4, 1000, 1).setNumberFormat('yyyy/MM/dd'); // 借用終了日
  sheet.getRange(2, 8, 1000, 1).setNumberFormat('yyyy/MM/dd HH:mm:ss'); // 登録日時
  sheet.getRange(2, 10, 1000, 1).setNumberFormat('yyyy/MM/dd'); // 返却日
}

/**
 * メニュー項目を追加する関数
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('機材管理')
    .addItem('初期設定', 'setupSpreadsheet')
    .addItem('貸出管理画面を開く', 'openRentalUI')
    .addToUi();
}

/**
 * Webアプリケーションとして公開されたときに最初に呼ばれる関数
 */
function doGet(e) {
  try {
    // ユーザー情報取得
    const user = Session.getActiveUser();
    const email = user.getEmail();
    
    // ユーザーが認証されていない場合は認証ページを表示
    if (!email || email === "") {
      // 認証に必要なスコープを要求するURL
      const authUrl = ScriptApp.getService().getUrl();
      
      // 認証ページを表示
      return HtmlService.createHtmlOutput(`
        <html>
          <head>
            <title>認証が必要です</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .auth-container { max-width: 500px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; border-radius: 5px; }
              .btn { display: inline-block; background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
              h2 { color: #333; }
              .info { color: #666; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="auth-container">
              <h2>認証が必要です</h2>
              <p>このアプリケーションを使用するには、Googleアカウントでのログインが必要です。</p>
              <p class="info">ログインすると、アプリケーションがあなたのメールアドレスにアクセスします。</p>
              <p><a class="btn" href="${authUrl}">ログインして続ける</a></p>
            </div>
          </body>
        </html>
      `)
      .setTitle('認証が必要です')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // ユーザーマスターチェック
    const isUserRegistered = checkUserInMaster(email);
    
    if (!isUserRegistered) {
      // ユーザーが登録されていない場合
      console.log(`未登録ユーザーのアクセス拒否: ${email}`);
      return HtmlService.createHtmlOutput(`
        <html>
          <head>
            <title>アクセス権限がありません</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .auth-container { max-width: 500px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; border-radius: 5px; }
              .error { color: #d32f2f; }
              .contact { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="auth-container">
              <h2 class="error">アクセス権限がありません</h2>
              <p>このアプリケーションにアクセスする権限がありません。</p>
              <p>ログインメールアドレス: <strong>${email}</strong></p>
              <div class="contact">
                <p>管理者に連絡して、アクセス権限を付与してもらってください。</p>
                <p><a href="#" onclick="google.script.host.close()">閉じる</a></p>
              </div>
            </div>
          </body>
        </html>
      `)
      .setTitle('アクセス権限がありません')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // パラメータに基づいてアクションを実行
    if (e.parameter.action) {
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      
      let responseData = {};
      
      switch (e.parameter.action) {
        case 'getUserInfo':
          responseData = getUserInfo();
          break;
        case 'getEquipmentList':
          responseData = getEquipmentList();
          break;
        case 'getRentalData':
          responseData = getRentalData();
          break;
        case 'getLocationsList':
          responseData = getLocationsList();
          break;
        case 'getProjectsList':
          responseData = getProjectsList();
          break;
        default:
          responseData = { error: "Unknown action" };
      }
      
      output.setContent(JSON.stringify(responseData));
      return output;
    }
    
    // 通常はHTMLを返す
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('機材貸出管理システム')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    // エラーが発生した場合はエラーページを表示
    console.error('doGetエラー:', error);
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <title>エラーが発生しました</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .error-container { max-width: 500px; margin: 0 auto; border: 1px solid #f44336; padding: 20px; border-radius: 5px; }
            .error-title { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h2 class="error-title">エラーが発生しました</h2>
            <p>アプリケーションの読み込み中にエラーが発生しました。</p>
            <p>エラー詳細: ${error.toString()}</p>
            <p><a href="${ScriptApp.getService().getUrl()}">再試行する</a></p>
          </div>
        </body>
      </html>
    `)
    .setTitle('エラーが発生しました');
  }
}

/**
 * ユーザーがマスターに登録されているかをチェックする専用関数
 * 認証処理とマスターチェックを明確に分離
 */
function checkUserInMaster(email) {
  try {
    if (!email || email === "") {
      return false;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName('ユーザーマスター');
    
    if (!userSheet) {
      console.error('ユーザーマスターシートが見つかりません');
      return false;
    }
    
    const lastRow = userSheet.getLastRow();
    if (lastRow <= 1) {
      console.warn('ユーザーマスターが空です');
      return false;
    }
    
    const userEmails = userSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    // メールアドレスの列で一致するものを検索
    for (let i = 0; i < userEmails.length; i++) {
      if (userEmails[i][0] === email) {
        console.log(`登録済みユーザー確認: ${email}`);
        return true;
      }
    }
    
    // 一致するメールアドレスが見つからなかった
    console.log(`未登録ユーザー: ${email}`);
    return false;
    
  } catch (error) {
    console.error('ユーザーマスターチェックエラー:', error);
    return false;
  }
}

/**
 * Webアプリケーションとして公開された場合のPOST処理
 */
function doPost(e) {
  // CORS設定
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // リクエストデータを解析
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    let responseData = {};
    
    switch (action) {
      case 'saveRental':
        responseData = saveRental(data);
        break;
      case 'saveReturn':
        responseData = saveReturn(data);
        break;
      case 'deleteRental':
        responseData = deleteRental(data.rentalId);
        break;
      case 'undoReturn':
        responseData = undoReturn(data.rentalId);
        break;
      case 'addProject':
        responseData = addProject(data);
        break;
      case 'deleteProjects':
        responseData = deleteProjects(data);
        break;
      case 'addEquipment':
        responseData = addEquipment(data);
        break;
      case 'deleteEquipments':
        responseData = deleteEquipments(data);
        break;
      case 'undoEquipmentDelete':
        responseData = undoEquipmentDelete(data.timestamp);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }
    
    output.setContent(JSON.stringify(responseData));
    return output;
    
  } catch (error) {
    console.error('Error in doPost:', error);
    output.setContent(JSON.stringify({
      success: false,
      error: error.toString()
    }));
    return output;
  }
}

/**
 * ユーザー情報取得関数 - 信頼性向上版
 */
function getUserInfo() {
  try {
    // 必ず現在のセッションからユーザー情報を取得
    const user = Session.getActiveUser();
    const email = user.getEmail();
    
    // メールが取得できない場合は未認証
    if (!email || email === "") {
      return {
        email: "guest@example.com",
        name: "ゲスト",
        authenticated: false,
        isRegistered: false,
        timestamp: new Date().toISOString(),
        debug: "メールアドレスが取得できません。未認証ユーザーです。"
      };
    }
    
    // ユーザーマスターシートを確認
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName('ユーザーマスター');
    
    // ユーザーマスターの基本チェック
    if (!userSheet) {
      return {
        email: email,
        name: email.split('@')[0],
        authenticated: true,
        isRegistered: false,
        timestamp: new Date().toISOString(),
        debug: "ユーザーマスターシートが見つかりません"
      };
    }
    
    // ユーザーマスターでの検索
    const lastRow = userSheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        email: email,
        name: email.split('@')[0],
        authenticated: true,
        isRegistered: false,
        timestamp: new Date().toISOString(),
        debug: "ユーザーマスターが空です"
      };
    }
    
    // ユーザーデータを取得
    const userEmails = userSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const userData = userSheet.getRange(2, 1, lastRow - 1, 3).getValues();
    
    // ユーザーマスターで検索
    for (let i = 0; i < userEmails.length; i++) {
      if (userEmails[i][0] === email) {
        // 登録ユーザーが見つかった
        return {
          email: email,
          name: userData[i][1] && userData[i][1] !== "" ? userData[i][1] : email.split('@')[0],
          role: userData[i][2] || "user",
          authenticated: true,
          isRegistered: true,
          timestamp: new Date().toISOString(),
          debug: "登録ユーザーが見つかりました"
        };
      }
    }
    
    // マスターに存在しないユーザー
    return {
      email: email,
      name: email.split('@')[0],
      authenticated: true,
      isRegistered: false,
      timestamp: new Date().toISOString(),
      debug: "ユーザーはマスターに登録されていません"
    };
    
  } catch (error) {
    console.error('ユーザー情報の取得に失敗しました', error);
    
    // エラーが発生しても最低限の情報を返す
    return {
      email: "guest@example.com",
      name: "ゲスト",
      authenticated: false,
      isRegistered: false,
      error: error.toString(),
      timestamp: new Date().toISOString(),
      debug: "エラーが発生しました: " + error.toString()
    };
  }
}

/**
 * 機材リストを取得する関数
 */
function getEquipmentList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('機器リスト');
    
    if (!sheet) {
      throw new Error('機器リストシートが見つかりません');
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return []; // ヘッダーのみの場合は空配列を返す
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    
    // データをオブジェクト配列に変換
    const equipmentList = data.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      
      // 総台数が文字列の場合は数値に変換
      if (typeof item['総台数'] === 'string') {
        item['総台数'] = parseInt(item['総台数']) || 0;
      }
      
      return item;
    });
    
    // デバッグ用ログ
    console.log('機材リスト取得: ' + equipmentList.length + '件');
    
    return equipmentList;
  } catch (error) {
    console.error('機材リストの取得に失敗しました', error);
    throw error;
  }
}

/**
 * 貸出データを取得する
 */
function getRentalData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('貸出履歴');
    
    if (!sheet) {
      console.error('貸出履歴シートが見つかりません');
      return { error: '貸出履歴シートが見つかりません' };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('貸出データがありません（ヘッダーのみ）');
      return [];
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    
    // デバッグ用ログ
    console.log(`貸出データ: ${lastRow - 1}行取得`);
    
    // データをオブジェクト配列に変換（日付を文字列に変換）
    const rentalData = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const item = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = row[j];
        
        // 日付型の場合はISOString形式に変換
        if (value instanceof Date) {
          if (!isNaN(value.getTime())) {
            // 有効な日付
            item[header] = value.toISOString();
          } else {
            // 無効な日付
            item[header] = null;
          }
        } else {
          item[header] = value;
        }
      }
      
      rentalData.push(item);
    }
    
    // サンプルログ
    if (rentalData.length > 0) {
      console.log('最初の貸出データ例: ' + JSON.stringify(rentalData[0]));
    }
    
    return rentalData;
  } catch (error) {
    console.error('貸出データの取得に失敗しました', error);
    return { error: error.toString() };
  }
}

/**
 * 定置場所リストを取得する
 */
function getLocationsList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('定置場所マスター');
    
    if (!sheet) {
      throw new Error('定置場所マスターシートが見つかりません');
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return []; // ヘッダーのみの場合は空配列を返す
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    // 配列に変換
    const locationsList = data.map(row => row[0]).filter(location => location && location !== "");
    
    return locationsList;
  } catch (error) {
    console.error('定置場所リストの取得に失敗しました', error);
    throw error;
  }
}

/**
 * 現場リストを取得する（新規追加）
 */
function getProjectsList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('現場マスター');
    
    if (!sheet) {
      throw new Error('現場マスターシートが見つかりません');
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return []; // ヘッダーのみの場合は空配列を返す
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    
    // データをオブジェクト配列に変換
    const projectsList = data.map(row => {
      return {
        name: row[0],
        createdAt: row[1] instanceof Date ? row[1].toISOString() : null
      };
    }).filter(project => project.name && project.name !== "");
    
    return projectsList;
  } catch (error) {
    console.error('現場リストの取得に失敗しました', error);
    throw error;
  }
}

/**
 * 現場を追加する（新規追加）
 */
function addProject(data) {
  try {
    if (!data.name || data.name.trim() === "") {
      throw new Error('現場名が指定されていません');
    }
    
    const projectName = data.name.trim();
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('現場マスター');
    
    if (!sheet) {
      throw new Error('現場マスターシートが見つかりません');
    }
    
    // すでに同じ名前の現場が存在するか確認
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingProjects = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < existingProjects.length; i++) {
        if (String(existingProjects[i][0]).trim() === projectName) {
          return { success: true, message: '現場は既に登録されています' };
        }
      }
    }
    
    // 新しい現場を追加
    sheet.appendRow([projectName, new Date()]);
    
    return { success: true };
  } catch (error) {
    console.error('現場の追加に失敗しました', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 現場を削除する（新規追加）
 */
function deleteProjects(data) {
  try {
    if (!data.names || !Array.isArray(data.names) || data.names.length === 0) {
      throw new Error('削除する現場名が指定されていません');
    }
    
    const projectNames = data.names;
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('現場マスター');
    
    if (!sheet) {
      throw new Error('現場マスターシートが見つかりません');
    }
    
    // 現場データを取得
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, message: '削除対象がありません' };
    }
    
    const projectData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let rowsToDelete = [];
    
    // 削除対象の行番号を特定
    for (let i = 0; i < projectData.length; i++) {
      const projectName = String(projectData[i][0]).trim();
      if (projectNames.includes(projectName)) {
        rowsToDelete.push(i + 2); // ヘッダー行(1)と0起点インデックスの調整(+1)
      }
    }
    
    // 削除（後ろから順に削除しないと行番号がずれる）
    rowsToDelete.sort((a, b) => b - a);
    for (const rowNum of rowsToDelete) {
      sheet.deleteRow(rowNum);
    }
    
    return { success: true, deletedCount: rowsToDelete.length };
  } catch (error) {
    console.error('現場の削除に失敗しました', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 機器を追加する（新規追加）
 */
function addEquipment(data) {
  try {
    // 必須項目チェック
    if (!data.name || data.name.trim() === "") {
      throw new Error('機器名称が指定されていません');
    }
    
    if (!data.quantity || isNaN(parseInt(data.quantity)) || parseInt(data.quantity) <= 0) {
      throw new Error('有効な総台数を指定してください');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('機器リスト');
    
    if (!sheet) {
      throw new Error('機器リストシートが見つかりません');
    }
    
    // 新しい機器管理番号を生成（現在の最大値+1）
    let newEquipmentId = 1;
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      const equipmentIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < equipmentIds.length; i++) {
        const id = parseInt(equipmentIds[i][0]);
        if (!isNaN(id) && id >= newEquipmentId) {
          newEquipmentId = id + 1;
        }
      }
    }
    
    // ユーザー情報取得
    const userInfo = getUserInfo();
    
    // 新しい機器データ
    const newEquipment = [
      newEquipmentId,                        // 機器管理番号
      data.name.trim(),                      // 機器名称
      data.spec || '',                       // 仕様
      data.model || '',                      // 型番
      data.maker || '',                      // メーカー
      data.serialNo || '',                   // シリアルNo
      parseInt(data.quantity),               // 総台数
      data.alias || '',                      // 呼称
      data.location || '',                   // 定置場所
      data.note1 || '',                      // 備考1
      data.note2 || ''                       // 備考2
    ];
    
    // 機器リストに追加
    sheet.appendRow(newEquipment);
    
    // バックアップシートに記録
    const backupSheet = ss.getSheetByName('機器バックアップ');
    if (backupSheet) {
      const backupData = [
        new Date(),                          // 操作日時
        '追加',                              // 操作タイプ
        newEquipmentId,                      // 機器管理番号
        data.name.trim(),                    // 機器名称
        data.spec || '',                     // 仕様
        data.model || '',                    // 型番
        data.maker || '',                    // メーカー
        data.serialNo || '',                 // シリアルNo
        parseInt(data.quantity),             // 総台数
        data.alias || '',                    // 呼称
        data.location || '',                 // 定置場所
        data.note1 || '',                    // 備考1
        data.note2 || '',                    // 備考2
        userInfo.email                       // 操作ユーザー
      ];
      
      backupSheet.appendRow(backupData);
    }
    
    return { 
      success: true, 
      equipmentId: newEquipmentId 
    };
  } catch (error) {
    console.error('機器の追加に失敗しました', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 機器を削除する（新規追加）
 */
function deleteEquipments(data) {
  try {
    if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
      throw new Error('削除する機器管理番号が指定されていません');
    }
    
    const equipmentIds = data.ids.map(id => String(id));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('機器リスト');
    
    if (!sheet) {
      throw new Error('機器リストシートが見つかりません');
    }
    
    // 機器データを取得
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, message: '削除対象がありません' };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const equipmentData = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    let rowsToDelete = [];
    let deletedEquipment = [];
    
    // ユーザー情報取得
    const userInfo = getUserInfo();
    
    // 削除対象の行番号を特定
    for (let i = 0; i < equipmentData.length; i++) {
      const equipmentId = String(equipmentData[i][0]);
      if (equipmentIds.includes(equipmentId)) {
        rowsToDelete.push(i + 2); // ヘッダー行(1)と0起点インデックスの調整(+1)
        deletedEquipment.push(equipmentData[i]);
      }
    }
    
    // バックアップシートに記録
    const backupSheet = ss.getSheetByName('機器バックアップ');
    let now = null;
    if (backupSheet) {
      now = new Date();
      
      for (const equipment of deletedEquipment) {
        const backupData = [
          now,                                 // 操作日時
          '削除',                              // 操作タイプ
          equipment[0],                        // 機器管理番号
          equipment[1],                        // 機器名称
          equipment[2],                        // 仕様
          equipment[3],                        // 型番
          equipment[4],                        // メーカー
          equipment[5],                        // シリアルNo
          equipment[6],                        // 総台数
          equipment[7],                        // 呼称
          equipment[8],                        // 定置場所
          equipment[9],                        // 備考1
          equipment[10],                       // 備考2
          userInfo.email                       // 操作ユーザー
        ];
        
        backupSheet.appendRow(backupData);
      }
    }
    
    // 削除（後ろから順に削除しないと行番号がずれる）
    rowsToDelete.sort((a, b) => b - a);
    for (const rowNum of rowsToDelete) {
      sheet.deleteRow(rowNum);
    }
    
    return { 
      success: true, 
      deletedCount: rowsToDelete.length,
      timestamp: now ? now.toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error('機器の削除に失敗しました', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 機器削除を元に戻す（新規追加）
 */
function undoEquipmentDelete(timestamp) {
  try {
    if (!timestamp) {
      throw new Error('タイムスタンプが指定されていません');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const backupSheet = ss.getSheetByName('機器バックアップ');
    
    if (!backupSheet) {
      throw new Error('機器バックアップシートが見つかりません');
    }
    
    // タイムスタンプから日付オブジェクトを作成
    const targetTime = new Date(timestamp);
    
    // バックアップデータを取得
    const lastRow = backupSheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, error: 'バックアップデータがありません' };
    }
    
    const headers = backupSheet.getRange(1, 1, 1, backupSheet.getLastColumn()).getValues()[0];
    const backupData = backupSheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    
    // 指定したタイムスタンプに一致する削除データを検索
    const restoredEquipment = [];
    
    for (let i = 0; i < backupData.length; i++) {
      const backupTime = backupData[i][0];
      const operationType = backupData[i][1];
      
      // 日付の差が1秒以内なら同じとみなす
      const timeDiff = Math.abs(targetTime.getTime() - backupTime.getTime());
      if (operationType === '削除' && timeDiff < 1000) {
        // 機器データを復元形式に変換
        restoredEquipment.push([
          backupData[i][2],  // 機器管理番号
          backupData[i][3],  // 機器名称
          backupData[i][4],  // 仕様
          backupData[i][5],  // 型番
          backupData[i][6],  // メーカー
          backupData[i][7],  // シリアルNo
          backupData[i][8],  // 総台数
          backupData[i][9],  // 呼称
          backupData[i][10], // 定置場所
          backupData[i][11], // 備考1
          backupData[i][12]  // 備考2
        ]);
      }
    }
    
    if (restoredEquipment.length === 0) {
      return { success: false, error: '指定したタイムスタンプの削除データが見つかりません' };
    }
    
    // 機器リストシートに復元
    const equipmentSheet = ss.getSheetByName('機器リスト');
    if (!equipmentSheet) {
      throw new Error('機器リストシートが見つかりません');
    }
    
    // バッチで追加
    const lastRowInList = equipmentSheet.getLastRow();
    equipmentSheet.getRange(lastRowInList + 1, 1, restoredEquipment.length, restoredEquipment[0].length)
      .setValues(restoredEquipment);
    
    // 復元した旨をバックアップに記録
    const userInfo = getUserInfo();
    const now = new Date();
    
    for (const equipment of restoredEquipment) {
      const backupData = [
        now,                // 操作日時
        '復元',             // 操作タイプ
        equipment[0],       // 機器管理番号
        equipment[1],       // 機器名称
        equipment[2],       // 仕様
        equipment[3],       // 型番
        equipment[4],       // メーカー
        equipment[5],       // シリアルNo
        equipment[6],       // 総台数
        equipment[7],       // 呼称
        equipment[8],       // 定置場所
        equipment[9],       // 備考1
        equipment[10],      // 備考2
        userInfo.email      // 操作ユーザー
      ];
      
      backupSheet.appendRow(backupData);
    }
    
    return { 
      success: true, 
      restoredCount: restoredEquipment.length 
    };
  } catch (error) {
    console.error('機器の復元に失敗しました', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 貸出データを保存する
 */
function saveRental(data) {
  try {
    console.log('貸出データ保存リクエスト:', JSON.stringify(data));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('貸出履歴');
    
    if (!sheet) {
      throw new Error('貸出履歴シートが見つかりません');
    }
    
    // 現在のユーザー情報
    const userInfo = getUserInfo();
    const user = userInfo.email || Session.getActiveUser().getEmail();
    const now = new Date();
    
    // カラム数の確認
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // 貸出元カラムが存在しない場合は追加
    let sourceLocationIndex = headers.indexOf('貸出元');
    if (sourceLocationIndex === -1) {
      // 新しいヘッダーを追加
      sheet.getRange(1, headers.length + 1).setValue('貸出元');
      sourceLocationIndex = headers.length;
      
      // ヘッダーの書式設定を適用
      sheet.getRange(1, headers.length + 1).setBackground('#f3f3f3').setFontWeight('bold');
    }
    
    // 新しい現場を現場マスターに追加
    if (data.project && data.project.trim() !== '') {
      addProject({ name: data.project });
    }
    
    // 登録するデータの作成（日付を確実にDate型に変換）
    const newRow = [
      data.equipmentId,                     // 機器管理番号
      data.equipmentName,                   // 機器名称
      new Date(data.startDate),             // 借用開始日
      new Date(data.endDate),               // 借用終了日
      data.quantity,                        // 数量
      data.project,                         // 使用場所（現場名）
      user,                                 // 借用者
      now,                                  // 登録日時
      '貸出中',                             // ステータス
      ''                                    // 返却日
    ];
    
    // 貸出元データを追加
    if (sourceLocationIndex >= newRow.length) {
      // 不足している列を埋める
      for (let i = newRow.length; i <= sourceLocationIndex; i++) {
        newRow.push('');
      }
    }
    newRow[sourceLocationIndex] = data.sourceLocation || ''; // 貸出元の定置場所
    
    // データの追加
    sheet.appendRow(newRow);
    
    // 日付フォーマットの適用
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 3, 1, 2).setNumberFormat('yyyy/MM/dd');
    sheet.getRange(lastRow, 8, 1, 1).setNumberFormat('yyyy/MM/dd HH:mm:ss');
    
    // 保存確認
    console.log('貸出データ保存成功');
    
    // 明示的にスプレッドシートを保存
    SpreadsheetApp.flush();
    
    return {
      success: true,
      id: now.toString(), // 登録日時をIDとして返す
      message: '貸出を登録しました'
    };
  } catch (error) {
    console.error('貸出データの保存に失敗しました', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 返却データを保存する
 */
function saveReturn(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rentalSheet = ss.getSheetByName('貸出履歴');
    
    if (!rentalSheet) {
      throw new Error('貸出履歴シートが見つかりません');
    }
    
    // 該当する貸出データを検索
    const lastRow = rentalSheet.getLastRow();
    const headers = rentalSheet.getRange(1, 1, 1, rentalSheet.getLastColumn()).getValues()[0];
    const dataRange = rentalSheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();
    
    // 必要な列インデックスを取得
    const registrationDateIndex = headers.indexOf('登録日時');
    const statusIndex = headers.indexOf('ステータス');
    const returnDateIndex = headers.indexOf('返却日');
    const equipmentIdIndex = headers.indexOf('機器管理番号');
    const quantityIndex = headers.indexOf('数量');
    
    // 貸出元列を確認
    let sourceLocationIndex = headers.indexOf('貸出元');
    if (sourceLocationIndex === -1) {
      // 貸出元列がない場合は追加（実際には既に追加済みのはず）
      console.warn('貸出元列が見つかりません。データが正しく更新されない可能性があります。');
      sourceLocationIndex = -1;
    }
    
    // 該当データの行を検索
    let rowIndex = -1;
    let rentalData = null;
    
    for (let i = 0; i < values.length; i++) {
      const registrationDate = values[i][registrationDateIndex];
      if (registrationDate && registrationDate.toString() === data.rentalId) {
        rowIndex = i + 2; // ヘッダー行 + 0始まりのインデックス補正
        rentalData = values[i];
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error('該当する貸出データが見つかりません');
    }
    
    // 返却データを更新
    rentalSheet.getRange(rowIndex, statusIndex + 1).setValue('返却済み');
    rentalSheet.getRange(rowIndex, returnDateIndex + 1).setValue(new Date(data.returnDate));
    
    // 返却場所を取得 - 貸出元と同じ場所に返却
    const returnLocation = data.returnLocation || '';
    
    // 機器リストの定置場所を更新
    const equipmentId = rentalData[equipmentIdIndex];
    
    // 返却台数（リクエストされた台数または貸出台数全部）
    const returnQuantity = Math.min(
      parseInt(data.returnQuantity) || 0,
      parseInt(rentalData[quantityIndex]) || 0
    );
    
    // 返却台数が貸出台数より少ない場合は貸出レコードを分割
    const borrowedQuantity = parseInt(rentalData[quantityIndex]) || 0;
    
    if (returnQuantity > 0 && returnQuantity < borrowedQuantity) {
      // 残りの台数を計算
      const remainingQuantity = borrowedQuantity - returnQuantity;
      
      // 貸出レコードの台数を残り台数に更新
      rentalSheet.getRange(rowIndex, quantityIndex + 1).setValue(remainingQuantity);
      
      // 返却済みレコードを新規作成
      const returnRow = [...rentalData];
      returnRow[quantityIndex] = returnQuantity; // 返却する台数
      returnRow[statusIndex] = '返却済み'; // ステータスを返却済みに
      returnRow[returnDateIndex] = new Date(data.returnDate); // 返却日を設定
      
      // 新しい行を追加
      rentalSheet.appendRow(returnRow);
      
      // 日付フォーマットの適用
      const newRowIndex = rentalSheet.getLastRow();
      if (newRowIndex > rowIndex) {
        // 借用開始日、借用終了日、登録日時、返却日のカラムにフォーマット適用
        rentalSheet.getRange(newRowIndex, 3, 1, 2).setNumberFormat('yyyy/MM/dd'); // 開始日、終了日
        rentalSheet.getRange(newRowIndex, 8, 1, 1).setNumberFormat('yyyy/MM/dd HH:mm:ss'); // 登録日時
        rentalSheet.getRange(newRowIndex, 10, 1, 1).setNumberFormat('yyyy/MM/dd'); // 返却日
      }
    } else {
      // 全台数返却の場合はそのままステータスを変更
    }
    
    // 台数更新処理
    if (equipmentId && returnQuantity > 0) {
      const updateResult = updateEquipmentLocationWithSource(
        equipmentId, 
        sourceLocationIndex !== -1 ? rentalData[sourceLocationIndex] || '' : '', 
        returnLocation, 
        returnQuantity,
        data.rentalId
      );
      
      console.log('機器定置場所更新結果:', updateResult);
      
      if (!updateResult.success) {
        console.warn('機器定置場所の更新に問題がありました:', updateResult.error);
      }
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('返却データの保存に失敗しました', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 貸出データを削除する（undo用）
 */
function deleteRental(rentalId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('貸出履歴');
    
    if (!sheet) {
      throw new Error('貸出履歴シートが見つかりません');
    }
    
    // 該当する貸出データを検索
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();
    
    // 登録日時列のインデックスを取得
    const registrationDateIndex = headers.indexOf('登録日時');
    
    // 該当データの行を検索
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
      const registrationDate = values[i][registrationDateIndex];
      if (registrationDate && registrationDate.toString() === rentalId) {
        rowIndex = i + 2; // ヘッダー行 + 0始まりのインデックス補正
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error('該当する貸出データが見つかりません');
    }
    
    // 行を削除
    sheet.deleteRow(rowIndex);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('貸出データの削除に失敗しました', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 返却処理を取り消す（undo用）
 */
function undoReturn(rentalId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('貸出履歴');
    
    if (!sheet) {
      throw new Error('貸出履歴シートが見つかりません');
    }
    
    // 該当する貸出データを検索
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();
    
    // 登録日時列のインデックスを取得
    const registrationDateIndex = headers.indexOf('登録日時');
    const statusIndex = headers.indexOf('ステータス');
    const returnDateIndex = headers.indexOf('返却日');
    
    // 該当データの行を検索
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
      const registrationDate = values[i][registrationDateIndex];
      if (registrationDate && registrationDate.toString() === rentalId) {
        rowIndex = i + 2; // ヘッダー行 + 0始まりのインデックス補正
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error('該当する貸出データが見つかりません');
    }
    
    // 返却データを更新
    sheet.getRange(rowIndex, statusIndex + 1).setValue('貸出中');
    sheet.getRange(rowIndex, returnDateIndex + 1).setValue('');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('返却取り消しに失敗しました', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 新しい定置場所をマスターに追加する
 */
function addLocationIfNew(location) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('定置場所マスター');
    
    if (!sheet) {
      throw new Error('定置場所マスターシートが見つかりません');
    }
    
    // 既存の定置場所リストを取得
    const existingLocations = getLocationsList();
    
    // 既に存在する場合は何もしない
    if (existingLocations.includes(location)) {
      return;
    }
    
    // 新しい定置場所を追加
    sheet.appendRow([location]);
    
  } catch (error) {
    console.error('定置場所の追加に失敗しました', error);
    throw error;
  }
}

/**
 * HTMLテンプレートに含めるファイルを取得
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Webアプリの初期HTML
 */
function openRentalUI() {
  const htmlOutput = createIndexHtml();
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '機材貸出管理システム');
}

/**
 * HTML出力を作成
 */
function createIndexHtml() {
  const htmlOutput = HtmlService.createTemplateFromFile('Index');
  return htmlOutput.evaluate()
    .setTitle('機材貸出管理システム')
    .setWidth(1200)
    .setHeight(800);
}

/**
 * スクリプトURLを取得する（HTMLテンプレート用）
 */
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * 貸出データを更新する
 */
function updateRental(data) {
  try {
    console.log('貸出データ更新リクエスト:', JSON.stringify(data));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('貸出履歴');
    
    if (!sheet) {
      throw new Error('貸出履歴シートが見つかりません');
    }
    
    // 該当する貸出データを検索
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();
    
    // 登録日時列のインデックスを取得
    const registrationDateIndex = headers.indexOf('登録日時');
    const equipmentIdIndex = headers.indexOf('機器管理番号');
    const equipmentNameIndex = headers.indexOf('機器名称');
    const startDateIndex = headers.indexOf('借用開始日');
    const endDateIndex = headers.indexOf('借用終了日');
    const locationIndex = headers.indexOf('使用場所');
    const quantityIndex = headers.indexOf('数量');
    
    // 貸出元列のインデックスを取得
    let sourceLocationIndex = headers.indexOf('貸出元');
    if (sourceLocationIndex === -1) {
      // 新しいヘッダーを追加
      sheet.getRange(1, headers.length + 1).setValue('貸出元');
      sourceLocationIndex = headers.length;
      
      // ヘッダーの書式設定を適用
      sheet.getRange(1, headers.length + 1).setBackground('#f3f3f3').setFontWeight('bold');
    }
    
    // 該当データの行を検索
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
      const registrationDate = values[i][registrationDateIndex];
      if (registrationDate && registrationDate.toString() === data.rentalId) {
        rowIndex = i + 2; // ヘッダー行 + 0始まりのインデックス補正
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error('該当する貸出データが見つかりません');
    }
    
    // 現在の貸出元の取得
    let currentSourceLocation = '';
    if (sourceLocationIndex < values[rowIndex - 2].length) {
      currentSourceLocation = values[rowIndex - 2][sourceLocationIndex] || '';
    }
    
    // 更新データを設定
    if (data.equipmentId) {
      sheet.getRange(rowIndex, equipmentIdIndex + 1).setValue(data.equipmentId);
    }
    
    if (data.equipmentName) {
      sheet.getRange(rowIndex, equipmentNameIndex + 1).setValue(data.equipmentName);
    }
    
    if (data.startDate) {
      sheet.getRange(rowIndex, startDateIndex + 1).setValue(new Date(data.startDate));
    }
    
    if (data.endDate) {
      sheet.getRange(rowIndex, endDateIndex + 1).setValue(new Date(data.endDate));
    }
    
    if (data.location) {
      sheet.getRange(rowIndex, locationIndex + 1).setValue(data.location);
      
      // 新しい現場の場合、現場マスターに追加
      addProject({ name: data.location });
    }
    
    if (data.quantity) {
      sheet.getRange(rowIndex, quantityIndex + 1).setValue(data.quantity);
    }
    
    // 貸出元（定置場所）の更新
    if (data.sourceLocation && sourceLocationIndex >= 0) {
      sheet.getRange(rowIndex, sourceLocationIndex + 1).setValue(data.sourceLocation);
      
      // 貸出元が変わる場合は、在庫数の移動処理を行う
      if (currentSourceLocation !== data.sourceLocation) {
        console.log(`貸出元変更: ${currentSourceLocation} → ${data.sourceLocation}`);
        
        // 対象貸出データの詳細を取得
        const rentalInfo = {
          equipmentId: data.equipmentId || values[rowIndex - 2][equipmentIdIndex],
          quantity: parseInt(data.quantity) || parseInt(values[rowIndex - 2][quantityIndex]) || 0,
          oldSourceLocation: currentSourceLocation,
          newSourceLocation: data.sourceLocation
        };
        
        // 在庫移動処理
        updateInventoryForSourceChange(rentalInfo);
      }
    }
    
    // 日付フォーマットの適用
    sheet.getRange(rowIndex, startDateIndex + 1, 1, 1).setNumberFormat('yyyy/MM/dd');
    sheet.getRange(rowIndex, endDateIndex + 1, 1, 1).setNumberFormat('yyyy/MM/dd');
    
    // 変更を確実に反映
    SpreadsheetApp.flush();
    
    return {
      success: true
    };
  } catch (error) {
    console.error('貸出データの更新に失敗しました', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 貸出元変更に伴う在庫更新処理
 */
function updateInventoryForSourceChange(rentalInfo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('機器リスト');
    
    if (!sheet) {
      throw new Error('機器リストシートが見つかりません');
    }
    
    const equipmentId = rentalInfo.equipmentId;
    const quantity = rentalInfo.quantity;
    const oldSourceLocation = rentalInfo.oldSourceLocation;
    const newSourceLocation = rentalInfo.newSourceLocation;
    
    if (!equipmentId || quantity <= 0) {
      return { success: false, error: '有効な機器情報がありません' };
    }
    
    // 機器リストのヘッダーを取得
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const equipmentIdIdx = headers.indexOf('機器管理番号');
    const locationIdx = headers.indexOf('定置場所');
    const quantityIdx = headers.indexOf('総台数');
    
    if (equipmentIdIdx === -1 || locationIdx === -1 || quantityIdx === -1) {
      return { success: false, error: '必要なヘッダーが見つかりません' };
    }
    
    // データ範囲を取得
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, error: '機器データがありません' };
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();
    
    // 旧貸出元の行を検索
    let oldSourceRow = -1;
    
    if (oldSourceLocation) {
      for (let i = 0; i < values.length; i++) {
        const currentId = String(values[i][equipmentIdIdx]);
        const currentLocation = String(values[i][locationIdx] || '');
        
        if (currentId === String(equipmentId) && currentLocation === String(oldSourceLocation)) {
          oldSourceRow = i + 2; // ヘッダー行 + 0始まりのインデックス補正
          break;
        }
      }
    }
    
    // 新貸出元の行を検索
    let newSourceRow = -1;
    
    if (newSourceLocation) {
      for (let i = 0; i < values.length; i++) {
        const currentId = String(values[i][equipmentIdIdx]);
        const currentLocation = String(values[i][locationIdx] || '');
        
        if (currentId === String(equipmentId) && currentLocation === String(newSourceLocation)) {
          newSourceRow = i + 2; // ヘッダー行 + 0始まりのインデックス補正
          break;
        }
      }
    }
    
    // 旧貸出元から在庫を減らす
    if (oldSourceRow !== -1) {
      const currentQuantity = parseInt(values[oldSourceRow - 2][quantityIdx]) || 0;
      // 減少後の台数（マイナスにならないよう0が最小値）
      const newQuantity = Math.max(0, currentQuantity - quantity);
      
      if (newQuantity <= 0) {
        // 台数が0になった場合は行を削除
        sheet.deleteRow(oldSourceRow);
        console.log(`旧貸出元(${oldSourceLocation})の台数が0になったため行を削除`);
      } else {
        // 台数を更新
        sheet.getRange(oldSourceRow, quantityIdx + 1).setValue(newQuantity);
        console.log(`旧貸出元(${oldSourceLocation})の台数を更新: ${currentQuantity}→${newQuantity}`);
      }
    }
    
    // 新貸出元に在庫を増やす
    if (newSourceRow !== -1) {
      // 既存の貸出元の現在の台数を取得
      const currentQuantity = parseInt(values[newSourceRow - 2][quantityIdx]) || 0;
      // 増加後の台数
      const newQuantity = currentQuantity + quantity;
      
      // 台数を更新
      sheet.getRange(newSourceRow, quantityIdx + 1).setValue(newQuantity);
      console.log(`新貸出元(${newSourceLocation})の台数を更新: ${currentQuantity}→${newQuantity}`);
    } else if (newSourceLocation) {
      // 新貸出元の行が存在しない場合は新規作成
      // テンプレートとなる機器の情報を取得
      let templateRow = null;
      
      // 同じ機器IDを持つ行を検索
      for (let i = 0; i < values.length; i++) {
        if (String(values[i][equipmentIdIdx]) === String(equipmentId)) {
          templateRow = values[i].slice(); // 配列をコピー
          break;
        }
      }
      
      if (templateRow) {
        // 新しい行のデータを作成
        templateRow[locationIdx] = newSourceLocation; // 定置場所を設定
        templateRow[quantityIdx] = quantity; // 数量を設定
        
        // 新しい行を追加
        sheet.appendRow(templateRow);
        console.log(`新貸出元(${newSourceLocation})に機器を追加: ${quantity}台`);
      } else {
        console.warn(`機器ID ${equipmentId} のテンプレートが見つかりません`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('在庫更新処理に失敗しました', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 更新取り消し処理
 */
function undoUpdate(data) {
  try {
    const rentalId = data.rentalId;
    const previousData = data.previousData;
    
    if (!rentalId || !previousData) {
      throw new Error('復元に必要なデータが不足しています');
    }
    
    // 更新APIを使用して元の状態に戻す
    return updateRental({
      rentalId: rentalId,
      equipmentId: previousData['機器管理番号'],
      equipmentName: previousData['機器名称'],
      startDate: previousData['借用開始日'],
      endDate: previousData['借用終了日'],
      quantity: previousData['数量'],
      location: previousData['使用場所']
    });
  } catch (error) {
    console.error('更新取り消しに失敗しました', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 貸出IDから貸出データを検索する
 */
function findRentalById(rentalId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('貸出履歴');
    
    if (!sheet) {
      return null;
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return null;
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();
    
    const registrationDateIndex = headers.indexOf('登録日時');
    
    for (let i = 0; i < values.length; i++) {
      const registrationDate = values[i][registrationDateIndex];
      if (registrationDate && registrationDate.toString() === rentalId) {
        // 行データをオブジェクトに変換
        const rental = {};
        headers.forEach((header, idx) => {
          rental[header] = values[i][idx];
        });
        return rental;
      }
    }
    
    return null;
  } catch (error) {
    console.error('貸出データの検索に失敗しました', error);
    return null;
  }
}

/**
 * 返却時に機器リストの定置場所を更新する（修正版）
 */
function updateEquipmentLocationWithSource(equipmentId, sourceLocation, returnLocation, returnQuantity, rentalId) {
  try {
    console.log(`機器定置場所更新: 機器ID=${equipmentId}, 貸出元=${sourceLocation}, 返却先=${returnLocation}, 数量=${returnQuantity}`);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('機器リスト');
    
    if (!sheet) {
      throw new Error('機器リストシートが見つかりません');
    }
    
    // 機器リストのヘッダーを取得
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const equipmentIdIdx = headers.indexOf('機器管理番号');
    const locationIdx = headers.indexOf('定置場所');
    const quantityIdx = headers.indexOf('総台数');
    
    if (equipmentIdIdx === -1 || locationIdx === -1 || quantityIdx === -1) {
      throw new Error('必要なヘッダーが見つかりません');
    }
    
    // データ範囲を取得
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, error: '機器データがありません' };
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = dataRange.getValues();
    
    // 貸出元の機器行を検索
    let sourceRow = -1;
    for (let i = 0; i < values.length; i++) {
      const currentId = String(values[i][equipmentIdIdx]);
      const currentLocation = String(values[i][locationIdx] || '');
      
      if (currentId === String(equipmentId) && currentLocation === String(sourceLocation)) {
        sourceRow = i + 2; // ヘッダー行 + 0始まりのインデックス補正
        break;
      }
    }
    
    // 返却先の機器行を検索
    let targetRow = -1;
    for (let i = 0; i < values.length; i++) {
      const currentId = String(values[i][equipmentIdIdx]);
      const currentLocation = String(values[i][locationIdx] || '');
      
      if (currentId === String(equipmentId) && currentLocation === String(returnLocation)) {
        targetRow = i + 2; // ヘッダー行 + 0始まりのインデックス補正
        break;
      }
    }
    
    // 貸出元から台数を減らす
    if (sourceRow !== -1) {
      // 貸出元の現在の台数を取得
      const currentQuantity = parseInt(values[sourceRow - 2][quantityIdx]) || 0;
      // 減少後の台数（マイナスにならないよう0が最小値）
      const newQuantity = Math.max(0, currentQuantity - returnQuantity);
      
      if (newQuantity <= 0) {
        // 台数が0になった場合は行を削除
        sheet.deleteRow(sourceRow);
        console.log(`貸出元(${sourceLocation})の台数が0になったため行を削除`);
      } else {
        // 台数を更新
        sheet.getRange(sourceRow, quantityIdx + 1).setValue(newQuantity);
        console.log(`貸出元(${sourceLocation})の台数を更新: ${currentQuantity}→${newQuantity}`);
      }
    }
    
    // 返却先の行が存在する場合は台数を増やす
    if (targetRow !== -1) {
      // 返却先の現在の台数を取得
      const currentQuantity = parseInt(values[targetRow - 2][quantityIdx]) || 0;
      // 増加後の台数
      const newQuantity = currentQuantity + returnQuantity;
      
      // 台数を更新
      sheet.getRange(targetRow, quantityIdx + 1).setValue(newQuantity);
      console.log(`返却先(${returnLocation})の台数を更新: ${currentQuantity}→${newQuantity}`);
      
      return { success: true, action: 'updated' };
    } else {
      // 返却先の行が存在しない場合は新規作成
      // 貸出元と同じ機器の情報を複製するため、元データを取得
      let templateRow = null;
      
      // まず同じ機器IDを持つ行を検索
      for (let i = 0; i < values.length; i++) {
        if (String(values[i][equipmentIdIdx]) === String(equipmentId)) {
          templateRow = values[i].slice(); // 配列をコピー
          break;
        }
      }
      
      if (!templateRow) {
        return { success: false, error: '機器のテンプレートデータが見つかりません' };
      }
      
      // 新しい行のデータを作成
      templateRow[locationIdx] = returnLocation; // 定置場所を設定
      templateRow[quantityIdx] = returnQuantity; // 数量を設定
      
      // 新しい行を追加
      sheet.appendRow(templateRow);
      console.log(`新しい定置場所(${returnLocation})に機器を追加: ${returnQuantity}台`);
      
      return { success: true, action: 'added' };
    }
  } catch (error) {
    console.error('機器定置場所の更新に失敗しました', error);
    return { success: false, error: error.toString() };
  }
}