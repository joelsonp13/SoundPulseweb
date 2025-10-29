"""
Script de teste rápido para verificar se a API está funcionando
Execute: python test_api.py
"""

import requests
import json
import time
import sys
import io

# Forçar UTF-8 no Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:5000"

# Lista para armazenar tempos de resposta
response_times = []

def measure_time(func):
    """Decorator para medir tempo de execução"""
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = (time.time() - start) * 1000  # Converter para ms
        response_times.append({
            'test': func.__name__,
            'time': elapsed
        })
        print(f"⏱️  Tempo: {elapsed:.0f}ms\n")
        return result
    return wrapper

@measure_time
def test_health():
    print("🔍 Testando /health...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

@measure_time
def test_search():
    print("🔍 Testando /api/search...")
    response = requests.get(f"{BASE_URL}/api/search", params={
        'q': 'oasis wonderwall',
        'filter': 'songs',
        'limit': 3
    })
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Found {data['count']} results")
    if data['results']:
        print(f"First result: {data['results'][0].get('title', 'N/A')}")

@measure_time
def test_charts():
    print("🔍 Testando /api/charts...")
    response = requests.get(f"{BASE_URL}/api/charts?country=BR")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Charts obtidos!")
    else:
        print(f"❌ Erro: {response.json()}")

@measure_time
def test_suggestions():
    print("🔍 Testando /api/search/suggestions...")
    response = requests.get(f"{BASE_URL}/api/search/suggestions?q=oasis")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Sugestões: {len(data.get('suggestions', []))}")
        if data.get('suggestions'):
            print(f"   Primeira: {data['suggestions'][0]}")
    else:
        print(f"❌ Erro: {response.json()}")

@measure_time
def test_related():
    print("🔍 Testando /api/song/<id>/related...")
    # Primeiro buscar uma música
    search_response = requests.get(f"{BASE_URL}/api/search?q=wonderwall&limit=1")
    if search_response.status_code == 200:
        results = search_response.json()['results']
        if results:
            video_id = results[0]['videoId']
            print(f"Buscando relacionadas de: {video_id}")
            
            related_response = requests.get(f"{BASE_URL}/api/song/{video_id}/related")
            print(f"Status: {related_response.status_code}")
            if related_response.status_code == 200:
                data = related_response.json()
                print(f"✅ {data.get('count', 0)} músicas relacionadas obtidas!")
            else:
                print(f"❌ Erro: {related_response.json()}")

@measure_time
def test_watch():
    print("🔍 Testando /api/watch/<id> (rádio)...")
    # Buscar uma música primeiro
    search_response = requests.get(f"{BASE_URL}/api/search?q=wonderwall&limit=1")
    if search_response.status_code == 200:
        results = search_response.json()['results']
        if results:
            video_id = results[0]['videoId']
            print(f"Gerando rádio para: {video_id}")
            
            watch_response = requests.get(f"{BASE_URL}/api/watch/{video_id}?limit=10")
            print(f"Status: {watch_response.status_code}")
            if watch_response.status_code == 200:
                data = watch_response.json()
                print(f"✅ Playlist de rádio com {len(data.get('tracks', []))} músicas!")
            else:
                print(f"❌ Erro: {watch_response.json()}")

@measure_time
def test_moods():
    print("🔍 Testando /api/moods...")
    response = requests.get(f"{BASE_URL}/api/moods")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Categorias de humor obtidas!")
    else:
        print(f"❌ Erro: {response.json()}")

if __name__ == '__main__':
    print("=" * 60)
    print("🎵 TESTANDO SOUNDPULSE WEB API - VERSÃO COMPLETA")
    print("=" * 60)
    print()
    
    try:
        # Testes básicos
        test_health()
        test_search()
        
        # Testes novos endpoints
        test_suggestions()
        test_related()
        test_watch()
        
        # Testes de metadados
        test_charts()
        test_moods()
        
        print("=" * 60)
        print("✅ TODOS OS TESTES CONCLUÍDOS!")
        print("=" * 60)
        
        # Mostrar estatísticas de tempo
        if response_times:
            print("\n📊 ESTATÍSTICAS DE VELOCIDADE:")
            print("-" * 60)
            
            times = [t['time'] for t in response_times]
            total_time = sum(times)
            avg_time = total_time / len(times)
            min_time = min(times)
            max_time = max(times)
            
            print(f"Total de testes: {len(response_times)}")
            print(f"Tempo total: {total_time:.0f}ms ({total_time/1000:.2f}s)")
            print(f"Tempo médio: {avg_time:.0f}ms")
            print(f"Mais rápido: {min_time:.0f}ms")
            print(f"Mais lento: {max_time:.0f}ms")
            
            print("\n🏆 RANKING DE VELOCIDADE (mais rápido → mais lento):")
            sorted_times = sorted(response_times, key=lambda x: x['time'])
            for i, test in enumerate(sorted_times, 1):
                emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
                test_name = test['test'].replace('test_', '').upper()
                print(f"{emoji} {i}. {test_name:<20} {test['time']:>6.0f}ms")
        
        print("\n" + "=" * 60)
        print("💡 Dica: Acesse http://localhost:5000 para ver todos os endpoints")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERRO: Não foi possível conectar à API")
        print("\n📝 Certifique-se de que o servidor está rodando:")
        print("   python run_dev.py")
        print("   OU")
        print("   python app.py")
    except Exception as e:
        print(f"\n❌ ERRO INESPERADO: {str(e)}")
        import traceback
        traceback.print_exc()

