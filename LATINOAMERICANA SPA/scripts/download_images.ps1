$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path "imagenes_productos" | Out-Null

$content = Get-Content -Path "products.js" -Raw -Encoding UTF8

$pattern = 'id:\s*"([^"]+)",[\s\S]*?image:\s*"(https://image.pollinations.ai[^"]+)"'
$regex = [regex]$pattern
$matches = $regex.Matches($content)

foreach ($match in $matches) {
    $id = $match.Groups[1].Value
    $url = $match.Groups[2].Value
    
    $localPath = "imagenes_productos/$id.jpg"
    
    Write-Host "Downloading $id..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing
        $content = $content.Replace("image: `"$url`"", "image: `"$localPath`"")
    } catch {
        Write-Host "Failed to download $id"
    }
}

Set-Content -Path "products.js" -Value $content -Encoding UTF8
Write-Host "Done updating products.js"
