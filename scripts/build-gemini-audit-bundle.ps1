# VAMO - Generador de bundle de auditoria para Gemini (Windows PowerShell)
# Ejecutar desde la raiz del repo con:
#   powershell -ExecutionPolicy Bypass -File .\scripts\build-gemini-audit-bundle.ps1

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $RepoRoot

$OutDir = Join-Path $RepoRoot '_audit_bundle'
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-TextFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
}

function Append-Text {
    param(
        [Parameter(Mandatory = $true)][System.Text.StringBuilder]$Builder,
        [Parameter(Mandatory = $true)][string]$Text
    )
    [void]$Builder.AppendLine($Text)
}

function Append-FileContent {
    param(
        [Parameter(Mandatory = $true)][System.Text.StringBuilder]$Builder,
        [Parameter(Mandatory = $true)][string]$FilePath
    )

    if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) { return }

    $Relative = [System.IO.Path]::GetRelativePath($RepoRoot, (Resolve-Path -LiteralPath $FilePath))
    Append-Text $Builder ''
    Append-Text $Builder ''
    Append-Text $Builder '================================================================================'
    Append-Text $Builder ("FILE: {0}" -f $Relative.Replace('\\','/'))
    Append-Text $Builder '================================================================================'

    try {
        $Content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8
        [void]$Builder.Append($Content)
        if (-not $Content.EndsWith("`n")) { [void]$Builder.AppendLine() }
    }
    catch {
        Append-Text $Builder ("[ERROR READING FILE: {0}]" -f $_.Exception.Message)
    }
}

function Get-TextFiles {
    param([string[]]$Roots)

    $Allowed = @('.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.md','.txt','.sql','.ps1','.sh','.css','.scss','.yml','.yaml','.toml','.env.example')
    $Files = New-Object System.Collections.Generic.List[System.IO.FileInfo]

    foreach ($Root in $Roots) {
        if (-not (Test-Path -LiteralPath $Root)) { continue }

        if (Test-Path -LiteralPath $Root -PathType Leaf) {
            $Item = Get-Item -LiteralPath $Root
            $Files.Add($Item)
            continue
        }

        Get-ChildItem -LiteralPath $Root -Recurse -File | ForEach-Object {
            $Ext = $_.Extension.ToLowerInvariant()
            if ($Allowed -contains $Ext -or $_.Name.EndsWith('.env.example')) {
                if ($_.FullName -notmatch '[\\/](node_modules|\.next|public)[\\/]') {
                    $Files.Add($_)
                }
            }
        }
    }

    return $Files | Sort-Object FullName -Unique
}

# -----------------------------------------------------------------------------
# 00 - Manifest, Git, Antigravity commit and docs
# -----------------------------------------------------------------------------
$B0 = New-Object System.Text.StringBuilder
Append-Text $B0 '# VAMO AUDIT BUNDLE 00 - DOCS AND COMMIT'
Append-Text $B0 '# Generated from the current checked-out branch'
Append-Text $B0 ''
Append-Text $B0 '# GIT STATUS & LOG'
Append-Text $B0 (git status -sb | Out-String)
Append-Text $B0 (git log -n 10 --oneline | Out-String)
Append-Text $B0 ("HEAD: {0}" -f (git rev-parse HEAD))
Append-Text $B0 ''
Append-Text $B0 '# ANTIGRAVITY COMMIT 574b3b141a6ee7f482d6f338fd223b5fed9957c6'
try { Append-Text $B0 (git show --stat 574b3b141a6ee7f482d6f338fd223b5fed9957c6 | Out-String) } catch { Append-Text $B0 'Commit not available' }
try { Append-Text $B0 (git show 574b3b141a6ee7f482d6f338fd223b5fed9957c6 | Out-String) } catch { }

$RootDocs = @('GEMINI.md','AGENTS.md','CLAUDE.md','README.md','package.json','tsconfig.json','next.config.ts','eslint.config.mjs')
foreach ($F in $RootDocs) { Append-FileContent $B0 (Join-Path $RepoRoot $F) }
foreach ($F in (Get-TextFiles @((Join-Path $RepoRoot 'docs')))) { Append-FileContent $B0 $F.FullName }
Write-TextFile (Join-Path $OutDir '00_DOCS_AND_COMMIT.txt') $B0.ToString()

# -----------------------------------------------------------------------------
# 01 - Core, services, API, auth, DB, types and components
# -----------------------------------------------------------------------------
$B1 = New-Object System.Text.StringBuilder
Append-Text $B1 '# VAMO AUDIT BUNDLE 01 - CORE API AND SERVICES'
$Roots1 = @(
    (Join-Path $RepoRoot 'src/lib'),
    (Join-Path $RepoRoot 'src/app/api'),
    (Join-Path $RepoRoot 'src/types'),
    (Join-Path $RepoRoot 'src/components')
)
foreach ($F in (Get-TextFiles $Roots1)) { Append-FileContent $B1 $F.FullName }
Append-FileContent $B1 (Join-Path $RepoRoot 'src/proxy.ts')
Write-TextFile (Join-Path $OutDir '01_CORE_API_AND_SERVICES.txt') $B1.ToString()

# -----------------------------------------------------------------------------
# 02 - App pages excluding API routes and binary assets
# -----------------------------------------------------------------------------
$B2 = New-Object System.Text.StringBuilder
Append-Text $B2 '# VAMO AUDIT BUNDLE 02 - APP PAGES'
$AppRoot = Join-Path $RepoRoot 'src/app'
if (Test-Path $AppRoot) {
    Get-ChildItem -LiteralPath $AppRoot -Recurse -File |
        Where-Object {
            $_.FullName -notmatch '[\\/]src[\\/]app[\\/]api[\\/]' -and
            $_.Extension.ToLowerInvariant() -in @('.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.md','.css','.scss')
        } |
        Sort-Object FullName |
        ForEach-Object { Append-FileContent $B2 $_.FullName }
}
Write-TextFile (Join-Path $OutDir '02_APP_PAGES.txt') $B2.ToString()

# -----------------------------------------------------------------------------
# 03 - SQL, scripts, tests and scratch text files
# -----------------------------------------------------------------------------
$B3 = New-Object System.Text.StringBuilder
Append-Text $B3 '# VAMO AUDIT BUNDLE 03 - SQL SCRIPTS AND TESTS'
$Roots3 = @(
    (Join-Path $RepoRoot 'supabase'),
    (Join-Path $RepoRoot 'scripts'),
    (Join-Path $RepoRoot 'test'),
    (Join-Path $RepoRoot 'tests'),
    (Join-Path $RepoRoot 'scratch')
)
foreach ($F in (Get-TextFiles $Roots3)) { Append-FileContent $B3 $F.FullName }
Write-TextFile (Join-Path $OutDir '03_SQL_SCRIPTS_AND_TESTS.txt') $B3.ToString()

Write-Host ''
Write-Host '===============================================================' -ForegroundColor Cyan
Write-Host 'VAMO - BUNDLE DE AUDITORIA GENERADO' -ForegroundColor Green
Write-Host '===============================================================' -ForegroundColor Cyan
Write-Host ("Branch: {0}" -f (git branch --show-current))
Write-Host ("HEAD:   {0}" -f (git rev-parse HEAD))
Write-Host ''

Get-ChildItem -LiteralPath $OutDir -File | Sort-Object Name | ForEach-Object {
    $Hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash
    Write-Host ("{0}  {1:N2} MB  SHA256={2}" -f $_.Name, ($_.Length / 1MB), $Hash)
}

Write-Host ''
Write-Host 'Sube a Gemini los cuatro archivos de la carpeta _audit_bundle.' -ForegroundColor Yellow
