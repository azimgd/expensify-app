import {Platform} from 'react-native';
import _ from 'underscore';
import packageJSON from '../../../package.json';

const getSystemDetails = (navigation) => {
    const navigationState = navigation.getState();

    const appstate = {
        version: packageJSON.version,
        platform: Platform.OS,
        OS: Platform.OS,
        currentScreen: navigationState.key,
        recentRouteHistory: _.map(navigationState.routes, route => route.name),
        recentLogs: [],
    };

    return appstate;
};

export default getSystemDetails;
