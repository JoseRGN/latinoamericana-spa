$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path "imagenes_productos" | Out-Null

$content = Get-Content -Path "products.js" -Raw -Encoding UTF8

$pattern = 'id:\s*"([^"]+)",[\s\S]*?image:\s*"(https://image.pollinations.ai[^"]+)"'
$regex = [regex]$pattern
$matches = $regex.Matches($content)

$jobs = @()

foreach ($match in $matches) {
    $id = $match.Groups[1].Value
    $url = $match.Groups[2].Value
    $localPath = "imagenes_productos/$id.jpg"
    
    $content = $content.Replace("image: `"$url`"", "image: `"$localPath`"")
    
    if (-not (Test-Path $localPath)) {
        Write-Host "Queuing download for $id..."
        $scriptBlock = {
            param($u, $p)
            try {
                Invoke-WebRequest -Uri $u -OutFile $p -UseBasicParsing
                return "Success: $p"
            } catch {
                return "Failed: $p"
            }
        }
        $jobs += Start-Job -ScriptBlock $scriptBlock -ArgumentList $url, $localPath
    }
}

Write-Host "Waiting for downloads to finish..."
if ($jobs.Count -gt 0) {
    $jobs | Wait-Job | Out-Null
    $jobs | Receive-Job
    $jobs | Remove-Job
}

Set-Content -Path "products.js" -Value $content -Encoding UTF8
Write-Host "Done updating products.js"
