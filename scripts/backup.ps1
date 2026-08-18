# backup.ps1
# Script to backup the Next.js application (zipping the folder, excluding node_modules and .next)

$sourceFolder = "."
$backupFolder = "backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = "$backupFolder\app_backup_$timestamp.zip"

# Create backup directory if it doesn't exist
If (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Force -Path $backupFolder
}

Write-Host "Memulai kompresi aplikasi..."
Write-Host "Tujuan: $zipFile"

# Exclude heavy directories
$excludePatterns = @("node_modules", ".next", ".git", "backups")

# Compress using Compress-Archive
Get-ChildItem -Path $sourceFolder -Recurse -Exclude $excludePatterns | 
    Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\\.next\\" -and $_.FullName -notmatch "\\\.git\\" -and $_.FullName -notmatch "\\backups\\" } |
    Compress-Archive -DestinationPath $zipFile -Force

Write-Host "Backup aplikasi selesai! File tersimpan di: $zipFile" -ForegroundColor Green
