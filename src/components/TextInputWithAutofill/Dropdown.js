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
};

const defaultProps = {
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
        this.fetchSecureCredentials();
        this.props.onBlur(args);
        args.target.measure(this.resetPositionOnBlur);
    }

    measurePositionOnFocus(x, y, width, height, pageX, pageY) {
        const absoluteOffset = 12;
        const absoluteTop = pageY + height;
        const absoluteLeft = pageX;
        const absoluteWidth = width;

        this.setState({
            position: {
                top: absoluteTop + absoluteOffset,
                left: absoluteLeft,
                width: absoluteWidth,
            },
        });
    }

    handlePress(index) {
        this.props.onChangeText(this.state.data[index].username);
    }

    resetPositionOnBlur() {
        // this.setState({position: null});
    }

    fetchSecureCredentials() {
        // storeEncryptedCredentials
        console.log(SecureCredentials.fetchDecryptedCredentials());
        this.setState(state => ({
            ...state,
            data: [
                {
                    username: 'me@azimgd.com',
                    password: '*********',
                },
            ],
        }));
    }

    render() {
        const CustomTextInput = React.cloneElement(this.props.children, {onFocus: this.onFocus, onBlur: this.onBlur});

        const customStyle = {
            position: 'fixed',
            backgroundColor: '#333',
            borderRadius: 8,
            ...this.state.position,
        };

        return (
            <View>
                {CustomTextInput}

                {this.state.position ? (
                    <View style={customStyle}>
                        {_.map(this.state.data, (item, index) => (
                            <TouchableOpacity style={styles.item} onPress={() => this.handlePress(index)} key={index}>
                                <Text style={{color: '#fff'}}>{item.username}</Text>
                                <View style={{height: 6}} />
                                <Text style={{color: '#fff'}}>{item.password}</Text>
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
