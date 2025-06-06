/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import './header_logo.scss';
import { i18n } from '@osd/i18n';
import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import { ChromeNavLink } from '../..';
import { ChromeBranding } from '../../chrome_service';
import type { Logos } from '../../../../common/types';

function onClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  forceNavigation: boolean,
  navLinks: ChromeNavLink[],
  navigateToApp: (appId: string) => void
) {
  const anchor = (event.nativeEvent.target as HTMLAnchorElement)?.closest('a');
  if (!anchor) {
    return;
  }

  const navLink = navLinks.find((item) => item.href === anchor.href);
  if (navLink && navLink.disabled) {
    event.preventDefault();
    return;
  }

  if (event.isDefaultPrevented() || event.altKey || event.metaKey || event.ctrlKey) {
    return;
  }

  if (forceNavigation) {
    const toParsed = new URL(anchor.href);
    const fromParsed = new URL(document.location.href);
    const sameProto = toParsed.protocol === fromParsed.protocol;
    const sameHost = toParsed.host === fromParsed.host;
    const samePath = toParsed.pathname === fromParsed.pathname;

    if (sameProto && sameHost && samePath) {
      if (toParsed.hash) {
        document.location.reload();
      }

      // event.preventDefault() keeps the browser from seeing the new url as an update
      // and even setting window.location does not mimic that behavior, so instead
      // we use stopPropagation() to prevent angular from seeing the click and
      // starting a digest cycle/attempting to handle it in the router.
      event.stopPropagation();
    }
  } else {
    navigateToApp('wz-home');
    event.preventDefault();
  }
}

interface Props {
  href: string;
  navLinks$: Observable<ChromeNavLink[]>;
  forceNavigation$: Observable<boolean>;
  navigateToApp: (appId: string) => void;
  branding: ChromeBranding;
  logos: Logos;
  /* indicates the background color-scheme this element will appear over
   * `'normal'` and `'light'` are synonyms of being `undefined`, to mean not `'dark'`
   */
  backgroundColorScheme?: 'normal' | 'light' | 'dark';
}

export function HeaderLogo({
  href,
  navigateToApp,
  branding,
  logos,
  backgroundColorScheme,
  ...observables
}: Props) {
  const forceNavigation = useObservable(observables.forceNavigation$, false);
  const navLinks = useObservable(observables.navLinks$, []);
  const { applicationTitle = 'opensearch dashboards' } = branding;

  const {
    [backgroundColorScheme === 'dark' ? 'dark' : 'light']: { url: logoURL },
    type: logoType,
  } = logos.Application;
  const testSubj = `${logoType}Logo`;

  const alt = `${applicationTitle} logo`;

  return (
    <a
      data-test-subj="logo"
      onClick={(e) => onClick(e, forceNavigation, navLinks, navigateToApp)}
      href={href}
      aria-label={i18n.translate('core.ui.chrome.headerGlobalNav.goHomePageIconAriaLabel', {
        defaultMessage: 'Go to home page',
      })}
      className="logoContainer"
    >
      <img
        data-test-subj={testSubj}
        data-test-image-url={logoURL}
        src={logoURL}
        alt={alt}
        loading="lazy"
        className="logoImage"
      />
    </a>
  );
}
