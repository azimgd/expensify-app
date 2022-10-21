import Onyx from 'react-native-onyx';
import ONYXKEYS from '../ONYXKEYS';
import ELECTRON_EVENTS from '../../desktop/ELECTRON_EVENTS';

let secureCredentials;
Onyx.connect({
    key: ONYXKEYS.SECURE_CREDENTIALS,
    waitForCollectionCallback: true,
    callback: val => secureCredentials = val,
});

function storeEncryptedCredentials(payload) {
    const encrypted = window.electron.sendSync(ELECTRON_EVENTS.REQUEST_SECURE_CREDENTIALS, JSON.stringify(payload));
    // eslint-disable-next-line rulesdir/prefer-actions-set-data
    Onyx.merge(ONYXKEYS.SECURE_CREDENTIALS, encrypted);
}

function fetchDecryptedCredentials() {
    const decrypted = window.electron.sendSync(ELECTRON_EVENTS.PERSIST_SECURE_CREDENTIALS, secureCredentials);
    try {
        return JSON.parse(decrypted);
    } catch (error) {
        return [];
    }
}

export {
    storeEncryptedCredentials,
    fetchDecryptedCredentials,
};
