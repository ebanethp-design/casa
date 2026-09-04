"""Seed data for The Casa - 50 fake property listings in Gabon."""
import random
import uuid
from datetime import datetime, timezone

CITIES = {
    "Libreville": ["Batterie IV", "Glass", "Louis", "Nombakélé", "Akébé", "Sotéga", "Nzeng-Ayong", "Owendo"],
    "Port-Gentil": ["Centre-ville", "Salsa", "Grand Village", "SNI", "Basile Ondimba"],
    "Franceville": ["Centre", "Poto-Poto", "Potos", "Mvengué"],
    "Oyem": ["Centre", "Akoakam", "Elone", "Ngoulmendjim"],
    "Lambaréné": ["Île", "Rive Gauche", "Rive Droite", "Adouma"],
}

HOUSE_IMAGES = [
    "https://images.unsplash.com/photo-1722421492323-eaf9c401befe?w=1200",
    "https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?w=1200",
    "https://images.unsplash.com/photo-1698994705178-d244d73ea573?w=1200",
    "https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?w=1200",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
]

APARTMENT_IMAGES = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200",
    "https://images.unsplash.com/photo-1624204386084-dd8c05e32226?w=1200",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
]

INTERIOR_IMAGES = [
    "https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?w=1200",
    "https://images.pexels.com/photos/7546648/pexels-photo-7546648.jpeg?w=1200",
    "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=1200",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
    "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=1200",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200",
]

TITLES_HOUSE = [
    "Villa moderne avec piscine",
    "Maison familiale spacieuse",
    "Villa de standing avec jardin",
    "Maison contemporaine",
    "Villa de luxe vue mer",
    "Maison de charme rénovée",
    "Villa avec terrasse panoramique",
    "Grande maison de famille",
]

TITLES_APT = [
    "Appartement lumineux au centre-ville",
    "Studio moderne équipé",
    "Appartement F3 avec balcon",
    "Loft contemporain",
    "Appartement F4 haut standing",
    "Duplex avec vue dégagée",
    "Appartement F2 rénové",
    "Penthouse avec terrasse",
]

DESCRIPTIONS = [
    "Superbe bien situé dans un quartier calme et résidentiel. Proche des commerces, écoles et transports. Idéal pour famille ou investisseur.",
    "Magnifique propriété alliant confort et modernité. Espaces généreux baignés de lumière naturelle, finitions haut de gamme.",
    "Bien d'exception offrant un cadre de vie privilégié. Belles prestations, matériaux nobles, environnement verdoyant.",
    "Opportunité rare sur ce quartier prisé. Bien entretenu, prêt à emménager, aucun travaux à prévoir.",
    "Cadre agréable et sécurisé, proche de toutes commodités. Beau volume, agencement optimisé, très fonctionnel.",
]

FEATURES_POOL = [
    "Climatisation", "Piscine", "Jardin", "Garage", "Sécurité 24/7",
    "Cuisine équipée", "Terrasse", "Balcon", "Groupe électrogène",
    "Forage/Château d'eau", "Meublé", "Fibre optique", "Vue mer",
    "Domotique", "Dressing", "Salle de sport"
]


def generate_properties(count: int = 50):
    """Generate a list of fake property dicts."""
    props = []
    for i in range(count):
        is_house = random.random() < 0.55
        prop_type = "Maison" if is_house else "Appartement"
        transaction = random.choice(["location", "vente"])
        city = random.choice(list(CITIES.keys()))
        neighborhood = random.choice(CITIES[city])

        bedrooms = random.randint(1, 6) if is_house else random.randint(1, 4)
        bathrooms = random.randint(1, max(2, bedrooms - 1)) if bedrooms > 1 else 1
        area = random.randint(45, 90) if not is_house else random.randint(120, 450)

        if transaction == "location":
            base = 150000 if not is_house else 400000
            price = base + random.randint(0, 20) * 50000
        else:
            base = 25000000 if not is_house else 60000000
            price = base + random.randint(0, 40) * 5000000

        img_pool = HOUSE_IMAGES if is_house else APARTMENT_IMAGES
        cover = random.choice(img_pool)
        gallery = random.sample(img_pool + INTERIOR_IMAGES, k=min(5, len(img_pool + INTERIOR_IMAGES)))
        if cover not in gallery:
            gallery = [cover] + gallery[:4]
        else:
            gallery = [cover] + [g for g in gallery if g != cover][:4]

        title = random.choice(TITLES_HOUSE if is_house else TITLES_APT)
        features = random.sample(FEATURES_POOL, k=random.randint(4, 8))

        props.append({
            "id": str(uuid.uuid4()),
            "title": f"{title} — {neighborhood}",
            "description": random.choice(DESCRIPTIONS),
            "property_type": prop_type,
            "transaction_type": transaction,
            "city": city,
            "neighborhood": neighborhood,
            "price": price,
            "currency": "XAF",
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "area_m2": area,
            "features": features,
            "images": gallery,
            "hidden": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return props
