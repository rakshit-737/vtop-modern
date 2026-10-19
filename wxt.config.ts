import { defineConfig } from 'wxt';
import { VTOP_MATCH_PATTERNS } from './src/core/routing/vtop-route';
import packageJson from './package.json';

export default defineConfig({
  manifestVersion: 3,
  publicDir: 'icons',
  manifest: {
    name: 'VTOP Modern - Academic Companion',
    short_name: 'VTOP Modern',
    version: packageJson.version,
    description:
      'A local-only VTOP companion with typed attendance planning, best-effort privacy shielding, and keyboard navigation.',
    permissions: ['storage', 'tabs'],
    host_permissions: [...VTOP_MATCH_PATTERNS],
    browser_specific_settings: {
      gecko: {
        id: 'vtop-modern@vit.ac.in',
        strict_min_version: '120.0',
      },
    },
    icons: {
      16: 'icon16.png',
      32: 'icon32.png',
      48: 'icon48.png',
      128: 'icon128.png',
    },
    action: {
      default_title: 'VTOP Modern Control Center',
    },
  },
});
