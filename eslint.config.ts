import { createConfig } from '@abelspithost/eslint-config-ts';
import type { Config } from 'eslint/config';

const eslintConfig: Config[] = createConfig({ allowDefaultProject: ['*.config.ts'] });
export default eslintConfig;
