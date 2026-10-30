# Sintetiza um texto em WAV usando o Piper TTS (voz neural, offline).
# Mesmo padrão de sintetizar-voz.ps1 (SAPI): texto vem de um ARQUIVO
# (nunca da linha de comando), pra nunca depender de escapar aspas ou
# acentos no shell.
param(
  [Parameter(Mandatory = $true)][string]$TextoArquivo,
  [Parameter(Mandatory = $true)][string]$SaidaWav,
  [Parameter(Mandatory = $true)][string]$Modelo,
  [double]$LengthScale = 1.0
)

if (-not (Test-Path -LiteralPath $Modelo)) {
  Write-Error "Modelo Piper não encontrado: $Modelo (rode: python -m piper.download_voices --download-dir <pasta> <voz>)"
  exit 1
}

Get-Content -LiteralPath $TextoArquivo -Raw -Encoding UTF8 | python -m piper -m $Modelo -f $SaidaWav --length-scale $LengthScale --sentence-silence 0.15
if ($LASTEXITCODE -ne 0) {
  Write-Error "Piper falhou (código $LASTEXITCODE)"
  exit $LASTEXITCODE
}

Write-Output "OK"
