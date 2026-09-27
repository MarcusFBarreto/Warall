/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Territory } from '../types/game';

export const TERRITORIES: Territory[] = [
  // ================= NORTH AMERICA (9) =================
  {
    id: 'alaska',
    name: 'Alasca',
    continentId: 'north_america',
    neighbors: ['mackenzie', 'vancouver', 'vladivostok'],
    x: 85,
    y: 110,
    cardSymbol: 'triangle'
  },
  {
    id: 'mackenzie',
    name: 'Mackenzie',
    continentId: 'north_america',
    neighbors: ['alaska', 'vancouver', 'ottawa', 'greenland'],
    x: 165,
    y: 110,
    cardSymbol: 'circle'
  },
  {
    id: 'greenland',
    name: 'Groelândia',
    continentId: 'north_america',
    neighbors: ['mackenzie', 'labrador', 'iceland'],
    x: 320,
    y: 85,
    cardSymbol: 'square'
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    continentId: 'north_america',
    neighbors: ['alaska', 'mackenzie', 'ottawa', 'california'],
    x: 145,
    y: 165,
    cardSymbol: 'triangle'
  },
  {
    id: 'ottawa',
    name: 'Ottawa',
    continentId: 'north_america',
    neighbors: ['mackenzie', 'vancouver', 'california', 'new_york', 'labrador'],
    x: 215,
    y: 175,
    cardSymbol: 'circle'
  },
  {
    id: 'labrador',
    name: 'Labrador',
    continentId: 'north_america',
    neighbors: ['greenland', 'ottawa', 'new_york'],
    x: 275,
    y: 160,
    cardSymbol: 'square'
  },
  {
    id: 'california',
    name: 'Califórnia',
    continentId: 'north_america',
    neighbors: ['vancouver', 'ottawa', 'new_york', 'mexico'],
    x: 140,
    y: 235,
    cardSymbol: 'triangle'
  },
  {
    id: 'new_york',
    name: 'Nova York',
    continentId: 'north_america',
    neighbors: ['ottawa', 'labrador', 'california', 'mexico'],
    x: 220,
    y: 230,
    cardSymbol: 'square'
  },
  {
    id: 'mexico',
    name: 'México',
    continentId: 'north_america',
    neighbors: ['california', 'new_york', 'venezuela'],
    x: 160,
    y: 310,
    cardSymbol: 'circle'
  },

  // ================= SOUTH AMERICA (4) =================
  {
    id: 'venezuela',
    name: 'Venezuela',
    continentId: 'south_america',
    neighbors: ['mexico', 'brazil', 'bolivia'],
    x: 235,
    y: 380,
    cardSymbol: 'triangle'
  },
  {
    id: 'brazil',
    name: 'Brasil',
    continentId: 'south_america',
    neighbors: ['venezuela', 'bolivia', 'argentina', 'algeria'],
    x: 300,
    y: 440,
    cardSymbol: 'circle'
  },
  {
    id: 'bolivia',
    name: 'Bolívia',
    continentId: 'south_america',
    neighbors: ['venezuela', 'brazil', 'argentina'],
    x: 230,
    y: 470,
    cardSymbol: 'square'
  },
  {
    id: 'argentina',
    name: 'Argentina',
    continentId: 'south_america',
    neighbors: ['bolivia', 'brazil'],
    x: 250,
    y: 560,
    cardSymbol: 'square'
  },

  // ================= EUROPE (7) =================
  {
    id: 'iceland',
    name: 'Islândia',
    continentId: 'europe',
    neighbors: ['greenland', 'england'],
    x: 410,
    y: 110,
    cardSymbol: 'circle'
  },
  {
    id: 'england',
    name: 'Inglaterra',
    continentId: 'europe',
    neighbors: ['iceland', 'france', 'germany'],
    x: 420,
    y: 175,
    cardSymbol: 'triangle'
  },
  {
    id: 'sweden',
    name: 'Suécia',
    continentId: 'europe',
    neighbors: ['germany', 'moscow'],
    x: 495,
    y: 115,
    cardSymbol: 'square'
  },
  {
    id: 'germany',
    name: 'Alemanha',
    continentId: 'europe',
    neighbors: ['england', 'france', 'poland', 'sweden'],
    x: 475,
    y: 195,
    cardSymbol: 'circle'
  },
  {
    id: 'poland',
    name: 'Polônia',
    continentId: 'europe',
    neighbors: ['germany', 'moscow', 'middle_east'],
    x: 530,
    y: 185,
    cardSymbol: 'triangle'
  },
  {
    id: 'france',
    name: 'França',
    continentId: 'europe',
    neighbors: ['england', 'germany', 'algeria', 'egypt'],
    x: 435,
    y: 240,
    cardSymbol: 'square'
  },
  {
    id: 'moscow',
    name: 'Moscou',
    continentId: 'europe',
    neighbors: ['sweden', 'poland', 'aral', 'omsk', 'middle_east'],
    x: 585,
    y: 155,
    cardSymbol: 'circle'
  },

  // ================= AFRICA (6) =================
  {
    id: 'algeria',
    name: 'Argélia',
    continentId: 'africa',
    neighbors: ['brazil', 'france', 'egypt', 'congo', 'sudan'],
    x: 440,
    y: 330,
    cardSymbol: 'circle'
  },
  {
    id: 'egypt',
    name: 'Egito',
    continentId: 'africa',
    neighbors: ['france', 'algeria', 'sudan', 'middle_east'],
    x: 510,
    y: 320,
    cardSymbol: 'triangle'
  },
  {
    id: 'sudan',
    name: 'Sudão',
    continentId: 'africa',
    neighbors: ['algeria', 'egypt', 'congo', 'south_africa', 'madagascar'],
    x: 535,
    y: 395,
    cardSymbol: 'square'
  },
  {
    id: 'congo',
    name: 'Congo',
    continentId: 'africa',
    neighbors: ['algeria', 'sudan', 'south_africa'],
    x: 490,
    y: 430,
    cardSymbol: 'triangle'
  },
  {
    id: 'south_africa',
    name: 'África do Sul',
    continentId: 'africa',
    neighbors: ['congo', 'sudan', 'madagascar'],
    x: 510,
    y: 520,
    cardSymbol: 'circle'
  },
  {
    id: 'madagascar',
    name: 'Madagascar',
    continentId: 'africa',
    neighbors: ['sudan', 'south_africa'],
    x: 595,
    y: 510,
    cardSymbol: 'square'
  },

  // ================= ASIA (12) =================
  {
    id: 'middle_east',
    name: 'Oriente Médio',
    continentId: 'asia',
    neighbors: ['poland', 'moscow', 'egypt', 'aral', 'india'],
    x: 585,
    y: 285,
    cardSymbol: 'square'
  },
  {
    id: 'aral',
    name: 'Aral',
    continentId: 'asia',
    neighbors: ['moscow', 'middle_east', 'omsk', 'china', 'india'],
    x: 650,
    y: 210,
    cardSymbol: 'circle'
  },
  {
    id: 'omsk',
    name: 'Omsk',
    continentId: 'asia',
    neighbors: ['moscow', 'aral', 'dudinka', 'china', 'mongolia'],
    x: 675,
    y: 135,
    cardSymbol: 'triangle'
  },
  {
    id: 'dudinka',
    name: 'Dudinka',
    continentId: 'asia',
    neighbors: ['omsk', 'siberia', 'tchita', 'mongolia'],
    x: 750,
    y: 95,
    cardSymbol: 'circle'
  },
  {
    id: 'siberia',
    name: 'Sibéria',
    continentId: 'asia',
    neighbors: ['dudinka', 'vladivostok', 'tchita'],
    x: 820,
    y: 95,
    cardSymbol: 'square'
  },
  {
    id: 'vladivostok',
    name: 'Vladivostok',
    continentId: 'asia',
    neighbors: ['alaska', 'siberia', 'tchita', 'japan'],
    x: 890,
    y: 125,
    cardSymbol: 'triangle'
  },
  {
    id: 'tchita',
    name: 'Tchita',
    continentId: 'asia',
    neighbors: ['dudinka', 'siberia', 'vladivostok', 'mongolia', 'china'],
    x: 800,
    y: 175,
    cardSymbol: 'square'
  },
  {
    id: 'mongolia',
    name: 'Mongólia',
    continentId: 'asia',
    neighbors: ['omsk', 'dudinka', 'tchita', 'china', 'japan'],
    x: 760,
    y: 220,
    cardSymbol: 'circle'
  },
  {
    id: 'japan',
    name: 'Japão',
    continentId: 'asia',
    neighbors: ['vladivostok', 'mongolia'],
    x: 910,
    y: 235,
    cardSymbol: 'triangle'
  },
  {
    id: 'china',
    name: 'China',
    continentId: 'asia',
    neighbors: ['aral', 'omsk', 'mongolia', 'tchita', 'india', 'vietnam'],
    x: 740,
    y: 295,
    cardSymbol: 'square'
  },
  {
    id: 'india',
    name: 'Índia',
    continentId: 'asia',
    neighbors: ['middle_east', 'aral', 'china', 'vietnam', 'sumatra'],
    x: 675,
    y: 335,
    cardSymbol: 'circle'
  },
  {
    id: 'vietnam',
    name: 'Vietnã',
    continentId: 'asia',
    neighbors: ['china', 'india', 'borneo'],
    x: 775,
    y: 375,
    cardSymbol: 'triangle'
  },

  // ================= OCEANIA (4) =================
  {
    id: 'sumatra',
    name: 'Sumatra',
    continentId: 'oceania',
    neighbors: ['india', 'australia'],
    x: 735,
    y: 460,
    cardSymbol: 'square'
  },
  {
    id: 'borneo',
    name: 'Bornéu',
    continentId: 'oceania',
    neighbors: ['vietnam', 'new_guinea', 'australia'],
    x: 825,
    y: 440,
    cardSymbol: 'circle'
  },
  {
    id: 'new_guinea',
    name: 'Nova Guiné',
    continentId: 'oceania',
    neighbors: ['borneo', 'australia'],
    x: 900,
    y: 435,
    cardSymbol: 'triangle'
  },
  {
    id: 'australia',
    name: 'Austrália',
    continentId: 'oceania',
    neighbors: ['sumatra', 'borneo', 'new_guinea'],
    x: 845,
    y: 540,
    cardSymbol: 'triangle'
  }
];

export const TERRITORIES_MAP: Record<string, Territory> = TERRITORIES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, Territory>
);
