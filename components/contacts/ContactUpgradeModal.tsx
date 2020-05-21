import React from 'react';
import { c } from 'ttag';
import { ConfirmModal, Alert } from 'react-components';
import { redirectTo } from 'proton-shared/lib/helpers/browser';
import { noop } from 'proton-shared/lib/helpers/function';

interface Props {
    onConfirm?: () => void;
    onClose?: () => void;
}

const UpgradeModal = ({ onConfirm = noop, onClose = noop, ...rest }: Props) => {
    return (
        <ConfirmModal
            title={c('Title').t`Upgrade required`}
            onConfirm={() => {
                redirectTo('/settings/subscription');
                onConfirm();
            }}
            onClose={onClose}
            confirm={c('Action').t`Upgrade`}
            {...rest}
        >
            <Alert type="warning">{c('Warning').t`This feature requires a paid Proton account`}</Alert>
        </ConfirmModal>
    );
};

export default UpgradeModal;
