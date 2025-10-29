# Script PowerShell para bundificar CSS no Windows

Write-Host "Bundificando CSS..." -ForegroundColor Cyan

# Lista de arquivos CSS na ordem correta
$cssFiles = @(
    "css/reset.css",
    "css/variables.css",
    "css/global.css",
    "css/performance.css",
    "css/components.css",
    "css/sidebar.css",
    "css/player.css",
    "css/home.css",
    "css/search.css",
    "css/library.css",
    "css/browse.css",
    "css/artist.css",
    "css/album.css",
    "css/playlist.css",
    "css/profile.css",
    "css/settings.css",
    "css/premium.css",
    "css/radio.css",
    "css/podcasts.css",
    "css/responsive.css"
)

# Combinar todos os arquivos
$bundleContent = ""
foreach ($file in $cssFiles) {
    if (Test-Path $file) {
        Write-Host "  + Adicionando $file" -ForegroundColor Gray
        $content = Get-Content $file -Raw
        $bundleContent += $content + "`n`n"
    } else {
        Write-Host "  Arquivo nao encontrado: $file" -ForegroundColor Yellow
    }
}

# Salvar bundle
$bundleContent | Out-File -FilePath "css/bundle.css" -Encoding UTF8 -NoNewline

Write-Host "Bundle criado: css/bundle.css" -ForegroundColor Green

# Mostrar tamanho
$size = (Get-Item "css/bundle.css").Length
$sizeKB = [math]::Round($size / 1KB, 2)
Write-Host "Tamanho: $sizeKB KB" -ForegroundColor Cyan
