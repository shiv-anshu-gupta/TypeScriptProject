/**
 * Expo config plugin: writes the Android layouts used by "banner" push notifications.
 *
 * The patched expo-notifications builder (patches/expo-notifications+0.32.17.patch) draws
 * `data.imageStyle === "banner"` pushes as an image strip with RemoteViews. RemoteViews
 * need real layout resources, and with no committed android/ folder they have to be
 * written at prebuild time. The builder looks the ids up by name at runtime, so the
 * names below must match the Kotlin patch; if they are missing it falls back to the
 * "picture" style.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

// Collapsed: one full-width strip in place of title/text.
const COLLAPSED = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content">

    <ImageView
        android:id="@+id/skirana_banner_image"
        android:layout_width="match_parent"
        android:layout_height="64dp"
        android:scaleType="centerCrop"
        android:importantForAccessibility="no" />
</FrameLayout>
`;

// Expanded: the same picture larger, keeping its own aspect up to 256dp tall.
const EXPANDED = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content">

    <ImageView
        android:id="@+id/skirana_banner_image"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:adjustViewBounds="true"
        android:maxHeight="256dp"
        android:scaleType="centerCrop"
        android:importantForAccessibility="no" />
</FrameLayout>
`;

// The layouts are only referenced by name (getIdentifier), so keep them from
// resource shrinking if it is ever turned on.
const KEEP = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@layout/skirana_notification_banner,@layout/skirana_notification_banner_big,@id/skirana_banner_image" />
`;

const FILES = {
  'layout/skirana_notification_banner.xml': COLLAPSED,
  'layout/skirana_notification_banner_big.xml': EXPANDED,
  'raw/skirana_notification_keep.xml': KEEP,
};

module.exports = function withNotificationBannerLayouts(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const resDir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      for (const [rel, xml] of Object.entries(FILES)) {
        const file = path.join(resDir, rel);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, xml);
      }
      return cfg;
    },
  ]);
};
