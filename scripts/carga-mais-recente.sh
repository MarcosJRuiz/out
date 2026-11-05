#!/usr/bin/env bash
# Baixa os resultados da última execução aprovada do workflow Carga na main (artifacts carga-oficial e
# carga-estresse) para <destino>/oficial e <destino>/estresse. Sem execução disponível, ou com os artifacts
# expirados, usa o último resultado versionado em evidencias/load. A origem fica em <destino>/execucao.json.
#
# Uso: GH_TOKEN=... GITHUB_REPOSITORY=dono/repo scripts/carga-mais-recente.sh <destino>
set -uo pipefail

destino=$1
rm -rf "$destino"
mkdir -p "$destino"

read -r execucao commit < <(gh run list -R "$GITHUB_REPOSITORY" -w Carga -b main -s success -L 1 \
  --json databaseId,headSha -q '.[0] | "\(.databaseId) \(.headSha)"' 2>/dev/null)

if [ -n "${execucao:-}" ] && [ "$execucao" != null ] &&
  gh run download "$execucao" -R "$GITHUB_REPOSITORY" -n carga-oficial -D "$destino/oficial" &&
  gh run download "$execucao" -R "$GITHUB_REPOSITORY" -n carga-estresse -D "$destino/estresse"; then
  printf '{"execucao":%s,"commit":"%s"}\n' "$execucao" "$commit" > "$destino/execucao.json"
  echo "Carga: execução $execucao (commit ${commit:0:7})"
else
  rm -rf "${destino:?}"/*
  cp -r evidencias/load/. "$destino/"
  echo '{"origem":"evidencias/load"}' > "$destino/execucao.json"
  echo "::warning::Sem execução de Carga aprovada disponível: usando o resultado versionado em evidencias/load."
fi
