# 📦 Rastreador de Celular em Tempo Real

Repositório do protótipo de rastreador de celular em tempo real — **somente para uso interno e autorizado** (seu próprio dispositivo ou equipamento que você tem permissão para operar). Entrega telemetria, mapeamento de localização, ações e relatório em PDF.

## Fluxo de execução

1. **Instalar dependências** — `source rastreador-venv/bin/activate` (ou `pip install pypdf reportlab pdfplumber pypdfium2`).
2. **Criar o relatório estático** — `python pdf_create.py spec.json -o rastreador.pdf`.
3. **Criar o formulário preenchável** — `python pdf_make_form.py formspec.json -o rastreador_form.pdf`.
4. **Preencher o formulário** — `python pdf_fill_form.py rastreador_form.pdf --fields-json values.json -o rastreador_filled.pdf --flatten`.
5. **Visualizar** — `python pdf_page_image.py rastreador_filled.pdf --pages 1 --dpi 100 --out-dir imgs/`.

## Arquivos principais

| Arquivo | Descrição |
|---|---|
| `spec.json` | Especificação do PDF estático. |
| `formspec.json` | Especificação do formulário preenchável. |
| `values.json` | Valores para preencher os campos do formulário. |
| `pdf_create.py` | Gera PDF estático. |
| `pdf_make_form.py` | Cria formulário preenchável. |
| `pdf_fill_form.py` | Preenche campos do formulário. |
| `pdf_form_layout.py` | Lint de layout + overlay visual. |
| `pdf_read.py` | Extrai texto, campos, metadados. |
| `pdf_page_image.py` | Exporta páginas para PNG. |
| `rastreador.pdf` | Relatório estático gerado. |
| `rastreador_form.pdf` | Formulário preenchável. |
| `rastreador_filled.pdf` | Formulário preenchido (exemplo). |
| `page001.png` | Renderização visual do PDF preenchido. |

## Legalidade

> **Importante** — Rastrear celular de terceiros sem consentimento é ilegal na maioria dos países. Use somente em dispositivos próprios ou sobre os quais você tenha autorização expressa.

## Licença

MIT — uso interno e educacional.
