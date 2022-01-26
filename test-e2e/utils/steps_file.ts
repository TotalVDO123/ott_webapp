import * as assert from 'assert';

import {constants} from "./utils";

declare global {
  let jwplayer: () => {getState: () => string};
}

module.exports = function() {
  return actor({

    // Define custom steps here, use 'this' to access default methods of I.
    // It is recommended to place a general 'login' function here.

    login: function (this: CodeceptJS.I, email = constants.username, password = constants.password) {
      this.amOnPage('/');
      this.click('Sign in');
      this.fillField('Email', email);
      this.fillField('password', password);
      this.click('button[type="submit"]');
      this.wait(5);
    },
    loginMobile: function (this: CodeceptJS.I, email = constants.username, password = constants.password) {
      this.amOnPage('/');
      this.click('div[aria-label="Open menu"]');
      this.click('Sign in');
      this.fillField('Email', email);
      this.fillField('password', password);
      this.click('button[type="submit"]');
      this.wait(5);
    },
    swipeLeft: async function (this: CodeceptJS.I, args) {
      args.direction = 'left';
      await this.swipe(args);
    },
    swipeRight: async function (this: CodeceptJS.I, args) {
      args.direction = 'right';
      await this.swipe(args);
    },
    swipe: async function (this: CodeceptJS.I, args) {
      await this.executeScript((args) => {
        const xpath = args.xpath || `//*[text() = "${args.text}"]`;

        const points = args.direction === 'left' ? {x1: 100, y1: 1, x2: 50, y2: 1}
            : args.direction === 'right' ? {x1: 50, y1: 1, x2: 100, y2: 1}
                : args.points;

        const element = document.evaluate(xpath, document, null, XPathResult.ANY_UNORDERED_NODE_TYPE,
            null).singleNodeValue;

        if (!element) {
          throw `Could not find element by xpath: "${xpath}"`;
        }

        element.dispatchEvent(new TouchEvent('touchstart',
            {
              bubbles: true,
              touches: [
                new Touch({
                  identifier: Date.now(),
                  target: element,
                  clientX: points.x1,
                  clientY: points.y1
                })
              ]
            }));

        element.dispatchEvent(new TouchEvent('touchend',
            {
              bubbles: true,
              changedTouches: [
                new Touch({
                  identifier: Date.now() + 1,
                  target: element,
                  clientX: points.x2,
                  clientY: points.y2
                })
              ]
            }));

      }, args);

      this.wait(1);
    },
    waitForPlayerPlaying: async function (title, tries = 10) {
      this.see(title);
      await this.waitForPlayerState('playing', ['buffering', 'idle', ''], tries);
    },
    waitForPlayerState: async function (this: CodeceptJS.I, expectedState, allowedStates: string[] = [], tries = 5) {
      // Since this check executes a script in the browser, it won't use the codecept retries,
      // so we have to manually retry (this is because the video can take time to load and the state will be buffering)
      for (let i = 0; i < tries; i++) {
        const state = await this.executeScript(() => typeof jwplayer === 'undefined' ? '' : jwplayer().getState());

        await this.say(`Waiting for Player state. Expected: "${expectedState}", Current: "${state}"`);

        if (state === expectedState) {
          return;
        }

        if (allowedStates.indexOf(state) >= 0) {
          this.wait(1);
        } else {
          assert.fail(`Unexpected player state: ${state}`);
        }
      }

      assert.fail(`Player did not reach "${expectedState}"`);
    },
    checkPlayerClosed: async function (this: CodeceptJS.I) {
      this.dontSeeElement('div[class*="jwplayer"]');
      this.dontSeeElement('video');
      // eslint-disable-next-line no-console
      assert.equal(await this.executeScript(() => typeof jwplayer === 'undefined' ? undefined : jwplayer().getState),
          undefined);
    }
  });
}