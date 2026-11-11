const products = [
    {
        id: "AC-001",
        category: "Cuidado Personal",
        name: "Acondicionador",
        description: "Hidrata y suaviza el cabello, facilitando el peinado y reduciendo el frizz.",
        price: 4000,
        image: "imagenes_productos/AC-001.jpg"
    },
    {
        id: "SH-002",
        category: "Cuidado Personal",
        name: "Shampoo",
        description: "Limpia profundamente el cabello y el cuero cabelludo, dejando una sensación fresca.",
        price: 3500,
        badge: "🔥 Más Vendido",
        image: "imagenes_productos/SH-002.jpg"
    },
    {
        id: "PD-003",
        category: "Cuidado Personal",
        name: "Pasta dental",
        description: "Protege contra caries y mal aliento, asegurando una limpieza efectiva.",
        price: 2500,
        badge: "⭐ Oferta",
        image: "imagenes_productos/PD-003.jpg"
    },
    {
        id: "JB-004",
        category: "Cuidado Personal",
        name: "Jabón de baño",
        description: "Limpia y nutre la piel, disponible en barra o líquido.",
        price: 3500,
        image: "imagenes_productos/JB-004.jpg"
    },
    {
        id: "CD-005",
        category: "Cuidado Personal",
        name: "Cepillo dental",
        description: "Cerdas suaves que eliminan la placa y cuidan las encías.",
        price: 1000,
        image: "imagenes_productos/CD-005.jpg"
    },
    {
        id: "EB-006",
        category: "Cuidado Personal",
        name: "Enjuague bucal",
        description: "Refresca el aliento y ayuda a eliminar bacterias.",
        price: 1500,
        image: "imagenes_productos/EB-006.jpg"
    },
    {
        id: "DE-007",
        category: "Cuidado Personal",
        name: "Desodorante",
        description: "Controla el sudor y los olores, manteniéndote fresco.",
        price: 4000,
        image: "imagenes_productos/DE-007.jpg"
    },
    {
        id: "EA-008",
        category: "Cuidado Personal",
        name: "Espuma para afeitar",
        description: "Facilita el afeitado, reduciendo irritaciones.",
        price: 3500,
        image: "imagenes_productos/EA-008.jpg"
    },
    {
        id: "AF-009",
        category: "Cuidado Personal",
        name: "Afeitadora",
        description: "Cuchillas afiladas que proporcionan un afeitado preciso.",
        price: 1500,
        image: "imagenes_productos/AF-009.jpg"
    },
    {
        id: "LA-010",
        category: "Productos de Limpieza",
        name: "Lavaloza",
        description: "Eficaz contra la grasa, asegura platos limpios y sin olores.",
        price: 1500,
        badge: "🔥 Más Vendido",
        image: "imagenes_productos/LA-010.jpg"
    },
    {
        id: "DT-011",
        category: "Productos de Limpieza",
        name: "Detergente",
        description: "Elimina manchas y deja la ropa fresca, apto para todo tipo de tejidos.",
        price: 2000,
        badge: "⭐ Oferta",
        image: "imagenes_productos/DT-011.jpg"
    },
    {
        id: "SU-012",
        category: "Productos de Limpieza",
        name: "Suavizante",
        description: "Suaviza la ropa y facilita el planchado, con un aroma agradable.",
        price: 1500,
        image: "imagenes_productos/SU-012.jpg"
    },
    {
        id: "CL-013",
        category: "Productos de Limpieza",
        name: "Cloro",
        description: "Desinfectante potente para superficies del hogar.",
        price: 4000,
        image: "imagenes_productos/CL-013.jpg"
    },
    {
        id: "AR-014",
        category: "Productos de Limpieza",
        name: "Aromatizante",
        description: "Neutraliza olores y proporciona un aroma fresco.",
        price: 1000,
        image: "imagenes_productos/AR-014.jpg"
    },
    {
        id: "TH-015",
        category: "Productos de Limpieza",
        name: "Trapero húmedo",
        description: "Paños prehumedecidos para limpieza rápida de pisos.",
        price: 2000,
        image: "imagenes_productos/TH-015.jpg"
    },
    {
        id: "ES-016",
        category: "Productos de Limpieza",
        name: "Escobillón",
        description: "Ideal para barrer polvo y suciedad de superficies.",
        price: 2000,
        image: "imagenes_productos/ES-016.jpg"
    },
    {
        id: "MO-017",
        category: "Productos de Limpieza",
        name: "Mopa",
        description: "Facilita la limpieza de pisos, alcanzando lugares difíciles.",
        price: 2000,
        image: "imagenes_productos/MO-017.jpg"
    },
    {
        id: "PH-018",
        category: "Artículos de Aseo y Desechables",
        name: "Papel higiénico",
        description: "Suave y resistente, ideal para el uso diario y la higiene personal.",
        price: 4000,
        badge: "🔥 Más Vendido",
        image: "imagenes_productos/PH-018.jpg"
    },
    {
        id: "BB-019",
        category: "Artículos de Aseo y Desechables",
        name: "Bolsas de basura",
        description: "Resistentes y prácticas, ideales para mantener la higiene.",
        price: 2000,
        image: "imagenes_productos/BB-019.jpg"
    },
    {
        id: "SE-020",
        category: "Artículos de Aseo y Desechables",
        name: "Servilletas",
        description: "Suaves y absorbentes, perfectas para comidas y limpieza rápida.",
        price: 8000,
        image: "imagenes_productos/SE-020.jpg"
    },
    {
        id: "TO-021",
        category: "Artículos de Aseo y Desechables",
        name: "Toallón",
        description: "Papel absorbente multiuso, ideal para limpieza rápida en la cocina.",
        price: 2000,
        image: "imagenes_productos/TO-021.jpg"
    },
    {
        id: "PA-022",
        category: "Artículos de Aseo y Desechables",
        name: "Pañales",
        description: "Absorbentes y suaves, mantienen al bebé seco y cómodo.",
        price: 3500,
        image: "imagenes_productos/PA-022.jpg"
    },
    {
        id: "THB-023",
        category: "Artículos de Aseo y Desechables",
        name: "Toallas húmedas para bebé",
        description: "Limpieza delicada y suave para la piel del bebé.",
        price: 1500,
        image: "imagenes_productos/THB-023.jpg"
    },
    {
        id: "TS-024",
        category: "Artículos de Aseo y Desechables",
        name: "Toalla sanitaria",
        description: "Productos para damas para el periódo menstrual.",
        price: 3000,
        image: "imagenes_productos/TS-024.jpg"
    },
    {
        id: "DE-025",
        category: "Productos de Limpieza",
        name: "Desinfectante",
        description: "Limpieza para pisos de concreto y madera.",
        price: 3500,
        image: "imagenes_productos/DE-025.jpg"
    },
    {
        id: "PK-026",
        category: "Packs & Combos",
        name: "Kit Básico Limpieza",
        description: "Incluye Lavaloza, Detergente, Cloro y Bolsas de Basura. Todo lo esencial para un hogar limpio.",
        price: 8390,
        badge: "💰 Ahorra $1.110",
        packItems: ["Lavaloza", "Detergente", "Cloro", "Bolsas de basura"],
        image: "imagenes_productos/PK-026.jpg"
    },
    {
        id: "PK-027",
        category: "Packs & Combos",
        name: "Kit Limpieza Completo",
        description: "Incluye Lavaloza, Detergente, Suavizante, Cloro, Desinfectante y Aromatizante. Limpieza profunda del hogar.",
        price: 11890,
        badge: "⭐ Más Popular",
        packItems: ["Lavaloza", "Detergente", "Suavizante", "Cloro", "Desinfectante", "Aromatizante"],
        image: "imagenes_productos/PK-027.jpg"
    },
    {
        id: "PK-028",
        category: "Packs & Combos",
        name: "Kit Premium Aseo Hogar",
        description: "8 productos: Lavaloza, Detergente, Suavizante, Cloro, Desinfectante, Aromatizante, Bolsas de Basura y Toallón. ¡El pack más completo!",
        price: 15390,
        badge: "🏆 Pack Premium",
        packItems: ["Lavaloza", "Detergente", "Suavizante", "Cloro", "Desinfectante", "Aromatizante", "Bolsas de basura", "Toallón"],
        image: "imagenes_productos/PK-028.jpg"
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = products;
}

