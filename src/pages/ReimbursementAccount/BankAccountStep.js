import _ from 'underscore';
import React from 'react';
import {
    View, Image, Pressable, StyleSheet,
} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import {Lock} from '../../components/Icon/Expensicons';
import styles from '../../styles/styles';
import TextLink from '../../components/TextLink';
import Icon from '../../components/Icon';
import colors from '../../styles/colors';
import Navigation from '../../libs/Navigation/Navigation';
import CONST from '../../CONST';
import AddPlaidBankAccount from '../../components/AddPlaidBankAccount';
import CheckboxWithLabel from '../../components/CheckboxWithLabel';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import exampleCheckImage from '../../../assets/images/example-check-image.png';
import Text from '../../components/Text';
import ExpensiTextInput from '../../components/ExpensiTextInput';
import Button from '../../components/Button';
import FixedFooter from '../../components/FixedFooter';
import {
    setBankAccountFormValidationErrors,
    setBankAccountSubStep,
    setupWithdrawalAccount,
    showBankAccountErrorModal,
    updateReimbursementAccountDraft,
} from '../../libs/actions/BankAccounts';
import ONYXKEYS from '../../ONYXKEYS';
import compose from '../../libs/compose';
import * as ReimbursementAccountUtils from '../../libs/ReimbursementAccountUtils';
import ReimbursementAccountForm from './ReimbursementAccountForm';
import reimbursementAccountPropTypes from './reimbursementAccountPropTypes';
import withWindowDimensions, {windowDimensionsPropTypes} from '../../components/withWindowDimensions';

import HeroCardWebImage from '../../../assets/images/cascading-cards-web.svg';
import HeroCardMobileImage from '../../../assets/images/cascading-cards-mobile.svg';

const propTypes = {
    /** Bank account currently in setup */
    // eslint-disable-next-line react/no-unused-prop-types
    reimbursementAccount: reimbursementAccountPropTypes.isRequired,

    ...withLocalizePropTypes,
    ...windowDimensionsPropTypes,
};

class BankAccountStep extends React.Component {
    constructor(props) {
        super(props);

        this.toggleTerms = this.toggleTerms.bind(this);
        this.addManualAccount = this.addManualAccount.bind(this);
        this.addPlaidAccount = this.addPlaidAccount.bind(this);
        this.state = {
            // One of CONST.BANK_ACCOUNT.SETUP_TYPE
            hasAcceptedTerms: ReimbursementAccountUtils.getDefaultStateForField(props, 'acceptTerms', true),
            routingNumber: ReimbursementAccountUtils.getDefaultStateForField(props, 'routingNumber'),
            accountNumber: ReimbursementAccountUtils.getDefaultStateForField(props, 'accountNumber'),
        };

        // Keys in this.errorTranslationKeys are associated to inputs, they are a subset of the keys found in this.state
        this.errorTranslationKeys = {
            routingNumber: 'bankAccount.error.routingNumber',
            accountNumber: 'bankAccount.error.accountNumber',
        };

        this.getErrorText = inputKey => ReimbursementAccountUtils.getErrorText(this.props, this.errorTranslationKeys, inputKey);
        this.clearError = inputKey => ReimbursementAccountUtils.clearError(this.props, inputKey);
        this.getErrors = () => ReimbursementAccountUtils.getErrors(this.props);
    }

    toggleTerms() {
        this.setState((prevState) => {
            const hasAcceptedTerms = !prevState.hasAcceptedTerms;
            updateReimbursementAccountDraft({acceptTerms: hasAcceptedTerms});
            return {hasAcceptedTerms};
        });
        this.clearError('hasAcceptedTerms');
    }

    /**
     * @returns {Boolean}
     */
    validate() {
        const errors = {};

        // These are taken from BankCountry.js in Web-Secure
        if (!CONST.BANK_ACCOUNT.REGEX.IBAN.test(this.state.accountNumber.trim())) {
            errors.accountNumber = true;
        }
        if (!CONST.BANK_ACCOUNT.REGEX.SWIFT_BIC.test(this.state.routingNumber.trim())) {
            errors.routingNumber = true;
        }
        if (!this.state.hasAcceptedTerms) {
            errors.hasAcceptedTerms = true;
        }

        setBankAccountFormValidationErrors(errors);
        return _.size(errors) === 0;
    }

    /**
     * Clear the error associated to inputKey if found and store the inputKey new value in the state.
     *
     * @param {String} inputKey
     * @param {String} value
     */
    clearErrorAndSetValue(inputKey, value) {
        const newState = {[inputKey]: value};
        this.setState(newState);
        updateReimbursementAccountDraft(newState);
        this.clearError(inputKey);
    }

    addManualAccount() {
        if (!this.validate()) {
            showBankAccountErrorModal();
            return;
        }
        setupWithdrawalAccount({
            acceptTerms: this.state.hasAcceptedTerms,
            accountNumber: this.state.accountNumber,
            routingNumber: this.state.routingNumber,
            setupType: CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL,

            // Note: These are hardcoded as we're not supporting AU bank accounts for the free plan
            country: CONST.COUNTRY.US,
            currency: CONST.CURRENCY.USD,
            fieldsType: CONST.BANK_ACCOUNT.FIELDS_TYPE.LOCAL,
        });
    }

    /**
     * @param {Object} params
     * @param {Object} params.account
     * @param {String} params.account.bankName
     * @param {Boolean} params.account.isSavings
     * @param {String} params.account.addressName
     * @param {String} params.account.ownershipType
     * @param {String} params.account.accountNumber
     * @param {String} params.account.routingNumber
     * @param {String} params.account.plaidAccountID
     */
    addPlaidAccount(params) {
        setupWithdrawalAccount({
            acceptTerms: true,
            setupType: CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID,

            // Params passed via the Plaid callback when an account is selected
            plaidAccessToken: params.plaidLinkToken,
            accountNumber: params.account.accountNumber,
            routingNumber: params.account.routingNumber,
            plaidAccountID: params.account.plaidAccountID,
            ownershipType: params.account.ownershipType,
            isSavings: params.account.isSavings,
            bankName: params.account.bankName,
            addressName: params.account.addressName,

            // Note: These are hardcoded as we're not supporting AU bank accounts for the free plan
            country: CONST.COUNTRY.US,
            currency: CONST.CURRENCY.USD,
            fieldsType: CONST.BANK_ACCOUNT.FIELDS_TYPE.LOCAL,
        });
    }

    render() {
        // Disable bank account fields once they've been added in db so they can't be changed
        const isFromPlaid = this.props.achData.setupType === CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID;
        const shouldDisableInputs = Boolean(this.props.achData.bankAccountID) || isFromPlaid;
        const subStep = this.props.achData.subStep;
        return (
            <View style={[styles.flex1, styles.justifyContentBetween]}>
                <HeaderWithCloseButton
                    title={this.props.translate('bankAccount.headerTitle')}
                    onCloseButtonPress={Navigation.dismissModal}
                    onBackButtonPress={() => setBankAccountSubStep(null)}
                    shouldShowBackButton={Boolean(subStep)}
                />
                {!subStep && (
                    <>
                        <View style={[styles.flex1, styles.mh5, styles.mt5]}>
                            <View style={[styles.flexRow, styles.justifyContentBetween, styles.mb5]}>
                                <Text style={[
                                    styles.textXLarge,
                                    this.props.isSmallScreenWidth || this.props.isMediumScreenWidth ? styles.flex1 : undefined,
                                ]}
                                >
                                    {this.props.translate('bankAccount.subtitle')}
                                </Text>
                                {this.props.isSmallScreenWidth || this.props.isMediumScreenWidth
                                    ? (
                                        <HeroCardMobileImage style={StyleSheet.flatten([styles.w50, styles.h100])} />
                                    )
                                    : (
                                        <HeroCardWebImage />
                                    )}
                            </View>
                            <Text style={[styles.mb5]}>
                                {this.props.translate('bankAccount.description')}
                            </Text>
                            <View style={[styles.flexRow, styles.justifyContentBetween]}>
                                <TextLink href="https://use.expensify.com/privacy">
                                    {this.props.translate('common.privacy')}
                                </TextLink>
                                <View style={[styles.flexRow, styles.alignItemsCenter]}>
                                    <TextLink
                                        // eslint-disable-next-line max-len
                                        href="https://community.expensify.com/discussion/5677/deep-dive-how-expensify-protects-your-information/"
                                    >
                                        {this.props.translate('bankAccount.yourDataIsSecure')}
                                    </TextLink>
                                    <View style={[styles.ml1]}>
                                        <Icon src={Lock} fill={colors.blue} />
                                    </View>
                                </View>
                            </View>
                        </View>
                        <FixedFooter>
                            {this.props.isPlaidDisabled && (
                                <Text style={[styles.formError, styles.pb2]}>
                                    {this.props.translate('bankAccount.error.tooManyAttempts')}
                                </Text>
                            )}
                            <Button
                                success
                                onPress={() => setBankAccountSubStep(CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID)}
                                isDisabled={this.props.isPlaidDisabled}
                                style={[styles.w100]}
                                text={this.props.translate('bankAccount.connectWithPlaid')}
                            />
                            <Pressable
                                onPress={() => setBankAccountSubStep(CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL)}
                                accessibilityRole="button"
                            >
                                {({hovered, pressed}) => (
                                    <Text style={[styles.pt3, styles.textLabelSupporting, styles.alignSelfCenter, (hovered || pressed) ? styles.linkMutedHovered : undefined]}>
                                        {this.props.translate('bankAccount.connectManually')}
                                    </Text>
                                )}
                            </Pressable>
                        </FixedFooter>
                    </>
                )}
                {subStep === CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID && (
                    <AddPlaidBankAccount
                        text={this.props.translate('bankAccount.plaidBodyCopy')}
                        onSubmit={this.addPlaidAccount}
                        onExitPlaid={() => setBankAccountSubStep(null)}

                    />
                )}
                {subStep === CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL && (
                    <ReimbursementAccountForm
                        onSubmit={this.addManualAccount}
                    >
                        <Text style={[styles.mb5]}>
                            {this.props.translate('bankAccount.checkHelpLine')}
                        </Text>
                        <Image
                            resizeMode="contain"
                            style={[styles.exampleCheckImage, styles.mb5]}
                            source={exampleCheckImage}
                        />
                        <ExpensiTextInput
                            label={this.props.translate('bankAccount.routingNumber')}
                            keyboardType="number-pad"
                            value={this.state.routingNumber}
                            onChangeText={value => this.clearErrorAndSetValue('routingNumber', value)}
                            disabled={shouldDisableInputs}
                            errorText={this.getErrorText('routingNumber')}
                        />
                        <ExpensiTextInput
                            containerStyles={[styles.mt4]}
                            label={this.props.translate('bankAccount.accountNumber')}
                            keyboardType="number-pad"
                            value={this.state.accountNumber}
                            onChangeText={value => this.clearErrorAndSetValue('accountNumber', value)}
                            disabled={shouldDisableInputs}
                            errorText={this.getErrorText('accountNumber')}
                        />
                        <CheckboxWithLabel
                            style={[styles.mb4, styles.mt5]}
                            isChecked={this.state.hasAcceptedTerms}
                            onPress={this.toggleTerms}
                            LabelComponent={() => (
                                <View style={[styles.flexRow, styles.alignItemsCenter]}>
                                    <Text>
                                        {this.props.translate('common.iAcceptThe')}
                                    </Text>
                                    <TextLink href="https://use.expensify.com/terms">
                                        {`Expensify ${this.props.translate('common.termsOfService')}`}
                                    </TextLink>
                                </View>
                            )}
                            hasError={this.getErrors().hasAcceptedTerms}
                        />
                    </ReimbursementAccountForm>
                )}
            </View>
        );
    }
}

BankAccountStep.propTypes = propTypes;
export default compose(
    withLocalize,
    withWindowDimensions,
    withOnyx({
        reimbursementAccount: {
            key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
        },
        reimbursementAccountDraft: {
            key: ONYXKEYS.REIMBURSEMENT_ACCOUNT_DRAFT,
        },
    }),
)(BankAccountStep);
