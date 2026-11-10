$ErrorActionPreference = 'Stop'

# 실제 서비스 파일만 모아 Git 이력, 환경 파일, 내부 문서를 업로드에서 제외합니다.
$projectRoot = Split-Path -Parent $PSScriptRoot
$deployRoot = Join-Path $projectRoot 'deploy'
New-Item -ItemType Directory -Path $deployRoot -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $projectRoot 'index.html') -Destination $deployRoot -Force
foreach ($folder in @('html', 'css', 'js', 'img')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $folder) -Destination $deployRoot -Recurse -Force
}

Write-Output "배포 폴더 준비 완료: $deployRoot"
