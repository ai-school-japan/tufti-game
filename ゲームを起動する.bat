@echo off
chcp 65001 > nul
echo.
echo  ================================================
echo   TUFTI流・引き寄せゲーム サーバー起動中...
echo  ================================================
echo.
echo   ブラウザが自動的に開きます。
echo   URL: http://localhost:8080
echo.
echo   終了するには このウィンドウを閉じてください。
echo  ------------------------------------------------

:: サーバーをバックグラウンドで起動してブラウザを開く
start "" "http://localhost:8080"
powershell -ExecutionPolicy Bypass -NoProfile -Command "& {$listener=New-Object System.Net.HttpListener;$listener.Prefixes.Add('http://localhost:8080/');$listener.Start();$root='%~dp0';$mime=@{'.html'='text/html;charset=utf-8';'.css'='text/css;charset=utf-8';'.js'='application/javascript;charset=utf-8';'.json'='application/json;charset=utf-8';'.png'='image/png';'.jpg'='image/jpeg';'.mp3'='audio/mpeg';'.webp'='image/webp';'.ico'='image/x-icon'};Write-Host '  サーバー稼働中 http://localhost:8080' -ForegroundColor Green;while($listener.IsListening){$ctx=$listener.GetContext();$req=$ctx.Request;$res=$ctx.Response;$path=$req.Url.LocalPath;if($path -eq '/'){$path='/index.html'};$file=[System.IO.Path]::GetFullPath($root+$path.TrimStart('/').Replace('/','\'));if(-not $file.StartsWith($root)){$res.StatusCode=403;$res.Close();continue};if(Test-Path $file -PathType Leaf){$ext=[System.IO.Path]::GetExtension($file).ToLower();$ct=if($mime[$ext]){$mime[$ext]}else{'application/octet-stream'};$bytes=[System.IO.File]::ReadAllBytes($file);$res.ContentType=$ct;$res.ContentLength64=$bytes.Length;$res.Headers.Add('Access-Control-Allow-Origin','*');$res.OutputStream.Write($bytes,0,$bytes.Length)}else{$res.StatusCode=404;$b=[System.Text.Encoding]::UTF8.GetBytes('404 Not Found');$res.OutputStream.Write($b,0,$b.Length)};$res.Close()}}"
