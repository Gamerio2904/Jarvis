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
if (Test-Path $TokenFile) { $Token = (Get-Content -Raw $TokenFile).Trim().Trim([char]0xFEFF) }
if ($Token.Length -lt 6) {
  $Token = Get-Random -Minimum 100000 -Maximum 999999
  $Token = $Token.ToString()
  Set-Content -Path $TokenFile -Value $Token -Encoding ASCII
}

$script:LastAction = 'Warte auf das Handy…'
$script:RtcSession = ''

function Get-LanIps {
  $list = New-Object System.Collections.Generic.List[string]
  function Add-Ip([string]$ip) {
    if (-not $ip) { return }
    if ($ip -match '^127\.' -or $ip -match '^169\.254\.') { return }
    if (-not $list.Contains($ip)) { [void]$list.Add($ip) }
  }
  try {
    $gw = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
      Sort-Object RouteMetric, InterfaceMetric |
      Select-Object -First 1
    if ($gw) {
      Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $gw.InterfaceIndex -ErrorAction SilentlyContinue |
        ForEach-Object { Add-Ip $_.IPAddress }
    }
  } catch {}
  try {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | ForEach-Object {
      $alias = [string]$_.InterfaceAlias
      if ($alias -match 'vEthernet|WSL|Hyper-V|Loopback|VirtualBox|VMware|Docker|Default Switch|Bluetooth') { return }
      Add-Ip $_.IPAddress
    }
  } catch {}
  try {
    foreach ($a in [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName())) {
      if ($a.AddressFamily -eq 'InterNetwork') { Add-Ip $a.ToString() }
    }
  } catch {}
  $ordered = @($list | Sort-Object {
    if ($_ -match '^192\.168\.') { 0 }
    elseif ($_ -match '^10\.') { 1 }
    elseif ($_ -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.') { 3 }
    else { 2 }
  })
  return @($ordered)
}

function Test-LikelyLan([string]$ip) {
  return [bool]($ip -match '^192\.168\.' -or $ip -match '^10\.')
}

function Ensure-Firewall {
  $name = "JarvisPC $Port"
  try {
    if (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue) { return $true }
    New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Any -ErrorAction Stop | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Start-FirewallElevated {
  $inner = "New-NetFirewallRule -DisplayName 'JarvisPC $Port' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Any -ErrorAction SilentlyContinue"
  Start-Process powershell -Verb RunAs -ArgumentList @('-NoProfile', '-Command', $inner) -Wait -ErrorAction SilentlyContinue
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
    @{ ok = $true; name = $hit.name; started = $true; message = "$($hit.name) Startbefehl angekommen. Ob das Fenster vorn ist, sehe ich nur auf dem Bildschirm." }
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
        level = 'stream'
        capabilities = @('status','screen','launch','click','move','type','key','files','stream')
        vision = 'off'
        webrtc = 'off'
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
        @{ ok = $true; sent = $true; message = 'Klick gesendet.' }
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
    '/v1/trace' { Invoke-Trace ([string]$body.host) }
    '/v1/webrtc' { Invoke-Webrtc $body }
    '/v1/webrtc/frame' { Invoke-Webrtc ([pscustomobject]@{ action = 'frame' }) }
    default { @{ ok = $false; message = 'Unbekannter Pfad.' } }
  }
}

function Invoke-Webrtc($body) {
  $act = [string]$body.action
  if (-not $act -and $body.sdp) { $act = 'offer' }
  if ($act -eq 'start' -or $act -eq 'offer') {
    $script:RtcSession = ([guid]::NewGuid().ToString('N').Substring(0, 12))
    $script:LastAction = 'Live-Sitzung'
    @{
      ok = $true
      sessionId = $script:RtcSession
      webrtc = 'off'
      mode = 'lan-jpeg'
      ice = 'host'
      message = $(if ($act -eq 'offer') { 'Kein WebRTC-Peer. Live-Bilder über LAN-JPEG.' } else { 'Live-Sitzung (LAN-JPEG).' })
    }
  } elseif ($act -eq 'frame') {
    if (-not $script:RtcSession) { return @{ ok = $false; message = 'Kein Live-Bild offen.' } }
    $shot = New-ScreenshotJpeg
    @{
      ok = $true
      sessionId = $script:RtcSession
      webrtc = 'off'
      mode = 'lan-jpeg'
      frame = $true
      mime = 'image/jpeg'
      image = [Convert]::ToBase64String($shot.bytes)
      width = $shot.width
      height = $shot.height
    }
  } elseif ($act -eq 'hangup') {
    $script:RtcSession = ''
    $script:LastAction = 'Live aus.'
    @{ ok = $true; webrtc = 'off' }
  } elseif ($act -eq 'status') {
    @{
      ok = $true
      sessionId = $script:RtcSession
      webrtc = 'off'
      mode = $(if ($script:RtcSession) { 'lan-jpeg' } else { '' })
      alive = [bool]$script:RtcSession
    }
  } else { @{ ok = $false; message = 'Unbekannte Live-Aktion.' } }
}

function Invoke-Trace([string]$target) {
  $h = ([string]$target).Trim()
  if (-not $h) { return @{ ok = $false; message = 'Kein Host.' } }
  if ($h -notmatch '^[A-Za-z0-9._:-]+$') { return @{ ok = $false; message = 'Host ungültig.' } }
  $script:LastAction = "tracert $h"
  try {
    $raw = & tracert.exe -d -h 15 -w 2000 $h 2>&1
    $hops = @()
    foreach ($line in @($raw)) {
      $s = [string]$line
      if ($s -match '^\s*(\d+)\s+(.+)$') {
        $n = [int]$Matches[1]
        $rest = $Matches[2]
        $ip = $null
        $ms = '*'
        if ($rest -match '((?:\d{1,3}\.){3}\d{1,3})') { $ip = $Matches[1] }
        if ($rest -match '(\d+)\s*ms') { $ms = [int]$Matches[1] }
        $name = if ($ip) { $ip } else { '*' }
        $hops += @{ hop = $n; host = $name; ip = $ip; ms = $ms }
      }
    }
    if (-not $hops.Count) {
      return @{ ok = $false; message = 'Keine Hops. Firewall oder Timeout.'; host = $h }
    }
    @{ ok = $true; host = $h; hops = $hops }
  } catch {
    @{ ok = $false; message = $_.Exception.Message; host = $h }
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
$script:FwOk = Ensure-Firewall

function Add-CopyRow($parent, [int]$y, [string]$caption, [string]$value) {
  $lab = New-Object Windows.Forms.Label
  $lab.SetBounds(8, $y, 460, 18)
  $lab.Text = $caption
  $parent.Controls.Add($lab)
  $box = New-Object Windows.Forms.TextBox
  $box.SetBounds(8, $y + 18, 330, 26)
  $box.ReadOnly = $true
  $box.Text = $value
  $parent.Controls.Add($box)
  $btn = New-Object Windows.Forms.Button
  $btn.SetBounds(346, $y + 16, 110, 30)
  $btn.Text = 'Kopieren'
  $btn.Tag = $value
  $btn.Add_Click({
    $v = [string]$this.Tag
    if ($v) {
      Set-Clipboard -Value $v
      $script:LastAction = 'Kopiert.'
    }
  })
  $parent.Controls.Add($btn)
  return $y + 50
}

$form = New-Object Windows.Forms.Form
$form.Text = 'Jarvis PC'
$form.Width = 510
$form.Height = 700
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox = $false

$ips = Get-LanIps
$copyIp = ''
foreach ($cand in $ips) {
  if (Test-LikelyLan $cand) { $copyIp = $cand; break }
}
if (-not $copyIp -and $ips.Count) { $copyIp = $ips[0] }
$otherIps = @($ips | Where-Object { $_ -ne $copyIp })

$panel = New-Object Windows.Forms.Panel
$panel.SetBounds(8, 8, 478, 590)
$panel.AutoScroll = $true
$form.Controls.Add($panel)

$y = 4
$head = New-Object Windows.Forms.Label
$head.SetBounds(8, $y, 440, 48)
$head.Text = "Bereit auf Port $Port. Gelbe IP ins Handy (192.168 oder 10, nicht 172/WSL). Fenster offen lassen."
$panel.Controls.Add($head)
$y = 54
$y = Add-CopyRow $panel $y 'IP ins Handy (WLAN/LAN)' $copyIp
$y = Add-CopyRow $panel $y 'Port' "$Port"
$y = Add-CopyRow $panel $y 'Token' $Token
if ($otherIps.Count) {
  $alt = New-Object Windows.Forms.Label
  $alt.SetBounds(8, $y, 450, 32)
  $alt.Text = "Weitere IPs, falls Test scheitert: $($otherIps -join ', ')"
  $panel.Controls.Add($alt)
  $y += 34
}
$fw = New-Object Windows.Forms.Button
$fw.SetBounds(8, $y, 448, 32)
$fw.Text = if ($script:FwOk) { 'Firewall: Port 18790 ist frei' } else { 'Firewall erlauben (einmal Admin)' }
$fw.Add_Click({
  Start-FirewallElevated
  $script:FwOk = Ensure-Firewall
  $this.Text = if ($script:FwOk) { 'Firewall: Port 18790 ist frei' } else { 'Firewall erlauben — noch blockiert' }
  $script:LastAction = if ($script:FwOk) { 'Firewall ok.' } else { 'Firewall noch zu. Als Admin erlauben.' }
})
$panel.Controls.Add($fw)
$y += 40
$sub = New-Object Windows.Forms.Label
$sub.SetBounds(8, $y, 440, 20)
$sub.Text = 'Prompts — kopieren, im Handy-Chat einfügen'
$panel.Controls.Add($sub)
$y += 24
$prompts = @(
  'FIFA starten',
  'Was siehst du auf dem PC',
  'PC live',
  'Live aus',
  'klick Mitte',
  'Züge anklicken',
  'Maus nach rechts',
  'Zeig Ordner Downloads',
  'PC testen'
)
foreach ($p in $prompts) { $y = Add-CopyRow $panel $y 'Prompt' $p }
$allBtn = New-Object Windows.Forms.Button
$allBtn.SetBounds(8, $y, 448, 32)
$allBtn.Text = 'Alle Prompts kopieren'
$allBtn.Tag = ($prompts -join "`r`n")
$allBtn.Add_Click({
  Set-Clipboard -Value $this.Tag
  $script:LastAction = 'Alle Prompts kopiert.'
})
$panel.Controls.Add($allBtn)
$winBtn = New-Object Windows.Forms.Button
$winBtn.SetBounds(8, ($y + 36), 448, 32)
$winBtn.Text = 'Jarvis-Fenster'
$winBtn.Add_Click({
  $page = Join-Path $PSScriptRoot 'jarvis-window.html'
  if (Test-Path $page) { Start-Process $page } else { $script:LastAction = 'jarvis-window.html fehlt.' }
})
$panel.Controls.Add($winBtn)

$status = New-Object Windows.Forms.Label
$status.SetBounds(16, 604, 460, 48)
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
        $from = '?'
        try { $from = $client.Client.RemoteEndPoint.ToString() } catch {}
        $script:LastAction = "Anfrage von $from"
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
          $script:LastAction = "Token falsch von $from"
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
