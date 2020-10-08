import React, { useState, useEffect } from 'react';
import { APPS, BLACK_FRIDAY } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { isProductPayer } from 'proton-shared/lib/helpers/blackfriday';
import { PlanIDs, Cycle, Currency } from 'proton-shared/lib/interfaces';

import { Hamburger } from '../../components';
import {
    useConfig,
    useUser,
    useLoading,
    useBlackFridayPeriod,
    useApi,
    useProductPayerPeriod,
    useModals,
    usePlans,
    useSubscription,
    useLocalState,
} from '../../hooks';
import Header, { Props as HeaderProps } from '../../components/header/Header';
import { checkLastCancelledSubscription } from '../payments/subscription/helpers';
import UserDropdown from './UserDropdown';
import TopNavbarLink from '../../components/link/TopNavbarLink';
import { TopNavbarItem } from '../app/TopNavbar';
import { AppsDropdown, TopNavbar } from '../app';
import SupportDropdown from './SupportDropdown';
import UpgradeButton from './UpgradeButton';
import UpgradeVPNButton from './UpgradeVPNButton';
import BlackFridayButton from './BlackFridayButton';
import { MailBlackFridayModal, NewSubscriptionModal, VPNBlackFridayModal } from '../payments';

interface Props extends HeaderProps {
    logo?: React.ReactNode;
    settingsButton?: React.ReactNode;
    backUrl?: string;
    floatingButton?: React.ReactNode;
    searchBox?: React.ReactNode;
    searchDropdown?: React.ReactNode;
    hasAppsDropdown?: boolean;
    title: string;
    expanded: boolean;
    onToggleExpand?: () => void;
    isNarrow?: boolean;
}
const PrivateHeader = ({
    isNarrow,
    hasAppsDropdown = true,
    logo,
    settingsButton,
    backUrl,
    searchBox,
    searchDropdown,
    floatingButton,
    expanded,
    onToggleExpand,
    title,
}: Props) => {
    const [{ hasPaidMail, hasPaidVpn, isFree, ID }] = useUser();
    const [blackFridayModalState, setBlackFridayModalState] = useLocalState(
        false,
        `${ID}${BLACK_FRIDAY.COUPON_CODE}-black-friday-modal`
    );
    const [productPayerModalState, setProductPayerModalState] = useLocalState(false, `${ID}-product-payer-modal`);
    const [plans = []] = usePlans();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const isBlackFridayPeriod = useBlackFridayPeriod();
    const isProductPayerPeriod = useProductPayerPeriod();
    const [loading, withLoading] = useLoading();
    const [isEligible, setEligibility] = useState(false);
    const { createModal } = useModals();
    const api = useApi();
    const showBlackFridayButton = isBlackFridayPeriod && isEligible && !loading;

    const onSelect = ({
        planIDs,
        cycle,
        currency,
        couponCode,
    }: {
        planIDs: PlanIDs;
        cycle: Cycle;
        currency: Currency;
        couponCode?: string | null;
    }) => {
        createModal(<NewSubscriptionModal planIDs={planIDs} cycle={cycle} currency={currency} coupon={couponCode} />);
    };

    useEffect(() => {
        if (isFree && isBlackFridayPeriod) {
            withLoading(checkLastCancelledSubscription(api).then(setEligibility));
        }
    }, [isBlackFridayPeriod, isFree]);

    useEffect(() => {
        if (plans.length && isBlackFridayPeriod && isEligible && !blackFridayModalState) {
            setBlackFridayModalState(true);
            if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                return createModal(
                    <VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />
                );
            }
            createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
        }
    }, [isBlackFridayPeriod, isEligible, plans]);

    useEffect(() => {
        if (plans.length && isProductPayerPeriod && isProductPayer(subscription) && !productPayerModalState) {
            setProductPayerModalState(true);
            if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                return createModal(
                    <VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />
                );
            }
            createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
        }
    }, [isProductPayerPeriod, subscription, plans]);

    if (backUrl) {
        return (
            <Header>
                <TopNavbarLink
                    data-test-id="view:general-back"
                    to={backUrl}
                    icon="arrow-left"
                    text={c('Title').t`Back`}
                />
                <TopNavbar>
                    <TopNavbarItem>
                        <UserDropdown />
                    </TopNavbarItem>
                </TopNavbar>
            </Header>
        );
    }

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    return (
        <Header>
            <div className="logo-container flex flex-spacebetween flex-items-center flex-nowrap nomobile">
                {logo}
                {hasAppsDropdown ? <AppsDropdown /> : null}
            </div>
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="big lh-standard mtauto mbauto ellipsis">{title}</span> : null}
            {isNarrow ? null : searchBox}
            <TopNavbar>
                {isNarrow && searchDropdown ? <TopNavbarItem>{searchDropdown}</TopNavbarItem> : null}
                {showBlackFridayButton ? (
                    <TopNavbarItem>
                        <BlackFridayButton plans={plans} subscription={subscription} />
                    </TopNavbarItem>
                ) : null}
                {hasPaidMail || isNarrow || isVPN ? null : (
                    <TopNavbarItem>
                        <UpgradeButton />
                    </TopNavbarItem>
                )}
                {hasPaidVpn || isNarrow || !isVPN ? null : (
                    <TopNavbarItem>
                        <UpgradeVPNButton />
                    </TopNavbarItem>
                )}
                {!settingsButton ? null : <TopNavbarItem>{settingsButton}</TopNavbarItem>}
                <TopNavbarItem>
                    <SupportDropdown />
                </TopNavbarItem>
                <TopNavbarItem className="relative">
                    <UserDropdown />
                </TopNavbarItem>
            </TopNavbar>
            {isNarrow && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
