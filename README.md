# これは何

Slackのチャンネルにアップロードしたファイルを、GoogleDriveに保存するスクリプト。
GASで定時バッチとして動かすことを想定。

# 使い方

UploaderSettingsをGoogleDriveにアップロードし、スプレッドシートで開く。
ツール→スクリプトエディタを開き、GetAttachedFile.jsの中身を貼り付ける。

UploaderSettings内に、取得したいSlackのチャンネルIDと保存先のGoogleDriveのURLの"https://drive.google.com/drive/folders/" 以降の文字を貼り付ける。
Slackのトークンを貼り付ける。

getSpreadsheet()を実行する。
