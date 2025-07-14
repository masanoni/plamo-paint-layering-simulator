import { Paint } from '../types';
import { mrColorPaints } from './creos/lacquer/mr-color';
import { mrColorGXPaints } from './creos/lacquer/mr-color-gx';
import { mrCrystalColorPaints } from './creos/lacquer/mr-crystal-color';
import { mrMetalColorPaints } from './creos/lacquer/mr-metal-color';
import { superMetallic2Paints } from './creos/lacquer/super-metallic-2';
import { mrColorLascivusPaints } from './creos/lacquer/mr-color-lascivus';
import { gundamAssembleModelColorPaints } from './creos/lacquer/gundam-assemble-model-color';

import { hobbyColorPaints } from './creos/water-based/hobby-color';
import { hobbyColorSuperMetallicPaints } from './creos/water-based/hobby-color-super-metallic';
import { gundamSeedColorPaints } from './creos/water-based/gundam-seed-color';
import { gundamWitchFromMercuryColorPaints } from './creos/water-based/gundam-witch-from-mercury-color';
import { gundamSeedFreedomColorPaints } from './creos/water-based/gundam-seed-freedom-color';

import { acrysionPaints } from './creos/acrysion/acrysion';
import { acrysionBaseColorPaints } from './creos/acrysion/acrysion-base-color';

import { gaiaColorPaints } from './gaia/lacquer/gaia-color';
import { exSeriesPaints } from './gaia/lacquer/ex-series';
import { metallicColorPaints } from './gaia/lacquer/metallic-color';
import { pearlColorPaints } from './gaia/lacquer/pearl-color';
import { premiumSeriesPaints } from './gaia/lacquer/premium-series';
import { prismColorPaints } from './gaia/lacquer/prism-color';


// 今後、他の塗料シリーズをここに追加していきます。
export const allPaints: Paint[] = [
  ...mrColorPaints,
  ...mrColorGXPaints,
  ...mrCrystalColorPaints,
  ...mrMetalColorPaints,
  ...superMetallic2Paints,
  ...mrColorLascivusPaints,
  ...gundamAssembleModelColorPaints,
  ...hobbyColorPaints,
  ...hobbyColorSuperMetallicPaints,
  ...gundamSeedColorPaints,
  ...gundamWitchFromMercuryColorPaints,
  ...gundamSeedFreedomColorPaints,
  ...acrysionPaints,
  ...acrysionBaseColorPaints,
  ...gaiaColorPaints,
  ...exSeriesPaints,
  ...metallicColorPaints,
  ...pearlColorPaints,
  ...premiumSeriesPaints,
  ...prismColorPaints,
];
