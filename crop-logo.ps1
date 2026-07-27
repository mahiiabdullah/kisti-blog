Add-Type -AssemblyName System.Drawing
$imgPath = "D:\Vs Stuffs\KiSti\kisti-your-bengali-literary-space-main\public\kishti banner name_2.png"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$w = $bmp.Width
$h = $bmp.Height

$minX = $w
$maxX = 0
$minY = $h
$maxY = 0
$hasContent = $false

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 10) {
            $hasContent = $true
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

if ($hasContent) {
    # Add a tiny 4px padding so edges aren't cut too close
    $padding = 4
    $minX = [math]::Max(0, $minX - $padding)
    $minY = [math]::Max(0, $minY - $padding)
    $maxX = [math]::Min($w - 1, $maxX + $padding)
    $maxY = [math]::Min($h - 1, $maxY + $padding)

    $cropWidth = $maxX - $minX + 1
    $cropHeight = $maxY - $minY + 1

    Write-Output "Content Bounding Box: X: $minX to $maxX, Y: $minY to $maxY ($cropWidth x $cropHeight)"

    $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropWidth, $cropHeight)
    $croppedBmp = $bmp.Clone($cropRect, $bmp.PixelFormat)

    $bmp.Dispose()
    # Save back to original file
    $croppedBmp.Save($imgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $croppedBmp.Dispose()
    Write-Output "Successfully cropped empty space from logo!"
} else {
    $bmp.Dispose()
    Write-Output "No content found in image."
}
