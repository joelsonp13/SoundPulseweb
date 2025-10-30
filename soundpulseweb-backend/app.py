"""
SoundPulse Web - Backend API
Flask + ytmusicapi
Fornece metadados do YouTube Music (player usa YouTube IFrame API)
"""

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_compress import Compress
from ytmusicapi import YTMusic
import yt_dlp
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

@app.after_request
def add_cors_headers(response):
    response.headers.setdefault('Access-Control-Allow-Origin', '*')
    response.headers.setdefault('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response

@app.route('/api/<path:any_path>', methods=['OPTIONS'])
def cors_preflight(any_path):
    return ('', 204)

# Initialize YTMusic (unauthenticated - só busca pública)
try:
    yt = YTMusic()
    print("[OK] ytmusicapi inicializado com sucesso!")
except Exception as e:
    print(f"[ERRO] Erro ao inicializar ytmusicapi: {e}")
    yt = None

# ============================================
# DECORATORS E HELPERS
# ============================================

def timed_cache(seconds=300):
    """Cache decorator com expiração por tempo"""
    def decorator(func):
        cache = {}
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < seconds:
                    return result
            
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
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

# ============================================
# SEARCH
# ============================================

@app.route('/api/search', methods=['GET'])
@handle_errors
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
    limit = int(request.args.get('limit', 20))
    
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
@timed_cache(seconds=1800)
def get_artist(browse_id):
    """
    Obter perfil completo de artista
    RETORNA: Perfil + TOP MÚSICAS POPULARES do artista
    """
    artist = yt.get_artist(browse_id)
    
    # Debug: Verificar quantas músicas e se tem info do artista
    songs_count = len(artist.get('songs', {}).get('results', []))
    artist_name = artist.get('name', 'Unknown')
    print(f"\n{'='*60}")
    print(f"[ARTIST] Artista: {artist_name}")
    print(f"[ARTIST] Total de musicas populares: {songs_count}")
    print(f"{'='*60}")
    
    # Debug: Listar TODAS as músicas retornadas
    if songs_count > 0:
        print(f"[MUSICAS POPULARES DE '{artist_name}']:")
        for i, song in enumerate(artist.get('songs', {}).get('results', [])[:10], 1):
            song_title = song.get('title', 'Unknown')
            song_artists = [a.get('name') for a in song.get('artists', [])]
            plays = song.get('views', 'N/A')
            print(f"  {i}. '{song_title}'")
            print(f"     Artistas: {', '.join(song_artists)}")
            print(f"     Views: {plays}")
            print()
        
        if songs_count > 10:
            print(f"  ... e mais {songs_count - 10} musicas")
        
        print(f"{'='*60}\n")
    
    return jsonify(artist)

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
        
        print(f"[ARTIST-ALBUMS] browseId: {browse_id}, params: {params}, limit: {limit}")
        
        # ytmusicapi.get_artist_albums pode funcionar sem params em alguns casos
        albums = yt.get_artist_albums(browse_id, params=params, limit=limit)
        
        print(f"[ARTIST-ALBUMS] Retornando {len(albums.get('results', []))} álbuns")
        
        return jsonify(albums)
    except Exception as e:
        print(f"[ERRO] get_artist_albums falhou: {type(e).__name__}: {str(e)}")
        # Retornar estrutura vazia mas válida em caso de erro
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
        print(f"[CHARTS] Buscando charts para pais: {country}")
        charts = yt.get_charts(country=country)
        print(f"[CHARTS] Charts obtidos com sucesso")
        return jsonify(charts)
    except Exception as e:
        print(f"[ERRO] ERRO ao buscar charts: {type(e).__name__}: {str(e)}")
        # Fallback: retornar estrutura vazia mas válida
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

@app.route('/api/stream/<video_id>', methods=['GET'])
@handle_errors
def stream_audio(video_id):
    """
    FALLBACK para erro 150: Extrai stream direto usando yt-dlp
    APENAS usado quando YouTube IFrame bloqueia embed
    """
    print(f"[STREAM-FALLBACK] Extraindo stream para: {video_id}")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
            
            # Pegar URL de stream de áudio
            audio_url = None
            for format in info.get('formats', []):
                if format.get('acodec') != 'none' and format.get('vcodec') == 'none':
                    audio_url = format.get('url')
                    break
            
            if not audio_url:
                audio_url = info.get('url')
            
            return jsonify({
                'videoId': video_id,
                'streamUrl': audio_url,
                'title': info.get('title'),
                'duration': info.get('duration'),
                'thumbnail': info.get('thumbnail')
            })
    except Exception as e:
        print(f"[ERRO] stream_audio falhou: {type(e).__name__}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============================================
# RUN
# ============================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎵 SoundPulse Web API")
    print("="*50)
    print(f"Status: {'✅ Online' if yt else '⚠️ Degraded (ytmusicapi error)'}")
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

