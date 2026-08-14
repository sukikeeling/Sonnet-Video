$env:JAVA_HOME = "D:\jdk21\jdk-21.0.12+8"
$env:PATH = "D:\jdk21\jdk-21.0.12+8\bin;$env:PATH"
Set-Location "C:\Users\29963\AppData\Roaming\reasonix\global-workspace\BK-SV-v3.0-Personal\android"
& .\gradlew.bat assembleRelease --no-daemon
if ($LASTEXITCODE -eq 0) {
    Write-Host "BUILD SUCCESS"
} else {
    Write-Host "BUILD FAILED with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}