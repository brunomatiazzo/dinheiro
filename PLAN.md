# PLAN.md — Rastreador de Celular em Tempo Real

Fluxo do rastreador:

1. **Monitoramento** — Envia telemetria e exibe `Status` em tempo real.
2. **Mapeamento** — Armazena `localizacao`, `ocorrencia`, `testemunha`.
3. **Ações** — Define ação: `Nenhuma`, `Notificar`, `Bloquear`.
4. **Relatório** — Gera PDF do rastreador.

Etapas para o dashboard web (sugestão futura):

- Backend: API REST / WebSocket com telemetria e geofence.
- Frontend: dashboard com mapa e teleparte.
- Relatório: exportar PDF via `pdf_create.py` / `pdf_fill_form.py`.

## Encerramento do relatório

- PDF estático: `python pdf_create.py spec.json -o rastreador.pdf`
- Formulário preenchável: `python pdf_make_form.py formspec.json -o rastreador_form.pdf`
- Preenchimento: `python pdf_fill_form.py rastreador_form.pdf --fields-json values.json -o rastreador_filled.pdf --flatten`
- Renderização: `python pdf_page_image.py rastreador_filled.pdf --pages 1 --dpi 100 --out-dir imgs/`
- Self-test: `python pdf_read.py rastreador_filled.pdf --text`
