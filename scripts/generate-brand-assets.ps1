Add-Type -AssemblyName System.Drawing

$assetDirectory = (Resolve-Path (Join-Path $PSScriptRoot '..\assets\images')).Path
$size = 1024

function Draw-RoundedRectangle($Graphics, $Brush, [single]$X, [single]$Y, [single]$Width, [single]$Height, [single]$Radius) {
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $Radius * 2
    $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
    $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
    $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    $Graphics.FillPath($Brush, $path)
    $path.Dispose()
}

function New-CalendarMark([string]$Path, [int]$ImageSize, [bool]$UseBackground, [bool]$Monochrome) {
    $bitmap = [System.Drawing.Bitmap]::new($ImageSize, $ImageSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $scale = $ImageSize / 1024.0
    $graphics.ScaleTransform($scale, $scale)
    $green = [System.Drawing.ColorTranslator]::FromHtml('#123D34')
    $cream = if ($Monochrome) { [System.Drawing.Color]::White } else { [System.Drawing.ColorTranslator]::FromHtml('#F7F6EF') }
    $accent = if ($Monochrome) { [System.Drawing.Color]::White } else { [System.Drawing.ColorTranslator]::FromHtml('#E49A5B') }
    if ($UseBackground) {
        $graphics.Clear($green)
    }
    $cardBrush = [System.Drawing.SolidBrush]::new($cream)
    $accentBrush = [System.Drawing.SolidBrush]::new($accent)
    $greenBrush = [System.Drawing.SolidBrush]::new($(if ($Monochrome) { [System.Drawing.Color]::White } else { $green }))
    $ringPen = [System.Drawing.Pen]::new($(if ($UseBackground -or $Monochrome) { $cream } else { $green }), 30)
    $ringPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $ringPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    Draw-RoundedRectangle $graphics $cardBrush 214 260 596 540 80
    Draw-RoundedRectangle $graphics $accentBrush 214 260 596 150 72
    $graphics.FillRectangle($accentBrush, 214, 335, 596, 75)
    $graphics.DrawLine($ringPen, 370, 220, 370, 330)
    $graphics.DrawLine($ringPen, 654, 220, 654, 330)
    $mark = if ($Monochrome) { $cardBrush } else { $greenBrush }
    Draw-RoundedRectangle $graphics $mark 300 470 125 95 25
    Draw-RoundedRectangle $graphics $mark 450 470 125 95 25
    Draw-RoundedRectangle $graphics $mark 600 470 125 95 25
    Draw-RoundedRectangle $graphics $mark 300 620 125 95 25
    Draw-RoundedRectangle $graphics $mark 450 620 125 95 25
    Draw-RoundedRectangle $graphics $(if ($Monochrome) { $mark } else { $accentBrush }) 600 620 125 95 25
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $ringPen.Dispose(); $greenBrush.Dispose(); $accentBrush.Dispose(); $cardBrush.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

New-CalendarMark (Join-Path $assetDirectory 'icon.png') 1024 $true $false
New-CalendarMark (Join-Path $assetDirectory 'splash-icon.png') 512 $false $false
New-CalendarMark (Join-Path $assetDirectory 'android-icon-foreground.png') 1024 $false $false
New-CalendarMark (Join-Path $assetDirectory 'android-icon-monochrome.png') 1024 $false $true
$background = [System.Drawing.Bitmap]::new(1024, 1024)
$graphics = [System.Drawing.Graphics]::FromImage($background)
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#123D34'))
$background.Save((Join-Path $assetDirectory 'android-icon-background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $background.Dispose()
New-CalendarMark (Join-Path $assetDirectory 'favicon.png') 128 $true $false
