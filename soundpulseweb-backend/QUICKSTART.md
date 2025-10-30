# ⚡ Guia Rápido - SoundPulse Web Backend

## 🚀 Começar em 3 minutos

### 1️⃣ Setup (primeira vez)

```bash
# Navegar até pasta
cd soundpulseweb-backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate

# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 2️⃣ Rodar servidor

```bash
python run_dev.py
```

✅ Pronto! API rodando em **http://localhost:5000**

### 3️⃣ Testar

**No browser:**
```
http://localhost:5000/
```

**Com script de teste:**
```bash
python test_api.py
```

---

## 📡 Endpoints Principais

| URL | Descrição |
|-----|-----------|
| `GET /` | Documentação completa |
| `GET /health` | Status da API |
| `GET /api/search?q=oasis` | Buscar músicas |
| `GET /api/song/<id>` | Detalhes da música |
| `GET /api/stream/<id>` | URL de stream |
| `GET /api/charts?country=BR` | Top músicas |
| `GET /api/watch/<id>` | Rádio automático |

---

## 🔧 Comandos Úteis

### Ativar ambiente virtual

```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Desativar

```bash
deactivate
```

### Atualizar dependências

```bash
pip install -U ytmusicapi yt-dlp
```

### Ver porta ocupada?

```bash
# Mudar porta
set PORT=5001  # Windows
export PORT=5001  # Linux/Mac
```

---

## 🐛 Problemas Comuns

### "Module not found"
```bash
# Certifique-se do venv ativo
venv\Scripts\activate
pip install -r requirements.txt
```

### "ytmusicapi erro"
```bash
pip install -U ytmusicapi
```

### "yt-dlp falhou"
```bash
pip install -U yt-dlp
```

---

## 💡 Dicas

- ✅ Sempre ative o `venv` antes de rodar
- ✅ Use `run_dev.py` para desenvolvimento (hot-reload)
- ✅ Use `test_api.py` para testar rapidamente
- ✅ Veja `README.md` para documentação completa

---

**Status:** ✅ Pronto! Bom desenvolvimento! 🎵

