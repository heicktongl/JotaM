export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  seller: string;
  username: string;
  distance: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  provider: string;
  username: string;
  rating: number;
  pricePerHour: number;
  image: string;
  category: string;
  distance: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Cesta de Orgânicos Local',
    price: 45.00,
    image: 'https://picsum.photos/seed/veg/800/1000',
    category: 'Alimentos',
    seller: 'Horta do João',
    username: 'hortadojoao',
    distance: '0.8 km',
    description: 'Produtos colhidos hoje de manhã, sem agrotóxicos.'
  },
  {
    id: 'p4',
    name: 'Mel Puro Silvestre',
    price: 25.00,
    image: 'https://picsum.photos/seed/honey/800/1000',
    category: 'Alimentos',
    seller: 'Horta do João',
    username: 'hortadojoao',
    distance: '0.8 km',
    description: 'Mel puro coletado das nossas abelhas nativas, direto do produtor.'
  },
  {
    id: 'p2',
    name: 'Pão Artesanal de Fermentação Natural',
    price: 22.00,
    image: 'https://picsum.photos/seed/bread/800/1000',
    category: 'Padaria',
    seller: 'Padaria da Vila',
    username: 'padariadavila',
    distance: '1.2 km',
    description: 'Sourdough crocante por fora e macio por dentro.'
  },
  {
    id: 'p3',
    name: 'Vaso de Cerâmica Feito à Mão',
    price: 89.00,
    image: 'https://picsum.photos/seed/pottery/800/1000',
    category: 'Decoração',
    seller: 'Ateliê da Maria',
    username: 'ateliedamaria',
    distance: '2.5 km',
    description: 'Peça única moldada manualmente com argila local.'
  },
  {
    id: 'p5',
    name: 'Terra Adubada Orgânica (5kg)',
    price: 15.00,
    image: 'https://picsum.photos/seed/soil/800/1000',
    category: 'Jardinagem',
    seller: 'Carlos Verde',
    username: 'carlosverde',
    distance: '1.5 km',
    description: 'Mistura perfeita e rica em nutrientes para suas plantas crescerem fortes.'
  }
];

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Consultoria de Jardinagem',
    provider: 'Carlos Verde',
    username: 'carlosverde',
    rating: 4.9,
    pricePerHour: 80,
    image: 'https://picsum.photos/seed/garden/800/1000',
    category: 'Serviços Casa',
    distance: '1.5 km'
  },
  {
    id: 's3',
    name: 'Manutenção de Vasos e Plantas',
    provider: 'Carlos Verde',
    username: 'carlosverde',
    rating: 5.0,
    pricePerHour: 50,
    image: 'https://picsum.photos/seed/plants/800/1000',
    category: 'Serviços Casa',
    distance: '1.5 km'
  },
  {
    id: 's2',
    name: 'Aula de Violão para Iniciantes',
    provider: 'Ana Música',
    username: 'anamusica',
    rating: 5.0,
    pricePerHour: 60,
    image: 'https://picsum.photos/seed/guitar/800/1000',
    category: 'Educação',
    distance: '3.0 km'
  }
];
