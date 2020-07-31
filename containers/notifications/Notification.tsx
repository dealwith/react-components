import React from 'react';
import { classnames } from '../../helpers/component';
import { NotificationType } from './interfaces';

const TYPES_CLASS = {
    error: 'notification-alert',
    warning: 'notification-warning',
    info: 'notification-info',
    success: 'notification-success',
};

const CLASSES = {
    NOTIFICATION: 'notification',
    NOTIFICATION_IN: 'notificationIn',
    NOTIFICATION_OUT: 'notificationOut',
};

interface Props {
    children: React.ReactNode;
    type: NotificationType;
    isClosing: boolean;
    onExit: () => void;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Notification = ({ children, type, isClosing, onClick, onExit }: Props) => {
    const handleAnimationEnd = ({ animationName }: React.AnimationEvent<HTMLDivElement>) => {
        if (animationName === CLASSES.NOTIFICATION_OUT && isClosing) {
            onExit();
        }
    };

    return (
        <div
            data-test-id="notification"
            aria-atomic="true"
            role="alert"
            className={classnames([
                'p1',
                'mb0-5',
                'break',
                CLASSES.NOTIFICATION,
                CLASSES.NOTIFICATION_IN,
                TYPES_CLASS[type] || TYPES_CLASS.success,
                isClosing && CLASSES.NOTIFICATION_OUT,
            ])}
            onClick={onClick}
            onAnimationEnd={handleAnimationEnd}
        >
            {children}
        </div>
    );
};
export default Notification;
