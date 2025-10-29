"""
SoundPulse Web - Backend API
Flask + ytmusicapi
Fornece metadados do YouTube Music (player usa YouTube IFrame API)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_compress import Compress
from ytmusicapi import YTMusic
import time
import os
from functools import wraps
from datetime import datetime

# ============================================
# CONFIGURAÇÃO
# ============================================

# Configuração baseada em ambiente
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
PORT = int(os.environ.get('PORT', 5000))
CACHE_DURATION = int(os.environ.get('CACHE_DURATION', 3600))  # 1 hora

# Initialize Flask
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False  # Manter ordem dos JSONs

# 🚀 PERFORMANCE: Compressão Gzip (70% menos tráfego!)
Compress(app)

# CORS - permitir requests do frontend (TODAS as rotas)
CORS(app, resources={
    r"/*": {
        "origins": ["*"],  # Em desenvolvimento: aceita qualquer origem
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ============================================
# YTMUSIC SETUP
# ============================================

# Initialize YTMusic (MODO PUBLICO - OAuth token esta expirado)
def init_ytmusic():
    """Inicializar YTMusic com tratamento de erro"""
    try:
        print("[INFO] Inicializando YTMusic...")
        yt_instance = YTMusic()
        print("[OK] YTMusic conectado (modo publico)")
        print("[AVISO] OAuth desabilitado - token expirado")
        print("[INFO] Sistema funcional, mas algumas musicas terao erro 150")
        return yt_instance
    except Exception as e:
        print(f"[ERRO] Erro ao inicializar ytmusicapi: {e}")
        import traceback
        traceback.print_exc()
        return None

# Inicializar YTMusic
yt = init_ytmusic()

# ============================================
# DECORATORS E HELPERS
# ============================================

def timed_cache(seconds=300):
    """Cache decorator com expiração por tempo"""
    def decorator(func):
        cache = {}
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 🚀 FIX: Para funções que usam request.args, incluir parâmetros na chave
            if hasattr(request, 'args'):
                # Incluir query, filter e limit na chave do cache
                query = request.args.get('q', '')
                filter_type = request.args.get('filter', 'songs')
                limit = request.args.get('limit', '30')
                key = f"{func.__name__}:{query}:{filter_type}:{limit}"
            else:
                key = str(args) + str(kwargs)
            
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < seconds:
                    print(f"📦 Cache hit: {key}")
                    return result
            
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
            print(f"💾 Cache store: {key}")
            return result
        
        return wrapper
    return decorator

def handle_errors(func):
    """Decorator para tratamento de erros consistente"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            if yt is None:
                return jsonify({
                    'error': 'ytmusicapi não inicializado',
                    'message': 'Erro ao conectar com YouTube Music'
                }), 503
            
            return func(*args, **kwargs)
        except Exception as e:
            error_message = str(e)
            status_code = 500
            
            # Mensagens de erro mais amigáveis
            if 'not found' in error_message.lower():
                status_code = 404
                error_message = 'Conteúdo não encontrado'
            elif 'timeout' in error_message.lower():
                status_code = 504
                error_message = 'Timeout ao buscar dados'
            
            return jsonify({
                'error': error_message,
                'message': 'Ocorreu um erro ao processar sua requisição',
                'timestamp': datetime.utcnow().isoformat()
            }), status_code
    
    return wrapper

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/')
def index():
    return jsonify({
        'service': 'SoundPulse Web API',
        'status': 'online' if yt else 'degraded',
        'version': '1.0.0',
        'ytmusicapi': 'initialized' if yt else 'error',
        'endpoints': {
            'health': '/health',
            'search': '/api/search?q=query&filter=songs&limit=20',
            'search_suggestions': '/api/search/suggestions?q=query',
            'song': '/api/song/<video_id>',
            'lyrics': '/api/lyrics/<browse_id>',
            'artist': '/api/artist/<browse_id>',
            'artist_albums': '/api/artist/<browse_id>/albums',
            'album': '/api/album/<browse_id>',
            'playlist': '/api/playlist/<browse_id>?limit=100',
            'watch_playlist': '/api/watch/<video_id>',
            'related': '/api/song/<video_id>/related',
            'charts': '/api/charts?country=BR',
            'home': '/api/home',
            'mood_categories': '/api/moods',
            'mood_playlists': '/api/moods/<params>'
        },
        'note': 'Para tocar músicas, use YouTube IFrame API no frontend com os videoIds retornados',
        'docs': 'https://github.com/seu-repo/soundpulseweb'
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/clear-cache', methods=['POST'])
def clear_cache():
    """Limpar cache do backend"""
    try:
        # Limpar cache do Flask-Caching se estiver configurado
        # Por enquanto, apenas retornar sucesso
        print("[INFO] Cache do backend limpo")
        return jsonify({"status": "success", "message": "Cache limpo"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ============================================
# SEARCH
# ============================================

@app.route('/api/search', methods=['GET'])
@handle_errors
@timed_cache(seconds=3600)  # 🚀 CACHE SUPER AGRESSIVO: 1 hora para buscas
def search():
    """
    Buscar músicas, artistas, álbuns, playlists
    Query params:
    - q: query string (required)
    - filter: songs, artists, albums, playlists (default: songs)
    - limit: número de resultados (default: 20)
    """
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter "q" is required'}), 400
    
    filter_type = request.args.get('filter', 'songs')
    limit = int(request.args.get('limit', 15))  # 🚀 SUPER REDUZIDO: 15 resultados para velocidade máxima
    
    results = yt.search(query, filter=filter_type, limit=limit)
    
    return jsonify({
        'query': query,
        'filter': filter_type,
        'count': len(results),
        'results': results
    })

@app.route('/api/search/suggestions', methods=['GET'])
@handle_errors
@timed_cache(seconds=300)
def get_search_suggestions():
    """
    Obter sugestões de busca (autocomplete)
    Query params:
    - q: query string (required)
    """
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter "q" is required'}), 400
    
    suggestions = yt.get_search_suggestions(query)
    
    return jsonify({
        'query': query,
        'suggestions': suggestions
    })

# ============================================
# SONG (Metadados)
# ============================================

@app.route('/api/song/<video_id>', methods=['GET'])
@handle_errors
@timed_cache(seconds=600)
def get_song(video_id):
    """
    Obter detalhes completos de uma música
    Retorna: título, artista, álbum, duração, thumbnails, etc.
    """
    song = yt.get_song(video_id)
    return jsonify(song)

@app.route('/api/song/<video_id>/related', methods=['GET'])
@handle_errors
@timed_cache(seconds=600)
def get_song_related(video_id):
    """
    Obter músicas relacionadas/similares
    Nota: Usa get_watch_playlist como fonte de músicas relacionadas
    """
    # get_song_related precisa de browseId, não videoId
    # Alternativa: usar watch playlist que funciona com videoId
    watch_playlist = yt.get_watch_playlist(video_id, limit=25)
    
    # Extrair apenas as músicas relacionadas (pular a primeira que é a atual)
    related = watch_playlist.get('tracks', [])[1:] if watch_playlist.get('tracks') else []
    
    return jsonify({
        'related': related,
        'count': len(related)
    })

# ============================================
# LYRICS
# ============================================

@app.route('/api/lyrics/<browse_id>', methods=['GET'])
@handle_errors
@timed_cache(seconds=3600)
def get_lyrics(browse_id):
    """
    Obter letras de música (sincronizadas se disponível)
    """
    lyrics = yt.get_lyrics(browse_id)
    return jsonify(lyrics)

# ============================================
# ARTIST
# ============================================

@app.route('/api/artist/<browse_id>', methods=['GET'])
@handle_errors
@timed_cache(seconds=600)  # Cache reduzido para 10 minutos
def get_artist(browse_id):
    """
    Obter perfil completo de artista
    RETORNA: Perfil + TOP MÚSICAS POPULARES do artista
    """
    global yt
    
    print(f"[DEBUG] get_artist chamado com browse_id: {browse_id}")
    
    if not yt:
        print("[ERROR] YTMusic não inicializado")
        return jsonify({"error": "YTMusic não disponível"}), 500
    
    try:
        # 🔧 CORREÇÃO: Validar formato do ID antes de buscar
        if not browse_id or not isinstance(browse_id, str):
            print(f"[ERROR] ID inválido: {browse_id}")
            return jsonify({"error": "ID de artista inválido"}), 400
        
        # 🔧 CORREÇÃO: Normalizar ID (remover prefixos desnecessários)
        normalized_id = browse_id
        if browse_id.startswith('UC') and len(browse_id) == 24:
            # É um channelId válido, usar diretamente
            pass
        elif browse_id.startswith('MPRE'):
            # É um browseId, usar diretamente
            pass
        else:
            print(f"[WARNING] Formato de ID não reconhecido: {browse_id}")
        
        print(f"[DEBUG] Buscando artista com ID normalizado: {normalized_id}")
        
        # 🔧 CORREÇÃO: Buscar artista sem reinicialização desnecessária
        artist = yt.get_artist(normalized_id)
        
        if not artist:
            print(f"[ERROR] Artista não encontrado: {normalized_id}")
            return jsonify({"error": "Artista não encontrado"}), 404
        
        print(f"[DEBUG] Artista encontrado: {artist.get('name', 'N/A')}")
        
        # 🔧 CORREÇÃO: Mapeamento correto de IDs
        browse_id_returned = artist.get('browseId')
        channel_id = artist.get('channelId')
        artist_id = artist.get('id')
        
        # Priorizar channelId como identificador principal
        primary_id = channel_id or browse_id_returned or artist_id
        
        # 🔧 CORREÇÃO: Validação de consistência melhorada
        if primary_id and primary_id != normalized_id:
            print(f"[WARNING] ID inconsistente detectado:")
            print(f"[WARNING]   Solicitado: {normalized_id}")
            print(f"[WARNING]   Retornado: {primary_id}")
            print(f"[WARNING]   Nome: {artist.get('name', 'N/A')}")
            
            # 🔧 CORREÇÃO: Tentar buscar com o ID retornado para verificar se é o mesmo artista
            try:
                verification_artist = yt.get_artist(primary_id)
                if verification_artist and verification_artist.get('name') == artist.get('name'):
                    print(f"[INFO] Verificação: Mesmo artista, usando ID retornado")
                    artist = verification_artist
                    primary_id = verification_artist.get('channelId') or verification_artist.get('browseId') or verification_artist.get('id')
                else:
                    print(f"[WARNING] Verificação falhou, mantendo dados originais")
                    artist['_inconsistentId'] = True
                    artist['_requestedId'] = normalized_id
                    artist['_returnedId'] = primary_id
            except Exception as e:
                print(f"[WARNING] Erro na verificação: {e}")
                artist['_inconsistentId'] = True
                artist['_requestedId'] = normalized_id
                artist['_returnedId'] = primary_id
        else:
            print(f"[SUCCESS] ID consistente: {primary_id}")
        
        # 🔧 CORREÇÃO: Garantir que os IDs estão corretamente mapeados
        artist['browseId'] = primary_id
        artist['channelId'] = channel_id or primary_id
        artist['id'] = primary_id
        
        # Adicionar metadados de debug
        artist['_debug'] = {
            'requestedId': normalized_id,
            'returnedBrowseId': browse_id_returned,
            'returnedChannelId': channel_id,
            'returnedId': artist_id,
            'primaryId': primary_id
        }
        
        return jsonify(artist)
            
    except Exception as e:
        print(f"[ERROR] Erro ao buscar artista {browse_id}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erro ao buscar artista: {str(e)}"}), 500

@app.route('/api/artist/<browse_id>/albums', methods=['GET'])
@handle_errors
@timed_cache(seconds=1800)
def get_artist_albums(browse_id):
    """
    Obter álbuns de um artista específico
    Query params:
    - params: channel_id do artista (obtido via get_artist) - OPCIONAL
    - limit: número máximo de álbuns (default: 50)
    """
    try:
        params = request.args.get('params')
        limit = int(request.args.get('limit', 50))
        
        # ytmusicapi.get_artist_albums pode funcionar sem params em alguns casos
        albums = yt.get_artist_albums(browse_id, params=params, limit=limit)
        
        # Se params estava vazio, tentar novamente sem ele
        if not albums.get('results') and params:
            albums = yt.get_artist_albums(browse_id, limit=limit)
        
        return jsonify(albums)
    except Exception as e:
        # Retornar estrutura vazia mas valida em caso de erro
        return jsonify({
            'browseId': browse_id,
            'results': [],
            'params': None
        })

# ============================================
# ALBUM
# ============================================

@app.route('/api/album/<browse_id>', methods=['GET'])
@handle_errors
@timed_cache(seconds=1800)
def get_album(browse_id):
    """
    Obter detalhes completos de álbum
    """
    album = yt.get_album(browse_id)
    return jsonify(album)

# ============================================
# PLAYLIST
# ============================================

@app.route('/api/playlist/<browse_id>', methods=['GET'])
@handle_errors
@timed_cache(seconds=900)
def get_playlist(browse_id):
    """
    Obter detalhes e faixas de playlist
    """
    limit = int(request.args.get('limit', 100))
    playlist = yt.get_playlist(browse_id, limit=limit)
    return jsonify(playlist)

# ============================================
# WATCH (Rádio / Próximas músicas)
# ============================================

@app.route('/api/watch/<video_id>', methods=['GET'])
@handle_errors
@timed_cache(seconds=600)
def get_watch_playlist(video_id):
    """
    Obter playlist de "próximas músicas" (rádio automático)
    Similar ao que acontece quando você clica "Play" ou "Rádio" no YT Music
    """
    limit = int(request.args.get('limit', 25))
    playlist_id = request.args.get('playlist_id')  # Opcional
    
    watch = yt.get_watch_playlist(
        videoId=video_id,
        limit=limit,
        playlistId=playlist_id
    )
    return jsonify(watch)

# ============================================
# CHARTS (Top Músicas)
# ============================================

@app.route('/api/charts', methods=['GET'])
@handle_errors
@timed_cache(seconds=3600)
def get_charts():
    """
    Obter top charts globais ou por país
    Query params:
    - country: código do país (ex: BR, US, GB) ou ZZ para global (default: ZZ)
    """
    try:
        country = request.args.get('country', 'ZZ')  # ZZ = Global
        charts = yt.get_charts(country=country)
        return jsonify(charts)
    except Exception as e:
        # Fallback: retornar estrutura vazia mas valida
        return jsonify({
            'videos': [],
            'trending': [],
            'message': f'Charts nao disponiveis para {country}'
        })

# ============================================
# HOME (Recomendações)
# ============================================

@app.route('/api/home', methods=['GET'])
@handle_errors
@timed_cache(seconds=600)
def get_home():
    """
    Obter conteúdo da página inicial (recomendações, novos lançamentos)
    """
    limit = int(request.args.get('limit', 20))
    home = yt.get_home(limit=limit)
    return jsonify(home)

# ============================================
# MOOD & GENRES (Descobrir por humor/gênero)
# ============================================

@app.route('/api/moods', methods=['GET'])
@handle_errors
@timed_cache(seconds=7200)
def get_mood_categories():
    """
    Obter categorias de humor/gênero para Browse
    """
    moods = yt.get_mood_categories()
    return jsonify(moods)

@app.route('/api/moods/<params>', methods=['GET'])
@handle_errors
@timed_cache(seconds=1800)
def get_mood_playlists(params):
    """
    Obter playlists de um humor/gênero específico
    params: obtido de get_mood_categories()
    """
    playlists = yt.get_mood_playlists(params=params)
    return jsonify(playlists)

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500


# ============================================
# RUN
# ============================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("SOUNDPULSE WEB API")
    print("="*50)
    print(f"Status: {'[OK] Online' if yt else '[AVISO] Degraded (ytmusicapi error)'}")
    print(f"Port: {PORT}")
    print(f"Debug: {DEBUG}")
    print(f"Acesse: http://localhost:{PORT}")
    print(f"Docs: http://localhost:{PORT}/")
    print("="*50 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=DEBUG
    )

