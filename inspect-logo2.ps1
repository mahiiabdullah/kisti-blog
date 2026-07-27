Add-Type -AssemblyName System.Drawing
$imgPath = "D:\Vs Stuffs\KiSti\kisti-your-bengali-literary-space-main\public\kishti banner name.png.bak"
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$w = $bmp.Width
$h = $bmp.Height
Write-Output "Original banner dimensions: $w x $h"
$bmp.Dispose()
