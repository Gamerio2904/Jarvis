# Jarvis PC — Desktop-Fenster. Handy steuert Bildschirm, Maus, Programme, Ordner.
# Start: JarvisPC.bat  ·  Token + IP → Jarvis auf dem Handy, Einstellungen → PC

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class JarvisInput {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT p);
  public struct POINT { public int X; public int Y; }
}
"@

$Port = 18790
$DataDir = Join-Path $env:LOCALAPPDATA 'JarvisPC'
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$TokenFile = Join-Path $DataDir 'token.txt'
$Token = ''
if (Test-Path $TokenFile) { $Token = (Get-Content -Raw $TokenFile).Trim() }
if ($Token.Length -lt 6) {
  $Token = Get-Random -Minimum 100000 -Maximum 999999
  $Token = $Token.ToString()
  Set-Content -Path $TokenFile -Value $Token -Encoding ASCII
}

$script:LastAction = 'Warte auf das Handy…'

function Get-LanIps {
  $list = New-Object System.Collections.Generic.List[string]
  try {
    foreach ($a in [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName())) {
      if ($a.AddressFamily -eq 'InterNetwork' -and $a.ToString() -notmatch '^127\.') { [void]$list.Add($a.ToString()) }
    }
  } catch {}
  return @($list)
}

function Get-UserRoot { [Environment]::GetFolderPath('UserProfile') }

function Resolve-SafePath([string]$raw) {
  if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
  $t = $raw.Trim().Trim('"')
  $map = @{
    desktop   = [Environment]::GetFolderPath('Desktop')
    downloads = Join-Path (Get-UserRoot) 'Downloads'
    dokumente = [Environment]::GetFolderPath('MyDocuments')
    documents = [Environment]::GetFolderPath('MyDocuments')
    bilder    = [Environment]::GetFolderPath('MyPictures')
    pictures  = [Environment]::GetFolderPath('MyPictures')
    home      = Get-UserRoot
  }
  $low = $t.ToLowerInvariant()
  if ($map.ContainsKey($low)) { return $map[$low] }
  foreach ($k in @($map.Keys)) {
    if ($low.StartsWith("$k\") -or $low.StartsWith("$k/")) {
      $t = Join-Path $map[$k] ($t.Substring($k.Length).TrimStart('\','/'))
      break
    }
  }
  if (-not [IO.Path]::IsPathRooted($t)) { $t = Join-Path (Get-UserRoot) $t }
  $full = [IO.Path]::GetFullPath($t)
  $root = [IO.Path]::GetFullPath((Get-UserRoot)).TrimEnd('\')
  if ($full -ne $root -and -not $full.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { return $null }
  return $full
}

function Get-PrimaryBounds { [Windows.Forms.Screen]::PrimaryScreen.Bounds }

function New-ScreenshotJpeg {
  $b = Get-PrimaryBounds
  $bmp = New-Object Drawing.Bitmap $b.Width, $b.Height
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($b.Location, [Drawing.Point]::Empty, $b.Size)
  $g.Dispose()
  $img = $bmp
  $maxW = 960
  if ($bmp.Width -gt $maxW) {
    $nh = [int]($bmp.Height * ($maxW / [double]$bmp.Width))
    $img = New-Object Drawing.Bitmap $maxW, $nh
    $g2 = [Drawing.Graphics]::FromImage($img)
    $g2.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.DrawImage($bmp, 0, 0, $maxW, $nh)
    $g2.Dispose()
    $bmp.Dispose()
  }
  $ms = New-Object IO.MemoryStream
  $enc = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality, [long]52)
  $img.Save($ms, $enc, $ep)
  $bytes = $ms.ToArray()
  $w = $img.Width; $h = $img.Height
  $img.Dispose(); $ms.Dispose()
  @{ bytes = $bytes; width = $w; height = $h; screenW = $b.Width; screenH = $b.Height }
}

function Move-Pointer([int]$x, [int]$y) {
  $b = Get-PrimaryBounds
  $x = [Math]::Max($b.Left, [Math]::Min($b.Right - 1, $x))
  $y = [Math]::Max($b.Top, [Math]::Min($b.Bottom - 1, $y))
  [JarvisInput]::SetCursorPos($x, $y) | Out-Null
  @{ x = $x; y = $y }
}

function Send-Click([string]$button, [int]$times) {
  $down = if ($button -eq 'right') { 8 } else { 2 }
  $up = if ($button -eq 'right') { 16 } else { 4 }
  $n = [Math]::Max(1, [Math]::Min(3, $times))
  1..$n | ForEach-Object {
    [JarvisInput]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 25
    [JarvisInput]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 60
  }
}

function Find-Launch([string]$query) {
  $q = $query.Trim()
  if (-not $q) { return $null }
  $rx = [regex]::Escape($q)
  if ($q -match '^(fifa|ea\s*fc|ea\s*sports\s*fc|fc\s*2[0-9])$') { $rx = 'FIFA|EA SPORTS FC|EA Sports FC|\bFC 2[0-9]\b' }
  try {
    $hit = Get-StartApps | Where-Object { $_.Name -match $rx } | Select-Object -First 1
    if ($hit) { return @{ kind = 'appid'; name = $hit.Name; target = $hit.AppID } }
  } catch {}
  foreach ($root in @(${env:ProgramFiles}, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'Programs'))) {
    if (-not $root -or -not (Test-Path $root)) { continue }
    $exe = Get-ChildItem $root -Filter *.exe -Recurse -EA SilentlyContinue |
      Where-Object { $_.Name -match $rx -or $_.DirectoryName -match $rx } |
      Select-Object -First 1
    if ($exe) { return @{ kind = 'exe'; name = $exe.BaseName; target = $exe.FullName } }
  }
  $null
}

function Invoke-Launch([string]$query) {
  $hit = Find-Launch $query
  if (-not $hit) { return @{ ok = $false; message = "„$query“ nicht gefunden. Steam oder EA App installiert? Startmenü-Name prüfen." } }
  try {
    if ($hit.kind -eq 'appid') { Start-Process "shell:AppsFolder\$($hit.target)" | Out-Null }
    else { Start-Process $hit.target | Out-Null }
    $script:LastAction = "Start: $($hit.name)"
    @{ ok = $true; name = $hit.name; message = "$($hit.name) gestartet. Ob das Fenster vorn ist, sehe ich nur auf dem Bildschirm." }
  } catch {
    @{ ok = $false; message = "Start fehlgeschlagen: $($_.Exception.Message)" }
  }
}

function Invoke-Files($body) {
  $op = [string]$body.op
  $path = Resolve-SafePath ([string]$body.path)
  if (-not $path) { return @{ ok = $false; message = 'Pfad nur unter Ihrem Benutzerordner (Desktop, Downloads, Dokumente).' } }
  try {
    switch ($op) {
      'list' {
        if (-not (Test-Path $path)) { return @{ ok = $false; message = "Ordner nicht da: $path" } }
        $lines = @(Get-ChildItem -LiteralPath $path | Select-Object -First 40 | ForEach-Object {
          if ($_.PSIsContainer) { "[Ordner] $($_.Name)" } else { $_.Name }
        })
        @{ ok = $true; path = $path; entries = $lines; message = $(if ($lines.Count) { $lines -join "`n" } else { 'Ordner ist leer.' }) }
      }
      'mkdir' {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        $script:LastAction = "Ordner $path"
        @{ ok = $true; path = $path; message = "Ordner liegt: $path" }
      }
      'open' {
        if (-not (Test-Path $path)) { return @{ ok = $false; message = "Nicht da: $path" } }
        Start-Process explorer.exe $path | Out-Null
        $script:LastAction = "Explorer $path"
        @{ ok = $true; path = $path; message = "Explorer: $path" }
      }
      { $_ -in 'rename','move' } {
        $dest = Resolve-SafePath ([string]$body.dest)
        if (-not $dest) { return @{ ok = $false; message = 'Zielpfad unzulässig.' } }
        if (-not (Test-Path $path)) { return @{ ok = $false; message = "Nicht da: $path" } }
        Move-Item -LiteralPath $path -Destination $dest -Force
        $script:LastAction = "Verschoben $dest"
        @{ ok = $true; path = $dest; message = "Jetzt: $dest" }
      }
      'delete' {
        if (-not (Test-Path $path)) { return @{ ok = $false; message = "Nicht da: $path" } }
        Remove-Item -LiteralPath $path -Recurse -Force
        $script:LastAction = "Gelöscht $path"
        @{ ok = $true; message = "Weg: $path" }
      }
      default { @{ ok = $false; message = 'Unbekannte Datei-Aktion.' } }
    }
  } catch {
    @{ ok = $false; message = $_.Exception.Message }
  }
}

function Handle-Command([string]$path, $body) {
  switch ($path) {
    '/v1/status' {
      $b = Get-PrimaryBounds
      $p = New-Object JarvisInput+POINT
      [JarvisInput]::GetCursorPos([ref]$p) | Out-Null
      @{
        ok = $true; app = 'JarvisPC'; port = $Port; ips = @(Get-LanIps)
        screen = @{ width = $b.Width; height = $b.Height }
        cursor = @{ x = $p.X; y = $p.Y }
        last = $script:LastAction
      }
    }
    '/v1/screenshot' {
      $shot = New-ScreenshotJpeg
      $script:LastAction = 'Bildschirm gelesen.'
      @{
        ok = $true; mime = 'image/jpeg'
        image = [Convert]::ToBase64String($shot.bytes)
        width = $shot.width; height = $shot.height
        screenW = $shot.screenW; screenH = $shot.screenH
      }
    }
    '/v1/input' {
      $kind = [string]$body.kind
      $b = Get-PrimaryBounds
      $x = $null; $y = $null
      if ($null -ne $body.nx -and $null -ne $body.ny) {
        $x = [int]($b.Left + [double]$body.nx * $b.Width)
        $y = [int]($b.Top + [double]$body.ny * $b.Height)
      } elseif ($null -ne $body.x -and $null -ne $body.y) {
        $x = [int]$body.x; $y = [int]$body.y
      }
      if ($kind -eq 'move') {
        if ($null -eq $x) {
          $p = New-Object JarvisInput+POINT
          [JarvisInput]::GetCursorPos([ref]$p) | Out-Null
          $x = $p.X + $(if ($null -ne $body.dx) { [int]$body.dx } else { 0 })
          $y = $p.Y + $(if ($null -ne $body.dy) { [int]$body.dy } else { 0 })
        }
        $pos = Move-Pointer $x $y
        $script:LastAction = "Maus $($pos.x),$($pos.y)"
        @{ ok = $true; x = $pos.x; y = $pos.y; message = "Maus $($pos.x), $($pos.y)." }
      } elseif ($kind -eq 'click') {
        if ($null -ne $x) { [void](Move-Pointer $x $y) }
        $btn = if ([string]$body.button -eq 'right') { 'right' } else { 'left' }
        $times = if ($body.times) { [int]$body.times } else { 1 }
        Send-Click $btn $times
        $script:LastAction = "Klick $btn"
        @{ ok = $true; message = 'Klick ausgeführt.' }
      } elseif ($kind -eq 'type') {
        $text = [string]$body.text
        if (-not $text) { return @{ ok = $false; message = 'Kein Text.' } }
        [Windows.Forms.SendKeys]::SendWait($text)
        $script:LastAction = 'Getippt'
        @{ ok = $true; message = 'Getippt.' }
      } elseif ($kind -eq 'key') {
        $map = @{ enter = '{ENTER}'; esc = '{ESC}'; escape = '{ESC}'; tab = '{TAB}'; space = ' '; backspace = '{BACKSPACE}' }
        $k = ([string]$body.key).ToLowerInvariant()
        if (-not $map.ContainsKey($k)) { return @{ ok = $false; message = "Taste unbekannt: $k" } }
        [Windows.Forms.SendKeys]::SendWait($map[$k])
        $script:LastAction = "Taste $k"
        @{ ok = $true; message = "Taste $k." }
      } else { @{ ok = $false; message = 'Unbekannte Eingabe.' } }
    }
    '/v1/launch' { Invoke-Launch ([string]$body.query) }
    '/v1/files' { Invoke-Files $body }
    default { @{ ok = $false; message = 'Unbekannter Pfad.' } }
  }
}

function Write-Http($client, $obj) {
  $json = $obj | ConvertTo-Json -Compress -Depth 8
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $head = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Headers: *`r`nAccess-Control-Allow-Methods: GET, POST, OPTIONS`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
  $stream = $client.GetStream()
  $hb = [Text.Encoding]::ASCII.GetBytes($head)
  $stream.Write($hb, 0, $hb.Length)
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Flush()
}

$script:Tcp = New-Object Net.Sockets.TcpListener ([Net.IPAddress]::Any, $Port)
try { $script:Tcp.Start() } catch {
  [Windows.Forms.MessageBox]::Show("Port $Port belegt. Andere Jarvis-PC-App schließen.")
  exit 1
}

$form = New-Object Windows.Forms.Form
$form.Text = 'Jarvis PC'
$form.Width = 480; $form.Height = 360
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox = $false

$ips = Get-LanIps
$ipText = if ($ips.Count) { $ips -join ', ' } else { 'keine LAN-IP — WLAN prüfen' }

$lbl = New-Object Windows.Forms.Label
$lbl.SetBounds(18, 16, 430, 230)
$lbl.Font = New-Object Drawing.Font 'Segoe UI', 10
$lbl.Text = @"
Bereit auf Port $Port

IP (ins Handy): $ipText
Token: $Token

Gleiches WLAN. Jarvis → Einstellungen → PC
IP, Port $Port, Token, Schalter an.

Dann: FIFA starten · Was siehst du auf dem PC
klick Mitte · Ordner Desktop
"@
$form.Controls.Add($lbl)

$status = New-Object Windows.Forms.Label
$status.SetBounds(18, 255, 430, 50)
$status.Text = $script:LastAction
$form.Controls.Add($status)

$uiTimer = New-Object Windows.Forms.Timer
$uiTimer.Interval = 400
$uiTimer.Add_Tick({ $status.Text = $script:LastAction })
$uiTimer.Start()

$serveTimer = New-Object Windows.Forms.Timer
$serveTimer.Interval = 40
$serveTimer.Add_Tick({
  try {
    while ($script:Tcp.Pending()) {
      $client = $script:Tcp.AcceptTcpClient()
      try {
        $client.ReceiveTimeout = 12000
        $stream = $client.GetStream()
        $deadline = [DateTime]::UtcNow.AddSeconds(2)
        $ms = New-Object IO.MemoryStream
        $buf = New-Object byte[] 16384
        do {
          if ($stream.DataAvailable) {
            $n = $stream.Read($buf, 0, $buf.Length)
            if ($n -le 0) { break }
            $ms.Write($buf, 0, $n)
          } else { Start-Sleep -Milliseconds 15 }
        } while ([DateTime]::UtcNow -lt $deadline -and ($ms.Length -eq 0 -or $stream.DataAvailable))
        $raw = [Text.Encoding]::UTF8.GetString($ms.ToArray())
        if (-not $raw) { $client.Close(); continue }
        if ($raw -match '^OPTIONS') { Write-Http $client @{ ok = $true }; $client.Close(); continue }
        $reqPath = '/'
        if ($raw -match '^(GET|POST)\s+(\S+)') { $reqPath = $Matches[2].Split('?')[0] }
        $auth = ''
        if ($raw -match '(?im)^X-Jarvis-Token:\s*(\S+)') { $auth = $Matches[1].Trim() }
        elseif ($raw -match '(?im)^Authorization:\s*Bearer\s+(\S+)') { $auth = $Matches[1].Trim() }
        if ($auth -ne $Token) {
          Write-Http $client @{ ok = $false; message = 'Token falsch. Den Code aus diesem Fenster eintragen.' }
          $client.Close(); continue
        }
        $bodyRaw = ''
        $idx = $raw.IndexOf("`r`n`r`n")
        if ($idx -ge 0) { $bodyRaw = $raw.Substring($idx + 4) }
        $body = $null
        try { if ($bodyRaw.Trim()) { $body = $bodyRaw | ConvertFrom-Json } } catch { $body = $null }
        if (-not $body) { $body = [pscustomobject]@{} }
        Write-Http $client (Handle-Command $reqPath $body)
      } catch {
        $script:LastAction = $_.Exception.Message
        try { Write-Http $client @{ ok = $false; message = 'PC-App: Interner Fehler.' } } catch {}
      } finally { try { $client.Close() } catch {} }
    }
  } catch { $script:LastAction = $_.Exception.Message }
})
$serveTimer.Start()

$form.Add_FormClosed({
  $serveTimer.Stop(); $uiTimer.Stop()
  try { $script:Tcp.Stop() } catch {}
})

[Windows.Forms.Application]::Run($form)
