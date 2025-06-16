$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location "$rootPath/apps/core-api-spring"
& ./mvnw spring-boot:run 