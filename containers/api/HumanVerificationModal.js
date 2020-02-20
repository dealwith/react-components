import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormModal, Alert, Row, Label } from 'react-components';
import { c } from 'ttag';

import Captcha from './Captcha';
import HumanVerificationLabel from './HumanVerificationLabel';
import CodeVerification from './CodeVerification';
import RequestInvite from './RequestInvite';

const getLabel = (method) =>
    ({
        captcha: c('Human verification method').t`Captcha`,
        payment: c('Human verification method').t`Donation`,
        sms: c('Human verification method').t`Verify with SMS`,
        email: c('Human verification method').t`Verify with email`,
        invite: c('Human verification method').t`Manual verification`
    }[method]);

const PREFERED_ORDER = {
    email: 0,
    sms: 1,
    captcha: 2,
    payment: 4,
    invite: 5
};

const orderMethods = (methods = []) => {
    const mapped = methods.map((item, index) => ({ index, item }));
    mapped.sort((a, b) => {
        if (PREFERED_ORDER[a.item] > PREFERED_ORDER[b.item]) {
            return 1;
        }
        if (PREFERED_ORDER[a.item] < PREFERED_ORDER[b.item]) {
            return -1;
        }
        return 0;
    });
    return mapped.map(({ index }) => methods[index]);
};

const HumanVerificationModal = ({ token, methods = [], onSuccess, ...rest }) => {
    const title = c('Title').t`Human verification`;
    const [method, setMethod] = useState();
    const orderedMethods = orderMethods(methods);

    const handleSubmit = (token) => {
        onSuccess({ token, method });
        rest.onClose();
    };

    useEffect(() => {
        if (orderedMethods.length) {
            setMethod(orderedMethods[0]);
        }
    }, []);

    return (
        <FormModal hasClose={false} hasSubmit={false} title={title} {...rest}>
            <Alert type="warning">{c('Info').t`For security reasons, please verify that you are not a robot.`}</Alert>
            {orderedMethods.length ? (
                <Row>
                    <Label>
                        {orderedMethods
                            .filter((m) => ['captcha', 'sms', 'email', 'invite', 'payment'].includes(m))
                            .map((m) => {
                                return (
                                    <HumanVerificationLabel
                                        value={m}
                                        key={m}
                                        methods={orderedMethods}
                                        method={method}
                                        onChange={setMethod}
                                    >
                                        {getLabel(m)}
                                    </HumanVerificationLabel>
                                );
                            })}
                    </Label>
                    <div className="w100">
                        {method === 'captcha' ? <Captcha token={token} onSubmit={handleSubmit} /> : null}
                        {method === 'email' ? <CodeVerification onSubmit={handleSubmit} method="email" /> : null}
                        {method === 'sms' ? <CodeVerification onSubmit={handleSubmit} method="sms" /> : null}
                        {method === 'payment' ? 'TODO' : null}
                        {method === 'invite' ? <RequestInvite /> : null}
                    </div>
                </Row>
            ) : null}
        </FormModal>
    );
};

HumanVerificationModal.propTypes = {
    token: PropTypes.string,
    methods: PropTypes.oneOf(['captcha', 'sms', 'email', 'invite', 'payment']).isRequired,
    onSuccess: PropTypes.func.isRequired
};

export default HumanVerificationModal;
