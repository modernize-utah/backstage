/*
 * Copyright 2025 The Backstage Authors
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
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
} from '@backstage/core-components';
import { Link } from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import MenuIcon from '@material-ui/icons/Menu';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { NotificationsSidebarItem } from '@backstage/plugin-notifications';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { makeStyles } from '@material-ui/core/styles';
import logoFull from '../assets/logo-full.png';
import logoIcon from '../assets/logo-icon.png';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: '100%',
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
    overflow: 'hidden',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 16,
    textDecoration: 'none',
  },
  full: {
    height: 64,
    width: 'auto',
    maxWidth: sidebarConfig.drawerWidthOpen - 28,
    objectFit: 'contain',
  },
  icon: {
    height: 32,
    width: 32,
    marginLeft: 4,
    objectFit: 'contain',
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" className={classes.link} aria-label="Home">
        {isOpen ? (
          <img
            className={classes.full}
            src={logoFull}
            alt="Modernize Utah"
          />
        ) : (
          <img className={classes.icon} src={logoIcon} alt="" />
        )}
      </Link>
    </div>
  );
};

export const appModuleNav = createFrontendModule({
  pluginId: 'app',
  extensions: [
    NavContentBlueprint.make({
      params: {
        component: ({ navItems }) => {
          const nav = navItems.withComponent(item => (
            <SidebarItem
              icon={() => item.icon}
              to={item.href}
              text={item.title}
            />
          ));
          // Consume without rendering — handled by the search modal
          nav.take('page:search');
          return (
            <Sidebar>
              <SidebarLogo />
              <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
                <SidebarSearchModal />
              </SidebarGroup>
              <SidebarDivider />
              <SidebarGroup label="Menu" icon={<MenuIcon />}>
                {nav.take('page:home')}
                {nav.take('page:catalog')}
                {nav.take('page:scaffolder')}
                <SidebarDivider />
                <SidebarScrollWrapper>
                  {nav.rest({ sortBy: 'title' })}
                </SidebarScrollWrapper>
              </SidebarGroup>
              <SidebarDivider />
              <SidebarSpace />
              <SidebarDivider />
              <SidebarGroup
                label="Settings"
                icon={<UserSettingsSignInAvatar />}
                to="/settings"
              >
                <NotificationsSidebarItem />
                {nav.take('page:devtools')}
                {nav.take('page:user-settings')}
              </SidebarGroup>
            </Sidebar>
          );
        },
      },
    }),
  ],
});
