$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location "$rootPath/apps/ai-api-fastapi"
& ./venv/Scripts/activate
uvicorn main:app --reload --port 8001 