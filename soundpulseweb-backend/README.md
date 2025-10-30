# 🎵 SoundPulse Web - Backend API

Backend local para o SoundPulse Web, fornecendo integração com YouTube Music via **ytmusicapi**.

> **📺 Player:** O frontend usa **YouTube IFrame API** para reproduzir as músicas (mais rápido e confiável!)

## 🚀 Stack

- **Flask** 3.0.0 - Web framework
- **ytmusicapi** 1.8.0+ - YouTube Music API (metadados públicos)
- **flask-cors** 4.0.0 - CORS support
- **Python** 3.10+ - Linguagem

## ✨ Features

✅ **14 Endpoints completos**
- Busca de músicas, artistas, álbuns, playlists
- Sugestões de busca (autocomplete)
- Metadados completos de músicas (retorna videoId)
- Letras sincronizadas
- Músicas relacionadas
- Álbuns de artistas
- Rádio automático (watch playlist)
- Top charts globais e por país
- Recomendações (home)
- Categorias de humor/gênero
- Playlists por humor

✅ **Otimizações**
- Cache inteligente (timed_cache)
- Error handling robusto
- CORS configurado
- Hot-reload em desenvolvimento
- Mensagens de erro amigáveis

## 🛠️ Setup Rápido

### 1. Verificar Python

```bash
python --version
# Precisa ser 3.10 ou superior
```

Se não tiver, baixe em: https://www.python.org/downloads/

### 2. Criar ambiente virtual

```bash
# Windows (PowerShell)
cd soundpulseweb-backend
python -m venv venv
venv\Scripts\activate

# Linux/Mac
cd soundpulseweb-backend
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

Aguarde ~2 minutos para instalar tudo.

### 4. Rodar servidor

**Opção 1: Script de desenvolvimento (Recomendado)**

```bash
python run_dev.py
```

**Opção 2: Direto**

```bash
python app.py
```

**Servidor rodando em:** `http://localhost:5000` 🎉

## 📡 Testando a API

### No browser:

```
http://localhost:5000/              # Documentação
http://localhost:5000/health        # Status
http://localhost:5000/api/search?q=oasis  # Buscar
```

### Com test_api.py:

```bash
# Em outro terminal (com venv ativado)
python test_api.py
```

### Com curl:

```bash
# Buscar
curl "http://localhost:5000/api/search?q=wonderwall&limit=3"

# Song details (retorna videoId para usar no YouTube IFrame Player)
curl "http://localhost:5000/api/song/VIDEO_ID"
```

## 📚 Endpoints Disponíveis

### 🔍 **Search**

```
GET /api/search?q=query&filter=songs&limit=20
```
Filtros: `songs`, `artists`, `albums`, `playlists`

```
GET /api/search/suggestions?q=query
```
Autocomplete para busca

### 🎵 **Song (Música)**

```
GET /api/song/<video_id>
```
Metadados completos (título, artista, álbum, etc.)

```
GET /api/song/<video_id>/related
```
Músicas relacionadas/similares

```
GET /api/lyrics/<browse_id>
```
Letras (sincronizadas se disponível)

> **📺 Para tocar músicas:** Use o `videoId` retornado com YouTube IFrame API no frontend

### 👤 **Artist (Artista)**

```
GET /api/artist/<browse_id>
```
Perfil completo (bio, top tracks, álbuns)

```
GET /api/artist/<browse_id>/albums?params=...&limit=50
```
Álbuns de um artista

### 💿 **Album**

```
GET /api/album/<browse_id>
```
Detalhes completos (capa, tracklist, ano)

### 📝 **Playlist**

```
GET /api/playlist/<browse_id>?limit=100
```
Detalhes e faixas

### 📻 **Radio (Watch)**

```
GET /api/watch/<video_id>?limit=25
```
Playlist de próximas músicas (rádio automático)

### 📊 **Charts**

```
GET /api/charts?country=BR
```
Top músicas. Países: `BR`, `US`, `GB`, `ZZ` (global)

### 🏠 **Home**

```
GET /api/home?limit=20
```
Recomendações e novos lançamentos

### 🎭 **Moods & Genres**

```
GET /api/moods
```
Categorias de humor/gênero

```
GET /api/moods/<params>
```
Playlists de um humor específico

## 🔧 Configuração (Opcional)

Criar arquivo `.env` (copiar de `env.example`):

```env
DEBUG=True
PORT=5000
CACHE_DURATION=3600
```

## 🐛 Troubleshooting

### Erro: "Module not found"

**Solução:**
```bash
# Certifique-se de ativar o venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstalar dependências
pip install -r requirements.txt
```

### Erro: "ytmusicapi não inicializado"

**Solução:**
```bash
# Atualizar ytmusicapi
pip install -U ytmusicapi
```

### Erro: CORS

**Causa:** Frontend em outra porta/domínio

**Solução:** Atualizar `origins` em `app.py` linha 32

### Porta 5000 ocupada

**Solução:**
```bash
# Mudar porta
set PORT=5001  # Windows
export PORT=5001  # Linux/Mac

python run_dev.py
```

## 📂 Estrutura do Projeto

```
soundpulseweb-backend/
├── app.py              # API principal (15 endpoints)
├── run_dev.py          # Script de desenvolvimento
├── test_api.py         # Testes automáticos
├── requirements.txt    # Dependências Python
├── env.example         # Exemplo de .env
├── .gitignore          # Git ignore
├── Procfile            # Para produção
├── railway.toml        # Para produção
└── README.md           # Este arquivo
```

## 💡 Dicas de Desenvolvimento

### Ativar/Desativar venv

```bash
# Ativar
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Desativar
deactivate
```

### Ver logs em tempo real

```bash
# Servidor mostra logs automaticamente
# Para mais detalhes, use DEBUG=True
```

### Testar novo endpoint

```bash
# No browser
http://localhost:5000/api/SEU_ENDPOINT

# Com curl
curl http://localhost:5000/api/SEU_ENDPOINT

# Com Python
import requests
r = requests.get('http://localhost:5000/api/SEU_ENDPOINT')
print(r.json())
```

### Atualizar dependências

```bash
pip install -U ytmusicapi yt-dlp flask
pip freeze > requirements.txt
```

## ⚠️ Limitações

### 1. **URLs de Stream Expiram**
- URLs expiram em 1-6 horas
- Backend tem cache de 1h
- Frontend deve re-extrair após expiração

### 2. **Rate Limiting**
- YouTube pode detectar uso excessivo
- Use cache agressivamente
- Evite requests desnecessários

### 3. **yt-dlp Pode Quebrar**
- YouTube muda API regularmente
- Mantenha yt-dlp atualizado: `pip install -U yt-dlp`

### 4. **Sem Autenticação**
- ytmusicapi está em modo público
- Não acessa biblioteca pessoal do YT Music
- Para biblioteca pessoal, use localStorage no frontend

## 🎯 Próximos Passos

1. ✅ **Backend funcionando localmente**
2. 🔌 **Integrar com frontend** (atualizar `js/utils/api.js`)
3. 💾 **Implementar biblioteca local** (localStorage)
4. 🚀 **Deploy (opcional)**: Railway, Render, Fly.io

## 📝 Notas

- **ytmusicapi** é não-oficial (web scraping)
- Uso responsável: não exceda rate limits
- Para produção: adicionar rate limiting no backend
- Cache ajuda a reduzir requests

## 📄 Licença

MIT License - Livre para uso pessoal e comercial

## 🤝 Recursos

- **ytmusicapi docs**: https://ytmusicapi.readthedocs.io
- **yt-dlp docs**: https://github.com/yt-dlp/yt-dlp
- **Flask docs**: https://flask.palletsprojects.com

---

**Desenvolvido para SoundPulse Web** 🎵

**Status:** ✅ Pronto para desenvolvimento local
