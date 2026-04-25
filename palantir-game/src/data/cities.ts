export type ThreatTier = 1 | 2 | 3

export interface City {
  id: string
  name: string
  lat: number
  lng: number
  tier: ThreatTier
  country: string
}

export const CITIES: City[] = [
  { id: 'moscow',      name: 'MOSCOW',       lat: 55.75, lng:  37.62, tier: 1, country: 'RU' },
  { id: 'beijing',     name: 'BEIJING',      lat: 39.91, lng: 116.39, tier: 1, country: 'CN' },
  { id: 'tehran',      name: 'TEHRAN',       lat: 35.69, lng:  51.39, tier: 1, country: 'IR' },
  { id: 'istanbul',    name: 'ISTANBUL',     lat: 41.01, lng:  28.95, tier: 2, country: 'TR' },
  { id: 'karachi',     name: 'KARACHI',      lat: 24.86, lng:  67.01, tier: 2, country: 'PK' },
  { id: 'delhi',       name: 'NEW DELHI',    lat: 28.61, lng:  77.23, tier: 2, country: 'IN' },
  { id: 'riyadh',      name: 'RIYADH',       lat: 24.69, lng:  46.72, tier: 2, country: 'SA' },
  { id: 'pyongyang',   name: 'PYONGYANG',    lat: 39.02, lng: 125.75, tier: 1, country: 'KP' },
  { id: 'minsk',       name: 'MINSK',        lat: 53.91, lng:  27.57, tier: 2, country: 'BY' },
  { id: 'baku',        name: 'BAKU',         lat: 40.41, lng:  49.87, tier: 2, country: 'AZ' },
  { id: 'kabul',       name: 'KABUL',        lat: 34.53, lng:  69.17, tier: 1, country: 'AF' },
  { id: 'damascus',    name: 'DAMASCUS',     lat: 33.51, lng:  36.29, tier: 1, country: 'SY' },
  { id: 'tripoli',     name: 'TRIPOLI',      lat: 32.90, lng:  13.18, tier: 2, country: 'LY' },
  { id: 'khartoum',    name: 'KHARTOUM',     lat: 15.56, lng:  32.53, tier: 2, country: 'SD' },
  { id: 'almaty',      name: 'ALMATY',       lat: 43.24, lng:  76.95, tier: 3, country: 'KZ' },
  { id: 'tashkent',    name: 'TASHKENT',     lat: 41.30, lng:  69.24, tier: 3, country: 'UZ' },
  { id: 'odesa',       name: 'ODESA',        lat: 46.48, lng:  30.72, tier: 1, country: 'UA' },
  { id: 'aden',        name: 'ADEN',         lat: 12.78, lng:  45.04, tier: 2, country: 'YE' },
  { id: 'murmansk',    name: 'MURMANSK',     lat: 68.97, lng:  33.07, tier: 2, country: 'RU' },
  { id: 'vladivostok', name: 'VLADIVOSTOK',  lat: 43.12, lng: 131.88, tier: 2, country: 'RU' },
  { id: 'latakia',     name: 'LATAKIA',      lat: 35.52, lng:  35.79, tier: 1, country: 'SY' },
  { id: 'bandar',      name: 'BANDAR ABBAS', lat: 27.19, lng:  56.27, tier: 2, country: 'IR' },
  { id: 'donetsk',     name: 'DONETSK',      lat: 48.00, lng:  37.80, tier: 1, country: 'UA' },
  { id: 'simferopol',  name: 'SIMFEROPOL',   lat: 44.95, lng:  34.10, tier: 1, country: 'UA' },
  { id: 'dushanbe',    name: 'DUSHANBE',     lat: 38.56, lng:  68.77, tier: 3, country: 'TJ' },
  { id: 'yerevan',     name: 'YEREVAN',      lat: 40.18, lng:  44.51, tier: 3, country: 'AM' },
  { id: 'tbilisi',     name: 'TBILISI',      lat: 41.69, lng:  44.83, tier: 3, country: 'GE' },
  { id: 'aleppo',      name: 'ALEPPO',       lat: 36.20, lng:  37.16, tier: 1, country: 'SY' },
  { id: 'mosul',       name: 'MOSUL',        lat: 36.34, lng:  43.12, tier: 1, country: 'IQ' },
  { id: 'benghazi',    name: 'BENGHAZI',     lat: 32.12, lng:  20.07, tier: 2, country: 'LY' },
]
