package expo.modules.shareintent

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.ShortcutManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener


class ExpoShareIntentReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {

    override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
        // only store when the intent is not empty AND this is a fresh launch. On a system
        // recreation (process killed with the task retained under launchMode=singleTask)
        // the original task-root share intent is re-supplied, and capturing it again would
        // re-deliver an already-consumed share on every reopen. Recreation is detected via
        // onActivityPreCreated (see ExpoShareIntentApplicationLifecycleListener) — the
        // savedInstanceState parameter here is always null in RN/Expo apps and can't be used.
        if (!ExpoShareIntentSingleton.isRecreation && activity?.intent?.type != null) {
            ExpoShareIntentSingleton.intent = activity.intent
            ExpoShareIntentSingleton.isPending = true
        }
    }
}