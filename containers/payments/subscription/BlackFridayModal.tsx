import React, { useEffect, useState } from 'react';
import { checkSubscription } from 'proton-shared/lib/api/payments';
import { CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE, BLACK_FRIDAY, SECOND } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { isBefore } from 'date-fns';
import { Cycle, PlanIDs } from 'proton-shared/lib/interfaces';
import { isProductPayer, isCyberMonday } from 'proton-shared/lib/helpers/blackfriday';

import { FormModal, Loader, Countdown, Button, Price } from '../../../components';
import { useLoading, useApi, useSubscription } from '../../../hooks';
import { classnames } from '../../../helpers';
import CurrencySelector from '../CurrencySelector';
import './BlackFridayModal.scss';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;
const EVERY_SECOND = SECOND;

export interface Bundle {
    planIDs: PlanIDs;
    name: string;
    cycle: Cycle;
    couponCode?: string;
    percentage?: number;
    popular?: boolean;
}

interface Props<T> {
    onSelect: (bundle: Bundle) => void;
    bundles: Bundle[];
    className?: string;
}

interface Pricing {
    [index: number]: {
        withCoupon: number;
        withoutCoupon: number;
        withoutCouponMonthly: number;
    };
}

const BlackFridayModal = <T,>({ bundles = [], onSelect, ...rest }: Props<T>) => {
    const api = useApi();
    const [subscription] = useSubscription();
    const productPayer = isProductPayer(subscription);
    const [loading, withLoading] = useLoading();
    const [currency, updateCurrency] = useState(DEFAULT_CURRENCY);
    const [pricing, updatePricing] = useState<Pricing>({});
    const [now, setNow] = useState(new Date());

    const DEAL_TITLE = {
        [MONTHLY]: c('blackfriday Title').t`for 1 month`,
        [YEARLY]: c('blackfriday Title').t`for 1 year`,
        [TWO_YEARS]: c('blackfriday Title').t`for 2 years`,
    };

    const BILLED_DESCRIPTION = ({ cycle, amount, notice }: { cycle: Cycle; amount: React.ReactNode; notice: number }) =>
        ({
            [MONTHLY]: c('blackfriday Title').jt`Billed as ${amount} (${notice})`,
            [YEARLY]: c('blackfriday Title').jt`Billed as ${amount} (${notice})`,
            [TWO_YEARS]: c('blackfriday Title').jt`Billed as ${amount} (${notice})`,
        }[cycle]);

    const AFTER_INFO = ({ amount, notice }: { amount: React.ReactNode; notice: number }) =>
        ({
            1: c('Title')
                .jt`(${notice}) Renews after 1 year at a discounted annual price of ${amount} every year (20% discount).`,
            2: c('Title')
                .jt`(${notice}) Renews after 2 years at a discounted 2-year price of ${amount} every 2 years (47% discount).`,
            3: c('Title')
                .jt`(${notice}) Renews after 1 year at a discounted annual & bundle price of ${amount} every year (36% discount).`,
        }[notice]);

    const getTitle = () => {
        if (productPayer) {
            return c('blackfriday Title').t`ProtonDrive early access offer`;
        }
        if (isCyberMonday()) {
            return c('blackfriday Title').t`Cyber Monday Sale`;
        }
        return c('blackfriday Title').t`Black Friday Sale`;
    };

    const getCTA = () => {
        if (productPayer) {
            return c('blackfriday Action').t`Upgrade`;
        }
        return c('blackfriday Action').t`Get limited-time deal`;
    };

    const getDescription = () => {
        if (productPayer) {
            return (
                <p>{c('blackfriday Info')
                    .t`Get early access to our new encrypted drive for FREE by upgrading to a Plus bundle now.`}</p>
            );
        }
        return (
            <div className="bold aligncenter mt0 blackfriday-countdown-container pb1 mb2">
                <Countdown
                    end={
                        isBefore(now, BLACK_FRIDAY.CYBER_START)
                            ? BLACK_FRIDAY.CYBER_START
                            : isCyberMonday()
                            ? BLACK_FRIDAY.CYBER_END
                            : BLACK_FRIDAY.END
                    }
                />
            </div>
        );
    };

    const getFooter = () => {
        if (productPayer) {
            return (
                <p className="smaller opacity-50 aligncenter">{c('blackfriday Info')
                    .t`This subscription will automatically renew after 2 years at the same rate until it is cancelled.`}</p>
            );
        }
        return (
            <>
                {bundles.map((b, index) => {
                    const key = `${index}`;
                    const { withoutCoupon = 0 } = pricing[index] || {};
                    const amount = (
                        <Price key={key} currency={currency}>
                            {withoutCoupon}
                        </Price>
                    );
                    return (
                        <p key={key} className="smaller mt0 mb0 opacity-50 aligncenter">
                            {AFTER_INFO({ notice: index + 1, amount })}
                        </p>
                    );
                })}
                <p className="smaller mt1 mb0 opacity-50 aligncenter">{c('blackfriday Info')
                    .t`Discounts are based on monthly pricing.`}</p>
                <p className="smaller mt0 mb0 opacity-50 aligncenter">{c('blackfriday Info')
                    .t`Offer valid only for first-time paid subscriptions.`}</p>
            </>
        );
    };

    const getBundlePrices = async () => {
        const result = await Promise.all(
            bundles.map(({ planIDs = [], cycle = DEFAULT_CYCLE, couponCode }) => {
                return Promise.all([
                    api(
                        checkSubscription({
                            PlanIDs: planIDs,
                            CouponCode: couponCode,
                            Currency: currency,
                            Cycle: cycle,
                        })
                    ),
                    api(
                        checkSubscription({
                            PlanIDs: planIDs,
                            Currency: currency,
                            Cycle: cycle,
                        })
                    ),
                    api(
                        checkSubscription({
                            PlanIDs: planIDs,
                            Currency: currency,
                            Cycle: MONTHLY,
                        })
                    ),
                ]);
            })
        );

        updatePricing(
            result.reduce<Pricing>((acc, [withCoupon, withoutCoupon, withoutCouponMonthly], index) => {
                acc[index] = {
                    withCoupon: withCoupon.Amount + withCoupon.CouponDiscount,
                    withoutCoupon: withoutCoupon.Amount + withoutCoupon.CouponDiscount, // BUNDLE discount can be applied
                    withoutCouponMonthly: withoutCouponMonthly.Amount,
                };
                return acc;
            }, {})
        );
    };

    useEffect(() => {
        withLoading(getBundlePrices());
    }, []);

    useEffect(() => {
        const intervalID = setInterval(() => {
            setNow(new Date());
        }, EVERY_SECOND);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    return (
        <FormModal title={getTitle()} loading={loading} footer={null} {...rest}>
            {loading ? (
                <Loader />
            ) : (
                <>
                    {getDescription()}
                    <div className="flex flex-nowrap flex-spacearound mt4 onmobile-flex-column">
                        {bundles.map(({ name, cycle, planIDs, popular, couponCode }, index) => {
                            const key = `${index}`;
                            const { withCoupon = 0, withoutCouponMonthly = 0 } = pricing[index] || {};
                            const withCouponMonthly = withCoupon / cycle;
                            const percentage = 100 - Math.round((withCouponMonthly * 100) / withoutCouponMonthly);
                            const monthlyPrice = (
                                <Price
                                    currency={currency}
                                    className="blackfriday-monthly-price"
                                    suffix={c('blackfriday info').t`per month`}
                                >
                                    {withCoupon / cycle}
                                </Price>
                            );
                            const amountDue = (
                                <Price key={key} currency={currency}>
                                    {withCoupon}
                                </Price>
                            );
                            const regularPrice = (
                                <span className="strike" key={key}>
                                    <Price currency={currency}>{withoutCouponMonthly * cycle}</Price>
                                </span>
                            );

                            return (
                                <div
                                    key={key}
                                    className={classnames([
                                        'relative flex blackfriday-plan-container',
                                        popular && 'blackfriday-plan-container--mostPopular',
                                    ])}
                                >
                                    {percentage ? (
                                        <span
                                            className={classnames([
                                                'uppercase bold absolute color-white blackfriday-percentage aligncenter',
                                                popular ? 'bg-global-warning' : 'bg-global-grey',
                                            ])}
                                        >
                                            {`${percentage}% off`}
                                        </span>
                                    ) : null}
                                    {popular ? (
                                        <div className="uppercase absolute bold bg-primary color-white pt0-75 pb0-5 mt0 mb0 aligncenter blackfriday-mostPopular">{c(
                                            'Title'
                                        ).t`Most popular`}</div>
                                    ) : null}
                                    <div className="blackfriday-plan bordered-container p1 mb1 flex flex-column flex-items-center flex-justify-end onmobile-w100">
                                        <strong className="aligncenter big mt0-5 mb0">{name}</strong>
                                        <strong>{DEAL_TITLE[cycle]}</strong>
                                        <div className="mb1 mt1 aligncenter lh130">{monthlyPrice}</div>
                                        <div className="aligncenter flex-item-fluid-auto">
                                            {Object.keys(planIDs).length > 1 ? (
                                                <>
                                                    <p className="m0">{c('blackfriday Info').t`Includes`}</p>
                                                    <p
                                                        className={classnames([
                                                            'mt0',
                                                            popular && 'color-global-success',
                                                        ])}
                                                    >
                                                        {c('blackfriday Info').t`early access to`}
                                                        <strong className="blackfriday-protonDrive-productName ml0-25">
                                                            {c('blackfriday Info').t`ProtonDrive`}
                                                        </strong>
                                                        <span className="bl">
                                                            <span className="blackfriday-protonDrive-free bg-global-success uppercase color-white bold pl0-5 pr0-5">
                                                                {c('blackfriday Info').t`Free`}
                                                            </span>
                                                        </span>
                                                    </p>
                                                </>
                                            ) : null}
                                        </div>
                                        <Button
                                            className={classnames([
                                                'mb1 uppercase increase-surface-click',
                                                popular ? 'pm-button--primary' : 'pm-button--primaryborder',
                                            ])}
                                            onClick={() => {
                                                rest.onClose?.();
                                                onSelect({ planIDs, cycle, currency, couponCode });
                                            }}
                                        >
                                            {getCTA()}
                                        </Button>
                                        <small className="bold">
                                            {BILLED_DESCRIPTION({ cycle, amount: amountDue, notice: index + 1 })}
                                        </small>
                                        <small className="opacity-50 blackfriday-standardPrice mb1">{c(
                                            'blackfriday Info'
                                        ).jt`Standard price: ${regularPrice}`}</small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mb1 aligncenter">
                        <CurrencySelector
                            id="currency-select"
                            mode="buttons"
                            currency={currency}
                            onSelect={updateCurrency}
                        />
                    </div>
                    {getFooter()}
                </>
            )}
        </FormModal>
    );
};

export default BlackFridayModal;
