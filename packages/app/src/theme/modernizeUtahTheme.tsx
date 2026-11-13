/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createUnifiedTheme,
  genPageTheme,
  palettes,
  shapes,
  UnifiedThemeProvider,
} from '@backstage/theme';
import appPlugin from '@backstage/plugin-app';
import DarkIcon from '@material-ui/icons/Brightness2';
import LightIcon from '@material-ui/icons/WbSunny';

const navy = '#185870';
const navyDeep = '#102833';
const teal = '#68D0C8';
const orange = '#E87840';

const pageTheme = {
  home: genPageTheme({ colors: [navy, teal], shape: shapes.wave }),
  documentation: genPageTheme({ colors: [navy, navyDeep], shape: shapes.wave2 }),
  tool: genPageTheme({ colors: [orange, '#C45A28'], shape: shapes.round }),
  service: genPageTheme({ colors: [navy, teal], shape: shapes.wave }),
  website: genPageTheme({ colors: [navyDeep, navy], shape: shapes.wave }),
  library: genPageTheme({ colors: [orange, navy], shape: shapes.wave }),
  other: genPageTheme({ colors: [navyDeep, navy], shape: shapes.wave }),
  app: genPageTheme({ colors: [orange, '#F0A070'], shape: shapes.wave }),
  apis: genPageTheme({ colors: [teal, navy], shape: shapes.wave2 }),
  card: genPageTheme({ colors: [teal, navy], shape: shapes.wave }),
};

const lightTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    primary: { main: navy },
    secondary: { main: orange },
    banner: {
      ...palettes.light.banner,
      info: navy,
    },
    bursts: {
      ...palettes.light.bursts,
      backgroundColor: { default: navy },
      gradient: {
        linear: `linear-gradient(-137deg, ${teal} 0%, ${navy} 100%)`,
      },
    },
    link: navy,
    linkHover: '#C45A28',
    navigation: {
      ...palettes.light.navigation,
      background: navyDeep,
      indicator: teal,
      selectedColor: '#FFFFFF',
      navItem: { hoverBackground: '#1E4A5C' },
      submenu: { background: '#1E4A5C' },
    },
    tabbar: { indicator: teal },
  },
  pageTheme,
  defaultPageTheme: 'home',
});

const darkTheme = createUnifiedTheme({
  palette: {
    ...palettes.dark,
    background: {
      default: '#1A2428',
      paper: '#243036',
    },
    primary: { main: teal },
    secondary: { main: orange },
    banner: {
      ...palettes.dark.banner,
      info: teal,
    },
    bursts: {
      ...palettes.dark.bursts,
      backgroundColor: { default: navy },
      gradient: {
        linear: `linear-gradient(-137deg, ${teal} 0%, ${navy} 100%)`,
      },
    },
    link: teal,
    linkHover: '#9BE4DE',
    navigation: {
      ...palettes.dark.navigation,
      background: navyDeep,
      indicator: orange,
      selectedColor: '#FFFFFF',
      navItem: { hoverBackground: '#1E4A5C' },
      submenu: { background: '#1E4A5C' },
    },
    tabbar: { indicator: orange },
  },
  pageTheme,
  defaultPageTheme: 'home',
});

/**
 * Replaces the default Backstage light and dark themes with the Modernize Utah
 * palette taken from the organization logo.
 */
export const brandedApp = appPlugin.withOverrides({
  extensions: [
    appPlugin.getExtension('theme:app/light').override({
      params: {
        theme: {
          id: 'light',
          title: 'Light',
          variant: 'light',
          icon: <LightIcon />,
          Provider: ({ children }) => (
            <UnifiedThemeProvider theme={lightTheme}>
              {children}
            </UnifiedThemeProvider>
          ),
        },
      },
    }),
    appPlugin.getExtension('theme:app/dark').override({
      params: {
        theme: {
          id: 'dark',
          title: 'Dark',
          variant: 'dark',
          icon: <DarkIcon />,
          Provider: ({ children }) => (
            <UnifiedThemeProvider theme={darkTheme}>
              {children}
            </UnifiedThemeProvider>
          ),
        },
      },
    }),
  ],
});
