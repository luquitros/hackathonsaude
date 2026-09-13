import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_sample_data():
    num_rows = 500
    
    municipios = [
        ("São Luís", "MA"), ("Imperatriz", "MA"),
        ("Belém", "PA"), ("Santarém", "PA"),
        ("Cuiabá", "MT"), ("Rondonópolis", "MT"),
        ("Palmas", "TO"), ("Araguaína", "TO"),
        ("Salvador", "BA"), ("Feira de Santana", "BA"),
        ("Teresina", "PI"), ("Parnaíba", "PI"),
        ("Recife", "PE"), ("Cabo de Santo Agostinho", "PE"),
        ("Goiânia", "GO"), ("Anápolis", "GO")
    ]
    
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2024, 12, 31)
    
    faixas = ['0-14', '15-29', '30-44', '45-59', '60+']
    sexos = ['M', 'F']
    classificacoes = ['MB', 'PB']
    
    data = []
    
    for _ in range(num_rows):
        mun_uf = random.choice(municipios)
        
        # Random date
        days_between = (end_date - start_date).days
        random_number_of_days = random.randrange(days_between)
        date = start_date + timedelta(days=random_number_of_days)
        
        row = {
            'município': mun_uf[0],
            'estado': mun_uf[1],
            'data_notificação': date.strftime('%Y-%m-%d'),
            'faixa_etária': random.choice(faixas) if random.random() > 0.1 else None, # 10% missing
            'sexo': random.choices(sexos, weights=[0.55, 0.45])[0] if random.random() > 0.1 else None,
            'classificação_operacional': random.choices(classificacoes, weights=[0.6, 0.4])[0],
            'casos_novos': random.choices(range(1, 16), weights=[15, 10, 8, 5, 5, 3, 3, 2, 2, 1, 1, 1, 1, 1, 1])[0],
            'casos_acompanhamento': random.randint(0, 5),
            'grau_incapacidade': random.choices([0, 1, 2], weights=[0.6, 0.3, 0.1])[0] if random.random() > 0.2 else None
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    df.to_excel("sample_data.xlsx", index=False)
    print("sample_data.xlsx gerado com sucesso!")

if __name__ == "__main__":
    generate_sample_data()
