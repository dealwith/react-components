import React from 'react';
import { toMap } from 'proton-shared/lib/helpers/object';
import { CYCLE, BLACK_FRIDAY } from 'proton-shared/lib/constants';
import { isProductPayer } from 'proton-shared/lib/helpers/blackfriday';
import { Plan, Subscription } from 'proton-shared/lib/interfaces';

import BlackFridayModal, { Bundle } from './BlackFridayModal';

interface Props {
    plans: Plan[];
    subscription: Subscription;
    onSelect: (bundle: Bundle) => void;
}

const MailBlackFridayModal = ({ plans = [], subscription, ...rest }: Props) => {
    const plansMap = toMap(plans, 'Name');
    const bundles = isProductPayer(subscription)
        ? [
              {
                  name: 'ProtonMail Plus + ProtonVPN Plus',
                  cycle: CYCLE.TWO_YEARS,
                  planIDs: {
                      [plansMap.plus.ID]: 1,
                      [plansMap.vpnplus.ID]: 1,
                  },
              },
          ]
        : [
              {
                  name: 'Plus Plan',
                  cycle: CYCLE.YEARLY,
                  planIDs: { [plansMap.plus.ID]: 1 },
                  couponCode: BLACK_FRIDAY.COUPON_CODE,
              },
              {
                  name: 'ProtonMail Plus + ProtonVPN Plus',
                  cycle: CYCLE.TWO_YEARS,
                  planIDs: {
                      [plansMap.plus.ID]: 1,
                      [plansMap.vpnplus.ID]: 1,
                  },
                  couponCode: BLACK_FRIDAY.COUPON_CODE,
                  popular: true,
              },
              {
                  name: 'ProtonMail Plus + ProtonVPN Plus',
                  cycle: CYCLE.YEARLY,
                  planIDs: {
                      [plansMap.plus.ID]: 1,
                      [plansMap.vpnplus.ID]: 1,
                  },
                  couponCode: BLACK_FRIDAY.COUPON_CODE,
              },
          ];

    return <BlackFridayModal bundles={bundles} className="blackfriday-mail-modal" {...rest} />;
};

export default MailBlackFridayModal;
