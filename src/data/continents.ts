/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Continent, ContinentId } from '../types/game';

export const CONTINENTS: Record<ContinentId, Continent> = {
  north_america: {
    id: 'north_america',
    name: 'América do Norte',
    bonus: 5,
    color: '#eab308', // Gold/Yellow tone
    territoryIds: [
      'alaska',
      'mackenzie',
      'greenland',
      'vancouver',
      'ottawa',
      'labrador',
      'california',
      'new_york',
      'mexico'
    ]
  },
  south_america: {
    id: 'south_america',
    name: 'América do Sul',
    bonus: 2,
    color: '#10b981', // Emerald/Green tone
    territoryIds: ['venezuela', 'brazil', 'bolivia', 'argentina']
  },
  europe: {
    id: 'europe',
    name: 'Europa',
    bonus: 5,
    color: '#3b82f6', // Classic Blue tone
    territoryIds: [
      'iceland',
      'england',
      'sweden',
      'germany',
      'poland',
      'france',
      'moscow'
    ]
  },
  africa: {
    id: 'africa',
    name: 'África',
    bonus: 3,
    color: '#f43f5e', // Rose/Crimson tone
    territoryIds: [
      'algeria',
      'egypt',
      'sudan',
      'congo',
      'south_africa',
      'madagascar'
    ]
  },
  asia: {
    id: 'asia',
    name: 'Ásia',
    bonus: 7,
    color: '#f97316', // Orange tone
    territoryIds: [
      'middle_east',
      'aral',
      'omsk',
      'dudinka',
      'siberia',
      'vladivostok',
      'tchita',
      'mongolia',
      'china',
      'india',
      'vietnam',
      'japan'
    ]
  },
  oceania: {
    id: 'oceania',
    name: 'Oceania',
    bonus: 2,
    color: '#a855f7', // Purple tone
    territoryIds: ['australia', 'new_guinea', 'sumatra', 'borneo']
  }
};
