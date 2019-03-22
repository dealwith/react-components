import React from 'react';
import PropTypes from 'prop-types';

const Radio = ({ id, ...rest }) => {
    return (
        <label htmlFor={id}>
            <input id={id} type="radio" className="pm-radio" {...rest} />
            <span className="pm-radio-fakeradio" />
        </label>
    );
};

Radio.propTypes = {
    id: PropTypes.string
};

export default Radio;
