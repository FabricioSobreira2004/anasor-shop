# Sintetiza um texto em WAV usando o Piper TTS (voz neural, offline).
# Mesmo padrão de sintetizar-voz.ps1 (SAPI): texto vem de um ARQUIVO
# (nunca da linha de comando), pra nunca depender de escapar aspas ou
# acentos no shell.
#
# --noise-w-scale 0 (Rodada 7, ACHADO testando a Etapa 1 do pedido):
# o Piper (VITS) tem um preditor de duração ESTOCÁSTICO — com o
# padrão da CLI (~0.8), a MESMA frase/voz/ritmo sai com duração
# diferente a cada execução (testado: 22,65s a 23,73s pro mesmo texto
# de 85 palavras, variando só esse parâmetro). O pedido era reproduzir
# a MESMA voz/ritmo da amostra escolhida de forma confiável — com
# noise-w-scale 0 a duração fica DETERMINÍSTICA (sempre igual pro
# mesmo texto), o que também torna a estimativa de tempo da legenda
# (legendar.js) confiável. Timbre/entonação (noise-scale) não foi
# tocado — só a aleatoriedade de DURAÇÃO.
#
# --sentence-silence 0.05 (Rodada 9, achado do Fabrício: "pausas de
# 0,5 a 0,75s no meio de frases dão sensação de travando"): testei
# isolar a causa — gerei o MESMO texto sem nenhuma vírgula E com
# --sentence-silence 0 (zerado) e AINDA saíram pausas de 0,48-0,67s
# espalhadas (silencedetect, d=0,4) em pontos que não são nem vírgula
# nem fim de frase. Ou seja: a pausa NÃO vem deste parâmetro nem de
# pontuação — é o PRÓPRIO MODELO (comportamento prosódico do VITS
# esticado em length_scale 0,7, "mais pausado" por natureza, a mesma
# característica da amostra aprovada pelo Fabrício). Não dá pra
# eliminar sem mudar o ritmo (fora de escopo — "voz jeff, ritmo 0.7
# mantida", pedido explícito). Baixei 0.15→0.05 (ainda uma pausa
# mínima ENTRE frases, sem silêncio morto) — é a única redução
# disponível sem tocar no ritmo; ver DECISOES.md.
param(
  [Parameter(Mandatory = $true)][string]$TextoArquivo,
  [Parameter(Mandatory = $true)][string]$SaidaWav,
  [Parameter(Mandatory = $true)][string]$Modelo,
  [double]$LengthScale = 1.0,
  [double]$NoiseWScale = 0
)

if (-not (Test-Path -LiteralPath $Modelo)) {
  Write-Error "Modelo Piper não encontrado: $Modelo (rode: python -m piper.download_voices --download-dir <pasta> <voz>)"
  exit 1
}

Get-Content -LiteralPath $TextoArquivo -Raw -Encoding UTF8 | python -m piper -m $Modelo -f $SaidaWav --length-scale $LengthScale --noise-w-scale $NoiseWScale --sentence-silence 0.05
if ($LASTEXITCODE -ne 0) {
  Write-Error "Piper falhou (código $LASTEXITCODE)"
  exit $LASTEXITCODE
}

Write-Output "OK"
