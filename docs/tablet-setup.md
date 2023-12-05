# Settings up tablets as meeting room wall displays

We use cheap Amazon Fire tablets but you can use anything you have.

## 1. Set up your device

- Reset it to factory settings
- Disable location services, clouds, auto-saving passwords, etc. Everything, except Wi-Fi :)
- Disable screen PIN if it's possible
- Set the device to Dark Mode
- Find a way to connect your device to a charger so that it is always charged. We've checked, all modern devices live for several years with the charger and the screen on

## 2. Install Fully Kiosk app

- Go to [fully-kiosk.com](https://fully-kiosk.com/) (beware of fake websites that impersonate this app in google results, use the exact URL)
- Scroll to the very bottom, find a small «Download APK» link in the footer
- Choose «Fully Kiosk Browser APK for Android/Fire», ignore the warning popup at the bottom of your screen
- Open the downloaded file, another warning pop-up should appear. Click «Setting», turn on «Allow from this source» and go back. Now you can finally click «Install»

## 3. Set up the Kiosk app

- Set «Start URL» to: `https://hq.your.domain/room-display` and click «Start using»
- Swipe from the left corner of your screen to open a menu. Go to «Settings» and scroll to the very bottom to «Other Settings -> Volume License Key». We recommend using licensed version, it's cheap and has more options
- On the same «Other Settings» screen tap «Get All Runtime Permissions». The app will take you through a cycle of screens, on EVERY ONE of which you either have to press «Allow», «While using the app» or select «Fully Kiosk» from the list and activate the slider. Now our app has admin permissions for everything on the device — this is what we need.
- Go back to «Settings -> Web Auto Reload -> Auto Reload on Idle» and set it to **300 seconds**
- Now go to «Settings -> Kiosk Mode (PLUS)» and click «Enable Kiosk Mode». Now you can set «Kiosk Exit Gesture» which is the last one — «Double tap top left and bottom right corner». Now set «Kiosk Exit PIN» to something you remember.
- Go back to Settings main screen. If you see a warning about «For a better status bar and power button protection click here…» on top of the screen — tap it and it will redirect you to Accessibility Settings of your device. Scroll down to «Services -> Fully Kiosk Browser» and turn the only slider on. This will add more protection against clicking home button etc. Go back to the app.
- Swipe from left and click «Goto Start URL»
- Tablet will show you a popup about more permissions required. Press "Allow" and it will take you through a cycle of screens, on EVERY one of which you either have to press "OK" or select «Fully Kiosk» from the list of apps and activate the slider.
- If all went well — it will show another warning that the application enters Kiosk Mode in 5 seconds and the YES button.
- Done, you’re beautiful

## 4. Connect your new device to HQ app

- Log in to HQ app as admin on your personal device
- Scan the QR code you see on the tablet screen with your device
- If you're an admin, it will redirect you to a special page to "link" this tablet to one of the meeting rooms you have
- Select meeting room you want to attach this tablet to
- In couple of seconds the table should show you a booking screen
