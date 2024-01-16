// To organize imports in a better way
/* eslint-disable import/order */
import 'reflect-metadata'; // include once in the app for inversify (see: https://github.com/inversify/InversifyJS/blob/master/README.md#-installation)
import { EPG_TYPE, INTEGRATION } from '#src/config';
import { container } from '#src/modules/container';

import ApiService from '#src/services/api.service';
import WatchHistoryService from '#src/services/watchhistory.service';
import GenericEntitlementService from '#src/services/genericEntitlement.service';
import JWPEntitlementService from '#src/services/jwpEntitlement.service';
import FavoritesService from '#src/services/favorites.service';
import ConfigService from '#src/services/config.service';
import SettingsService from '#src/services/settings.service';

// Epg services
import EpgService from '#src/services/epg/epg.service';
import ViewNexaEpgService from '#src/services/epg/viewNexa.epg.service';
import JWEpgService from '#src/services/epg/jw.epg.service';

import WatchHistoryController from '#src/stores/WatchHistoryController';
import CheckoutController from '#src/stores/CheckoutController';
import AccountController from '#src/stores/AccountController';
import ProfileController from '#src/stores/ProfileController';
import FavoritesController from '#src/stores/FavoritesController';
import AppController from '#src/stores/AppController';
import EpgController from '#src/stores/EpgController';

// Integration interfaces
import AccountService from '#src/services/account.service';
import CheckoutService from '#src/services/checkout.service';
import SubscriptionService from '#src/services/subscription.service';
import ProfileService from '#src/services/profile.service';

// Cleeng integration
import CleengService from '#src/services/cleeng.service';
import CleengAccountService from '#src/services/cleeng.account.service';
import CleengCheckoutService from '#src/services/cleeng.checkout.service';
import CleengSubscriptionService from '#src/services/cleeng.subscription.service';

// InPlayer integration
import InplayerAccountService from '#src/services/inplayer.account.service';
import InplayerCheckoutService from '#src/services/inplayer.checkout.service';
import InplayerSubscriptionService from '#src/services/inplayer.subscription.service';
import InplayerProfileService from '#src/services/inplayer.profile.service';

// Common services
container.bind(ConfigService).toSelf();
container.bind(WatchHistoryService).toSelf();
container.bind(FavoritesService).toSelf();
container.bind(GenericEntitlementService).toSelf();
container.bind(ApiService).toSelf();
container.bind(SettingsService).toSelf();

// Common controllers
container.bind(AppController).toSelf();
container.bind(WatchHistoryController).toSelf();
container.bind(FavoritesController).toSelf();

// Integration controllers
container.bind(AccountController).toSelf();
container.bind(CheckoutController).toSelf();
container.bind(ProfileController).toSelf();
container.bind(EpgController).toSelf();

container.bind('INTEGRATION_TYPE').toDynamicValue((context) => {
  return context.container.get(AppController).getIntegrationType();
});

// EPG services
container.bind(EpgService).to(JWEpgService).whenTargetNamed(EPG_TYPE.jwp);
container.bind(EpgService).to(ViewNexaEpgService).whenTargetNamed(EPG_TYPE.viewNexa);

// Cleeng integration
container.bind(CleengService).toSelf();
container.bind(AccountService).to(CleengAccountService).whenTargetNamed(INTEGRATION.CLEENG);
container.bind(CheckoutService).to(CleengCheckoutService).whenTargetNamed(INTEGRATION.CLEENG);
container.bind(SubscriptionService).to(CleengSubscriptionService).whenTargetNamed(INTEGRATION.CLEENG);

// JWP integration
container.bind(JWPEntitlementService).toSelf();
container.bind(AccountService).to(InplayerAccountService).whenTargetNamed(INTEGRATION.JWP);
container.bind(CheckoutService).to(InplayerCheckoutService).whenTargetNamed(INTEGRATION.JWP);
container.bind(SubscriptionService).to(InplayerSubscriptionService).whenTargetNamed(INTEGRATION.JWP);
container.bind(ProfileService).to(InplayerProfileService).whenTargetNamed(INTEGRATION.JWP);
