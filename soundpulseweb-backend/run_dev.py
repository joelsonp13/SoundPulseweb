#!/usr/bin/env python3
"""
Script de desenvolvimento para SoundPulse Web Backend
Inicia o servidor Flask com hot-reload e configurações otimizadas para dev
"""

import os
import sys

# Configurar variáveis de ambiente para desenvolvimento
os.environ['DEBUG'] = 'True'
os.environ['FLASK_ENV'] = 'development'
os.environ['PORT'] = '5000'

# Verificar se as dependências estão instaladas
try:
    import flask
    import flask_cors  # noqa: F401
    import ytmusicapi  # noqa: F401
except ImportError as e:
    print("\n[ERRO] ERRO: Dependencias nao instaladas!")
    print("\nExecute os seguintes comandos:")
    print("  python -m venv venv")
    print("  venv\\Scripts\\activate    (Windows)")
    print("  source venv/bin/activate  (Linux/Mac)")
    print("  pip install -r requirements.txt")
    print(f"\nErro especifico: {e}")
    sys.exit(1)

# Importar e rodar a aplicação
try:
    from app import app, PORT, DEBUG, yt
    
    print("\n" + "="*60)
    print("[INIT] SoundPulse Web - Servidor de Desenvolvimento")
    print("="*60)
    print(f"[OK] Flask: {flask.__version__}")
    print(f"[OK] ytmusicapi: {'Inicializado' if yt else '[ERRO] Erro'}")
    print("\n[SERVER] Servidor:")
    print(f"  URL: http://localhost:{PORT}")
    print(f"  Debug: {DEBUG}")
    print("  Hot-reload: Ativado")
    print("\n[INFO] Endpoints:")
    print(f"  Documentacao: http://localhost:{PORT}/")
    print(f"  Health Check: http://localhost:{PORT}/health")
    print(f"  Buscar: http://localhost:{PORT}/api/search?q=wonderwall")
    print("\n[DICAS] Dicas:")
    print("  - Ctrl+C para parar o servidor")
    print("  - Mudancas no codigo recarregam automaticamente")
    print("  - Use test_api.py para testar os endpoints")
    print("="*60 + "\n")
    
    # Rodar servidor
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=DEBUG,
        use_reloader=True,
        use_debugger=True
    )
    
except KeyboardInterrupt:
    print("\n\n[EXIT] Servidor encerrado pelo usuario")
    sys.exit(0)
except Exception as e:
    print(f"\n[ERRO] ERRO ao iniciar servidor: {e}")
    sys.exit(1)

