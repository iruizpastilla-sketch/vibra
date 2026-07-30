# Mini-servidor local para previsualizar la web de Vibra.
# Uso:  powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
# Sirve la carpeta del proyecto en http://localhost:8765/ sin instalar nada.
param([int]$Puerto = 8765)

$raiz = Split-Path -Parent $PSScriptRoot   # tools\ -> raiz del proyecto
$mime = @{
  ".html"  = "text/html; charset=utf-8"
  ".css"   = "text/css; charset=utf-8"
  ".js"    = "application/javascript; charset=utf-8"
  ".json"  = "application/json; charset=utf-8"
  ".png"   = "image/png"
  ".jpg"   = "image/jpeg"
  ".jpeg"  = "image/jpeg"
  ".webp"  = "image/webp"
  ".svg"   = "image/svg+xml"
  ".ico"   = "image/x-icon"
  ".woff2" = "font/woff2"
  ".woff"  = "font/woff"
  ".txt"   = "text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Puerto/")
$listener.Start()
Write-Host "Servidor Vibra en marcha: http://localhost:$Puerto/  (Ctrl+C para parar)"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $ruta = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($ruta.EndsWith("/")) { $ruta = $ruta + "index.html" }
    $archivo = Join-Path $raiz ($ruta.TrimStart("/") -replace "/", "\")
    $completo = ""
    try { $completo = [IO.Path]::GetFullPath($archivo) } catch { $completo = "" }

    if ($completo -and $completo.StartsWith($raiz, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $completo -PathType Leaf)) {
      $ext = [IO.Path]::GetExtension($completo).ToLower()
      $tipo = $mime[$ext]
      if (-not $tipo) { $tipo = "application/octet-stream" }
      $bytes = [IO.File]::ReadAllBytes($completo)
      $ctx.Response.ContentType = $tipo
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes("404 - aqui no hay nada (de momento)")
      $ctx.Response.ContentType = "text/plain; charset=utf-8"
      $ctx.Response.ContentLength64 = $msg.Length
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
  } catch {
    # Peticion abortada o error puntual: seguimos sirviendo.
  }
}
