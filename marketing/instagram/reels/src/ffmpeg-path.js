// Acha ffmpeg/ffprobe mesmo quando não estão no PATH do processo Node
// (comum logo depois de um "winget install": o instalador atualiza o
// PATH do Windows, mas um terminal/processo já aberto não vê a
// mudança até reiniciar). Tenta o PATH primeiro (comando simples); se
// falhar, procura dentro da pasta padrão do winget.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function noPath(comando) {
  try {
    execSync(`${comando} -version`, { stdio: 'ignore' });
    return comando;
  } catch {
    return null;
  }
}

function procurarNoWinget(nomeExe) {
  const base = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft', 'WinGet', 'Packages'
  );
  if (!fs.existsSync(base)) return null;
  const pacoteFfmpeg = fs.readdirSync(base).find((p) => p.startsWith('Gyan.FFmpeg'));
  if (!pacoteFfmpeg) return null;
  // procura recursivamente (a versão do build muda o nome da subpasta)
  const pilha = [path.join(base, pacoteFfmpeg)];
  while (pilha.length) {
    const dir = pilha.pop();
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const completo = path.join(dir, item.name);
      if (item.isDirectory()) pilha.push(completo);
      else if (item.name.toLowerCase() === nomeExe.toLowerCase()) return completo;
    }
  }
  return null;
}

function resolver(nome) {
  const peloPath = noPath(nome);
  if (peloPath) return peloPath;
  const exe = `${nome}.exe`;
  const achado = procurarNoWinget(exe);
  if (achado) return achado;
  throw new Error(
    `${nome} não encontrado no PATH nem na pasta padrão do winget. ` +
    `Instale com "winget install Gyan.FFmpeg" ou adicione ao PATH.`
  );
}

module.exports = {
  FFMPEG: resolver('ffmpeg'),
  FFPROBE: resolver('ffprobe'),
};
