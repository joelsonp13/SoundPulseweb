#!/usr/bin/env python3
"""
Script para testar o backend e diagnosticar problema de IDs de artista
"""

import requests
import json
import time

# Configuração
BACKEND_URL = "http://localhost:5000"

def test_artist_endpoint(artist_id, expected_name=None):
    """Testar endpoint de artista específico"""
    print(f"\n🔍 Testando artista: {artist_id}")
    print(f"   URL: {BACKEND_URL}/api/artist/{artist_id}")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/artist/{artist_id}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📝 Nome: {data.get('name', 'N/A')}")
            print(f"   🆔 browseId: {data.get('browseId', 'N/A')}")
            print(f"   🆔 channelId: {data.get('channelId', 'N/A')}")
            print(f"   🆔 id: {data.get('id', 'N/A')}")
            print(f"   🔍 _inconsistentId: {data.get('_inconsistentId', False)}")
            print(f"   🔍 _requestedId: {data.get('_requestedId', 'N/A')}")
            print(f"   🔍 _returnedId: {data.get('_returnedId', 'N/A')}")
            
            if expected_name and data.get('name') != expected_name:
                print(f"   ⚠️  INCONSISTÊNCIA: Esperado '{expected_name}', recebido '{data.get('name')}'")
            
            # Verificar inconsistência de ID
            returned_id = data.get('browseId') or data.get('id') or data.get('channelId')
            if returned_id and returned_id != artist_id:
                print(f"   ⚠️  INCONSISTÊNCIA DE ID: Solicitado {artist_id}, retornado {returned_id}")
            
            return data
        else:
            print(f"   ❌ Erro: {response.status_code}")
            print(f"   📝 Resposta: {response.text}")
            return None
            
    except Exception as e:
        print(f"   ❌ Exceção: {e}")
        return None

def clear_cache():
    """Limpar cache do backend"""
    print("\n🗑️ Limpando cache do backend...")
    try:
        response = requests.post(f"{BACKEND_URL}/api/clear-cache")
        if response.status_code == 200:
            print("   ✅ Cache limpo com sucesso")
        else:
            print(f"   ⚠️  Erro ao limpar cache: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Erro ao limpar cache: {e}")

def main():
    print("🎵 SoundPulse Backend - Teste de Diagnóstico")
    print("=" * 50)
    
    # Verificar se backend está online
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            print("✅ Backend está online")
        else:
            print("❌ Backend não está respondendo corretamente")
            return
    except Exception as e:
        print(f"❌ Não foi possível conectar ao backend: {e}")
        return
    
    # Testar diferentes artistas
    test_cases = [
        ("UC9tE0DCnWW7N-yiqVmnoyfA", "MC Kevin"),
        ("UCxTfAlxexS9LTVpgfWfGnkA", "Mainstreet"),
        ("UCVRLEQf_wH8zFb4qCfXqDXw", "Outro artista"),
        ("UCsyd_nnNNDxlOs9TYrDvCoQ", "MC Poze do Rodo")
    ]
    
    print("\n🧪 TESTE 1: Buscar artistas sem limpar cache")
    for artist_id, expected_name in test_cases:
        test_artist_endpoint(artist_id, expected_name)
        time.sleep(1)  # Pausa entre requisições
    
    # Limpar cache
    clear_cache()
    
    print("\n🧪 TESTE 2: Buscar artistas após limpar cache")
    for artist_id, expected_name in test_cases:
        test_artist_endpoint(artist_id, expected_name)
        time.sleep(1)  # Pausa entre requisições
    
    print("\n🎯 DIAGNÓSTICO CONCLUÍDO")
    print("=" * 50)

if __name__ == "__main__":
    main()
