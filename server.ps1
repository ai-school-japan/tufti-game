# TUFTI Game - PowerShell HTTP Server
# Run: powershell -ExecutionPolicy Bypass -File server.ps1

$port    = 8080
$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$url     = "http://localhost:$port/"

$mimeMap = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.mp3'  = 'audio/mpeg'
    '.ico'  = 'image/x-icon'
    '.webp' = 'image/webp'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TUFTI流・引き寄せゲーム サーバー起動中" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ➜  URL:  http://localhost:$port" -ForegroundColor Green
Write-Host ""
Write-Host "  ブラウザで上記URLを開いてください。" -ForegroundColor Yellow
Write-Host "  停止するには Ctrl+C を押してください。" -ForegroundColor Gray
Write-Host ""

try {
    while ($listener.IsListening) {
        $ctx  = $listener.GetContext()
        $req  = $ctx.Request
        $res  = $ctx.Response

        $rawPath = $req.Url.LocalPath
        if ($rawPath -eq '/') { $rawPath = '/index.html' }

        # Decode URL-encoded path and prevent directory traversal
        $decoded  = [System.Uri]::UnescapeDataString($rawPath)
        $filePath = Join-Path $root ($decoded.TrimStart('/').Replace('/', '\'))
        $filePath = [System.IO.Path]::GetFullPath($filePath)

        if (-not $filePath.StartsWith($root)) {
            $res.StatusCode = 403
            $res.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext     = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime    = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }
            $bytes   = [System.IO.File]::ReadAllBytes($filePath)

            $res.ContentType   = $mime
            $res.ContentLength64 = $bytes.Length
            $res.AddHeader('Cache-Control', 'no-cache')
            $res.AddHeader('Access-Control-Allow-Origin', '*')
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "  200  $rawPath" -ForegroundColor DarkGray
        } else {
            $res.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawPath")
            $res.OutputStream.Write($notFound, 0, $notFound.Length)
            Write-Host "  404  $rawPath" -ForegroundColor Red
        }

        $res.OutputStream.Close()
        $res.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "サーバーを停止しました。" -ForegroundColor Gray
}
