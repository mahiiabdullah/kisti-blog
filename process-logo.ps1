Add-Type -AssemblyName System.Drawing
$imgPath = "D:\Vs Stuffs\KiSti\kisti-your-bengali-literary-space-main\public\kishti banner name.png"

# Make a backup first
Copy-Item $imgPath ($imgPath + ".bak") -Force

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$width = $bmp.Width
$height = $bmp.Height
$newBmp = New-Object System.Drawing.Bitmap($width, $height)

# Target color is Deep Ink Navy: #0C2955 (R: 12, G: 41, B: 85)
$targetR = 12
$targetG = 41
$targetB = 85

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $alpha = 0
        if ($c.R -gt 12) {
            $alpha = [math]::Round(255 * ($c.R - 12) / (255 - 12))
            if ($alpha -gt 255) { $alpha = 255 }
            if ($alpha -lt 0) { $alpha = 0 }
        }
        $newColor = [System.Drawing.Color]::FromArgb($alpha, $targetR, $targetG, $targetB)
        $newBmp.SetPixel($x, $y, $newColor)
    }
}

$bmp.Dispose()
$newBmp.Save($imgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$newBmp.Dispose()
Write-Output "Logo background successfully blended to transparent, and text colored to navy blue!"
