import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Router } from 'react-router';
import { createBrowserHistory as createHistory } from 'history';
import createAuthentication from 'proton-shared/lib/authentication/createAuthenticationStore';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import { formatUser, UserModel } from 'proton-shared/lib/models/userModel';
import { STATUS } from 'proton-shared/lib/models/cache';
import createSecureSessionStorage from 'proton-shared/lib/authentication/createSecureSessionStorage';
import createSecureSessionStorage2 from 'proton-shared/lib/authentication/createSecureSessionStorage2';
import {
    isSSOMode,
    MAILBOX_PASSWORD_KEY,
    UID_KEY,
    SSO_AUTHORIZE_PATH,
    SSO_FORK_PATH,
    APPS,
    SSO_SWITCH_PATH,
} from 'proton-shared/lib/constants';
import { getPersistedSession } from 'proton-shared/lib/authentication/session';
import { getBasename, getLocalIDFromPathname } from 'proton-shared/lib/authentication/helper';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import { replaceUrl } from 'proton-shared/lib/helpers/browser';
import { getAppHref } from 'proton-shared/lib/apps/helper';

import Signout from './Signout';
import CompatibilityCheck from './CompatibilityCheck';
import Icons from '../../components/icon/Icons';
import ConfigProvider from '../config/Provider';
import NotificationsProvider from '../notifications/Provider';
import ModalsProvider from '../modals/Provider';
import ApiProvider from '../api/ApiProvider';
import CacheProvider from '../cache/Provider';
import AuthenticationProvider from '../authentication/Provider';
import RightToLeftProvider from '../rightToLeft/Provider';
import { setTmpEventID } from './loadEventID';
import clearKeyCache from './clearKeyCache';
import useInstance from '../../hooks/useInstance';
import { PreventLeaveProvider } from '../../hooks/usePreventLeave';
import { MimeIcons } from '../../index';

interface Props {
    config: ProtonConfig;
    children: React.ReactNode;
}

const ProtonApp = ({ config, children }: Props) => {
    const authentication = useInstance(() => {
        if (isSSOMode) {
            return createAuthentication(createSecureSessionStorage2());
        }
        return createAuthentication(createSecureSessionStorage([MAILBOX_PASSWORD_KEY, UID_KEY]));
    });
    const pathnameRef = useRef<string | undefined>();
    const cacheRef = useRef<Cache<string, any>>();
    if (!cacheRef.current) {
        cacheRef.current = createCache<string, any>();
    }
    const [authData, setAuthData] = useState(() => {
        const UID = authentication.getUID();
        if (!isSSOMode) {
            return {
                UID,
                localID: undefined,
                basename: getBasename(),
            };
        }
        const pathname = window.location.pathname;
        if (
            pathname.startsWith(SSO_FORK_PATH) ||
            pathname.startsWith(SSO_AUTHORIZE_PATH) ||
            pathname.startsWith(SSO_SWITCH_PATH)
        ) {
            // Special routes which should never be logged in
            return;
        }
        const localID = getLocalIDFromPathname(pathname);
        if (localID === undefined) {
            return;
        }
        const oldLocalId = authentication.getLocalID();
        const oldPersistedSession = getPersistedSession(oldLocalId);
        // Current session is active and actual
        if (oldPersistedSession?.UID === UID && localID === oldLocalId) {
            return {
                UID,
                localID,
                basename: getBasename(localID),
            };
        }
        const persistedSession = getPersistedSession(localID);
        const persistedUID = persistedSession?.UID;
        // Persistent session is invalid
        if (!persistedSession || !persistedUID) {
            return;
        }
        // Persistent session to be validated
        authentication.setUID(persistedUID);
        authentication.setTmpPersistedSession(persistedSession);
        authentication.setLocalID(localID);
        return {
            UID: persistedUID,
            localID,
            basename: getBasename(localID),
        };
    });

    const handleLogin = useCallback(({ UID: newUID, EventID, keyPassword, User, LocalID: newLocalID, pathname }) => {
        authentication.setUID(newUID);
        authentication.setPassword(keyPassword);
        authentication.setLocalID(newLocalID);

        const oldCache = cacheRef.current;
        if (oldCache) {
            oldCache.clear();
            oldCache.clearListeners();
        }
        const cache = createCache<string, any>();

        // If the user was received from the login call, pre-set it directly.
        User &&
            cache.set(UserModel.key, {
                value: formatUser(User),
                status: STATUS.RESOLVED,
            });

        setTmpEventID(cache, EventID);

        cacheRef.current = cache;
        pathnameRef.current = pathname || '/';

        setAuthData({
            UID: newUID,
            localID: newLocalID,
            basename: getBasename(newLocalID),
        });
    }, []);

    const [isFinalizeLogout, setIsFinalizeLogout] = useState(false);

    const handleLogout = useCallback(() => {
        setIsFinalizeLogout(true);
    }, []);

    const handleFinalizeLogout = useCallback(() => {
        authentication.setUID(undefined);
        authentication.setPassword(undefined);

        const oldCache = cacheRef.current;
        if (oldCache) {
            clearKeyCache(oldCache);
            oldCache.clear();
            oldCache.clearListeners();
        }

        cacheRef.current = createCache<string, any>();
        pathnameRef.current = '/';

        if (isSSOMode) {
            return replaceUrl(getAppHref('/login', APPS.PROTONACCOUNT));
        }
        setAuthData(undefined);
    }, []);

    const { UID, basename, localID } = authData || {};

    const authenticationValue = useMemo(() => {
        if (!UID) {
            return {
                login: handleLogin,
            };
        }
        return {
            UID,
            localID,
            ...authentication,
            logout: handleLogout,
        };
    }, [UID]);

    const history = useMemo(() => {
        return createHistory({ basename });
    }, [UID]);

    const [, setRerender] = useState<any>();
    useEffect(() => {
        if (pathnameRef.current !== undefined) {
            // This is to avoid a race condition where the path cannot be replaced imperatively in login or logout
            // because the context will re-render the public app and redirect to a wrong url
            // and while there is a redirect to consume the children are not rendered to avoid the default redirects triggering
            history.replace(pathnameRef.current);
            pathnameRef.current = undefined;
            setRerender({});
        }
    }, [pathnameRef.current, history]);

    const render = () => {
        if (isFinalizeLogout) {
            return <Signout onDone={handleFinalizeLogout} />;
        }
        if (pathnameRef.current) {
            return null;
        }
        return children;
    };

    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Icons />
                <MimeIcons />
                <RightToLeftProvider>
                    <React.Fragment key={UID}>
                        <Router history={history}>
                            <PreventLeaveProvider>
                                <NotificationsProvider>
                                    <ModalsProvider>
                                        <ApiProvider UID={UID} config={config} onLogout={handleLogout}>
                                            <AuthenticationProvider store={authenticationValue}>
                                                <CacheProvider cache={cacheRef.current}>{render()}</CacheProvider>
                                            </AuthenticationProvider>
                                        </ApiProvider>
                                    </ModalsProvider>
                                </NotificationsProvider>
                            </PreventLeaveProvider>
                        </Router>
                    </React.Fragment>
                </RightToLeftProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

export default ProtonApp;