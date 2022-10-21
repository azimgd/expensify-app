import React from 'react';
import _ from 'underscore';
import {
    // eslint-disable-next-line no-restricted-imports
    View, TouchableOpacity, Text, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import * as SecureCredentials from '../../libs/SecureCredentials';

const styles = StyleSheet.create({
    item: {
        padding: 12,
    },
});

const propTypes = {
    onFocus: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    onChangeText: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    nativeID: PropTypes.string.isRequired,
    autoCompleteType: PropTypes.string,
};

const defaultProps = {
    autoCompleteType: null,
};

class Dropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            position: null,
        };

        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.measurePositionOnFocus = this.measurePositionOnFocus.bind(this);
        this.handlePress = this.handlePress.bind(this);
        this.resetPositionOnBlur = this.resetPositionOnBlur.bind(this);
    }

    componentDidMount() {
        /**
         * Change default credentials here, for demo purposes only.
         * This will be removed once [save-password] feature is implemented
         */
        SecureCredentials.storeEncryptedCredentials([
            {username: 'me@azimgd.com', password: '!Testing1234!'},
            {username: 'john-doe@gmail.com', password: '321321321'},
            {username: 'bill@gmail.com', password: 'asdasdasd'},
        ]);

        this.fetchSecureCredentials();
    }

    onFocus(args) {
        if (!this.props.onFocus) {
            return;
        }
        this.props.onFocus(args);
        args.target.measure(this.measurePositionOnFocus);
    }

    onBlur(args) {
        if (!this.props.onBlur) {
            return;
        }
        this.props.onBlur(args);
        // this.resetPositionOnBlur();
    }

    measurePositionOnFocus(x, y, width, height, pageX, pageY) {
        const absoluteOffset = 12;
        const absoluteTop = pageY + height;
        const absoluteLeft = pageX;
        const absoluteWidth = width;

        this.setState(state => ({
            ...state,
            position: {
                top: absoluteTop + absoluteOffset,
                left: absoluteLeft,
                width: absoluteWidth,
            },
        }));
    }

    handlePress(index) {
        this.props.onChangeText(this.state.data[index][this.props.nativeID]);
        this.resetPositionOnBlur();
    }

    resetPositionOnBlur() {
        this.setState(state => ({
            ...state,
            position: null,
        }));
    }

    fetchSecureCredentials() {
        const credentials = SecureCredentials.fetchDecryptedCredentials();

        this.setState(state => ({
            ...state,
            data: credentials,
        }));
    }

    render() {
        if (!this.props.autoCompleteType) {
            return this.props.children;
        }

        const CustomTextInput = React.cloneElement(this.props.children, {onFocus: this.onFocus, onBlur: this.onBlur});

        const customStyle = {
            position: 'fixed',
            backgroundColor: '#333',
            borderRadius: 8,
            ...this.state.position,
        };

        // console.log(this.state);

        return (
            <View>
                {CustomTextInput}

                {this.state.position ? (
                    <View style={customStyle}>
                        {_.map(this.state.data, (item, index) => (
                            <TouchableOpacity style={styles.item} onPress={() => this.handlePress(index)} key={index}>
                                <Text style={{color: '#fff'}}>{item.username}</Text>
                                <View style={{height: 6}} />
                                <Text style={{color: '#fff'}}>*********</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : null}
            </View>
        );
    }
}

Dropdown.propTypes = propTypes;
Dropdown.defaultProps = defaultProps;

export default Dropdown;
