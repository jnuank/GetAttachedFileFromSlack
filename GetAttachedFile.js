// ------------------------------------------------------------
// グローバル変数
// ------------------------------------------------------------
var slackToken     = '';
var channelId      = '';
var driveFolderUrl = '';

// ------------------------------------------------------------
// スプレッドシート取得処理
// ------------------------------------------------------------
function getSpreadsheet(){
  
  var sheet = SpreadsheetApp.getActive().getSheetByName('Settings');
  
  // シート全体のデータを取得
  var data = sheet.getDataRange().getValue();
  
  // SlackToken取得
  var tokenCell = "E2";
  slackToken = sheet.getRange(tokenCell).getValue();
  
  // チャンネルID、Driveの指定フォルダ取得
  var rowIndex = 2;
  var colIndex = 1;
  var colNum = 3;
  
  // getValues()で、配列を取得。getValue()だと単体のみなので注意。
  var channelList = sheet.getRange(rowIndex, colIndex, sheet.getLastRow(), colNum).getValues();
  
  // 添字何もなしで全体出力。1つ指定して、配列1行取得。2つ指定で、列も指定して、特定の値1つ取得可能。
  // ToDo:複数のチャンネルから取得できるようにする
  channelId = channelList[0][1];
  driveFolderUrl = channelList[0][2];
  
  getFilesList();
}


// ------------------------------------------------------------
// ファイルリスト取得
// ------------------------------------------------------------
function getFilesList(){

  // ファイル格納先の設定
  var today      = new Date();
  var yesterday  = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  var year       = yesterday.getYear();
  var month      = yesterday.getMonth() + 1;
  var folderName = year + '/' + month;
  var folder     = DriveApp.getFolderById(driveFolderUrl);
  var folders    = folder.getFolders();
  
  // 現在のフォルダ内に、folderNameがあるかどうか確認。無ければ新しくフォルダを作成する。
  if( !folders.hasNext() ){
    driveFolderUrl = folder.createFolder(folderName).getId();
  }
  
  while (folders.hasNext()) {
    var fol = folders.next();
    
    if( fol.getName() == folderName ){
      driveFolderUrl = fol.getId();
      break;
    }
    if( !folders.hasNext() ){
      driveFolderUrl = folder.createFolder(folderName).getId();
    }
  }
  
  // JST → UnixTime。SlackAPIに投げる時に使用
  var unixTime    =  Math.round( yesterday.getTime() / 1000 );
  
  // files.list API叩いて、戻り値のJSONをパースする
  var targetUrl       = 'https://slack.com/api/files.list?token={0}&channel={1}&ts_from={2}&count=100&pretty=1';
  var filesListApiUrl = targetUrl.replace("{0}", slackToken).replace("{1}", channelId).replace("{2}", unixTime);
  var response        = UrlFetchApp.fetch(filesListApiUrl);
  
  var json = JSON.parse(response.getContentText()); 
  var len  = json["paging"]["total"];
  
  // ファイルの数だけ、アップロード実施
  for(var i=0; i<len; i++){

    // アップロード処理
    var mimeType     = json["files"][i]["mimetype"];
    var mime         = mimeType.split("/");
    var downloadLink = json["files"][i]["url_private_download"];
    var fileName     = json["files"][i]["title"];
    
    //var ts = json["files"][i]["timestamp"];
    //var date = new Date(ts * 1000);
    //var year = date.getYear();
    //var month = date.getMonth() + 1;
    //var day = date.getDate();
    
    //Logger.log(downloadLink);
    if(downloadLink == void 0){
       continue;
    }
    uploadGoogleDrive(downloadLink, fileName, mimeType);
    
  }
}

// ------------------------------------------------------------
// GoogleDriveにアップロード
// ------------------------------------------------------------
function uploadGoogleDrive(targetUrl, title, mimetype) {
  
   // オプション設定：ここでSlackTokenを入れて、Fetch時に認証をする。
   var options = { 'method' : 'get',
                    headers : {Authorization: "Bearer " + slackToken}
   };
  
   var image = UrlFetchApp.fetch(targetUrl, options).getBlob();
 
   file  = { "title":    title,
             "mimeType": mimetype,
             "parents":  [{"id": driveFolderUrl}]
   };
  
   response = Drive.Files.insert(file,image);
}


// ------------------------------------------------------------
// Debug:Jsonの中身をログとして吐き出し
// ------------------------------------------------------------
function JsonLogger(index)
{
    Logger.log(json["files"][index]["id"]);
    Logger.log(json["files"][index]["public_url_shared"]); //共有の確認用
    Logger.log(json["files"][index]["permalink_public"]);
    Logger.log(json["files"][index]["mimetype"]);
}