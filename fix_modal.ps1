$filePath = "C:\SOLIFIN\frontend\src\pages\admin\components\GeneralSettings.jsx"
$content = Get-Content $filePath
$content[641] = "      </ModalPortal>"
$content | Set-Content $filePath
Write-Host "Fichier corrigé avec succès!"
