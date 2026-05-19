# Continuum — Android signing setup helper (Windows / PowerShell)
#
# Generates a release keystore for Play Store signing and writes
# android/key.properties so subsequent `./gradlew bundleRelease` builds
# produce a signed AAB ready to upload.
#
# Run from the repo root:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-android-signing.ps1
#
# Prerequisites: Android Studio installed (for the bundled keytool), or
# a JDK 11+ on PATH.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Continuum — Android signing setup" -ForegroundColor Cyan
Write-Host "---------------------------------------------"
Write-Host "This will create a release keystore at:"
Write-Host "  $HOME\keystores\continuum-release.keystore"
Write-Host ""
Write-Host "  WARNING: BACK UP THIS FILE + PASSWORD." -ForegroundColor Yellow
Write-Host "  Losing it means you can never update the app on Play Store again."
Write-Host ""

# Find keytool — Android Studio bundles a JBR with it
$keytool = $null
$candidates = @(
    "${env:ProgramFiles}\Android\Android Studio\jbr\bin\keytool.exe",
    "${env:LocalAppData}\Programs\Android Studio\jbr\bin\keytool.exe",
    "keytool"
)
foreach ($c in $candidates) {
    if ($c -eq "keytool") {
        if (Get-Command keytool -ErrorAction SilentlyContinue) { $keytool = "keytool"; break }
    } elseif (Test-Path $c) {
        $keytool = $c; break
    }
}
if (-not $keytool) {
    Write-Host "Could not find keytool. Install Android Studio first (it bundles a JBR), or install a JDK." -ForegroundColor Red
    exit 1
}
Write-Host "Using keytool: $keytool" -ForegroundColor Gray
Write-Host ""

# Prompt for password
$pwd1 = Read-Host -AsSecureString "Choose a keystore password (min 6 chars)"
$pwd2 = Read-Host -AsSecureString "Confirm the password"
$BSTR1 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwd1)
$BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwd2)
$plain1 = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR1)
$plain2 = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR1)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2)
if ($plain1 -ne $plain2) {
    Write-Host "Passwords do not match." -ForegroundColor Red
    exit 1
}
if ($plain1.Length -lt 6) {
    Write-Host "Password must be at least 6 characters." -ForegroundColor Red
    exit 1
}

# Identity (used in the keystore certificate — won't be displayed publicly)
Write-Host ""
Write-Host "Certificate identity (visible only in the cert metadata):" -ForegroundColor Gray
$cn  = Read-Host "  Your name"
$ou  = "Continuum"
$o   = "Continuum"
$l   = Read-Host "  City (e.g. Hamilton)"
$st  = Read-Host "  State / region (e.g. Pembroke)"
$c   = Read-Host "  Country code (2 letters, e.g. BM, US)"

$keystoreDir = Join-Path $HOME "keystores"
if (-not (Test-Path $keystoreDir)) { New-Item -ItemType Directory -Path $keystoreDir | Out-Null }
$keystorePath = Join-Path $keystoreDir "continuum-release.keystore"

if (Test-Path $keystorePath) {
    Write-Host ""
    Write-Host "A keystore already exists at $keystorePath." -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
    Remove-Item $keystorePath
}

$dname = "CN=$cn, OU=$ou, O=$o, L=$l, ST=$st, C=$c"

Write-Host ""
Write-Host "Generating keystore..." -ForegroundColor Cyan
& $keytool -genkeypair -v `
    -keystore $keystorePath `
    -alias continuum `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $plain1 -keypass $plain1 `
    -dname $dname

if ($LASTEXITCODE -ne 0) {
    Write-Host "keytool failed." -ForegroundColor Red
    exit 1
}

# Write key.properties
$keyPropsPath = Join-Path (Get-Location) "android\key.properties"
$keystorePathForGradle = $keystorePath -replace '\\', '/'
@"
storePassword=$plain1
keyPassword=$plain1
keyAlias=continuum
storeFile=$keystorePathForGradle
"@ | Set-Content -Path $keyPropsPath -Encoding UTF8

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "  Keystore: $keystorePath"
Write-Host "  Properties: $keyPropsPath"
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Save your password in 1Password / Bitwarden (you'll never see it again)"
Write-Host "  2. Copy $keystorePath to a backup drive AND your password manager (as an attachment)"
Write-Host "  3. Build the signed AAB:"
Write-Host "       cd android"
Write-Host "       .\gradlew.bat bundleRelease"
Write-Host "     Output: android\app\build\outputs\bundle\release\app-release.aab"
Write-Host ""
