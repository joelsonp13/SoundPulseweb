#!/usr/bin/env python3
"""
Teste direto do endpoint de artista
"""

import requests
import json

def test_artist_direct(artist_id):
    """Testar endpoint de artista diretamente"""
    url = f"http://localhost:5000/api/artist/{artist_id}"
    
    try:
        response = requests.get(url)
        print(f"\n🔍 Testando: {artist_id}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Nome: {data.get('name', 'N/A')}")
            print(f"   browseId: {data.get('browseId', 'N/A')}")
            print(f"   channelId: {data.get('channelId', 'N/A')}")
            print(f"   id: {data.get('id', 'N/A')}")
            print(f"   _inconsistentId: {data.get('_inconsistentId', False)}")
            print(f"   _requestedId: {data.get('_requestedId', 'N/A')}")
            print(f"   _returnedId: {data.get('_returnedId', 'N/A')}")
            return data
        else:
            print(f"   Erro: {response.text}")
            return None
            
    except Exception as e:
        print(f"   Exceção: {e}")
        return None

if __name__ == "__main__":
    print("🎵 Teste Direto do Backend")
    print("=" * 40)
    
    # Testar diferentes artistas
    test_cases = [
        "UC9tE0DCnWW7N-yiqVmnoyfA",  # MC Kevin
        "UC3ViMFZxh48yAftZUfp7bfQ",  # Outro artista
        "UCsyd_nnNNDxlOs9TYrDvCoQ"   # MC Poze do Rodo
    ]
    
    for artist_id in test_cases:
        test_artist_direct(artist_id)
