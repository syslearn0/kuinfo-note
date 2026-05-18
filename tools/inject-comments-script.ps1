# 全HTMLファイルに <script type="module" src=".../assets/comments.js"></script> を
# </body> の直前に挿入する。冪等（既に入っているファイルはスキップ）。
#
# 使い方: PowerShell で実行
#   pwsh ./tools/inject-comments-script.ps1
# または
#   powershell -File .\tools\inject-comments-script.ps1

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Write-Host "Site root: $root"

$htmlFiles = Get-ChildItem -Path $root -Filter *.html -Recurse -File |
  Where-Object { $_.FullName -notmatch '\\(node_modules|\.git|tools|assets)\\' } |
  Where-Object { $_.Name -ne 'chat.html' }

$marker = 'assets/comments.js'

foreach ($file in $htmlFiles) {
  $rel = $file.FullName.Substring($root.Length).TrimStart('\','/')
  $depth = ($rel -split '[\\/]').Count - 1
  $prefix = if ($depth -eq 0) { '' } else { ('../' * $depth) }
  $src = "$prefix$marker"
  $tag = "<script type=`"module`" src=`"$src`"></script>"

  $content = Get-Content -Raw -Encoding UTF8 $file.FullName
  if ($null -eq $content -or $content.Length -eq 0) {
    Write-Warning "empty/unreadable: $rel"
    continue
  }

  if ($content -match [regex]::Escape($marker)) {
    Write-Host "SKIP (already injected): $rel"
    continue
  }

  if ($content -notmatch '</body>') {
    Write-Warning "no </body> in $rel — skipped"
    continue
  }

  $insertion = "`r`n" + $tag + "`r`n</body>"
  $new = [string]($content -replace '</body>', $insertion)
  if ([string]::IsNullOrEmpty($new)) {
    Write-Warning "replace produced empty result: $rel"
    continue
  }
  $enc = New-Object System.Text.UTF8Encoding $false
  $sw = New-Object System.IO.StreamWriter($file.FullName, $false, $enc)
  $sw.Write($new)
  $sw.Close()
  Write-Host "INJECTED: $rel  ($src)"
}

Write-Host "Done. Total HTML files: $($htmlFiles.Count)"
