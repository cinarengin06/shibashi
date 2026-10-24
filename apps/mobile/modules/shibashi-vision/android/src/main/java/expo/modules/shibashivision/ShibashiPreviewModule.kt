package expo.modules.shibashivision

import android.graphics.Bitmap
import android.net.Uri
import android.util.Base64
import android.view.View
import android.view.ViewGroup
import androidx.camera.view.PreviewView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import java.io.ByteArrayOutputStream
import java.io.File

class ShibashiPreviewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ShibashiPreview")

    AsyncFunction("captureFrame") { save: Boolean ->
      val activity = appContext.currentActivity ?: throw IllegalStateException("Kamera ekranı açık değil")
      val preview = findVisiblePreview(activity.window.decorView)
        ?: throw IllegalStateException("Kamera önizlemesi hazır değil")
      val original = preview.bitmap ?: throw IllegalStateException("Kamera karesi henüz hazır değil")
      val width = minOf(original.width, 480)
      val height = maxOf(1, original.height * width / original.width)
      val bitmap = if (width == original.width) original else Bitmap.createScaledBitmap(original, width, height, true)
      val bytes = ByteArrayOutputStream().use { stream ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 76, stream)
        stream.toByteArray()
      }
      if (bitmap !== original) bitmap.recycle()
      original.recycle()
      val result = mutableMapOf<String, Any>(
        "base64" to Base64.encodeToString(bytes, Base64.NO_WRAP),
        "width" to width,
        "height" to height
      )
      if (save) {
        val file = File(activity.cacheDir, "shibashi-posture-${System.currentTimeMillis()}.jpg")
        file.writeBytes(bytes)
        result["uri"] = Uri.fromFile(file).toString()
      }
      result
    }.runOnQueue(Queues.MAIN)
  }

  private fun findVisiblePreview(view: View): PreviewView? {
    if (view is PreviewView && view.isShown && view.width > 0 && view.height > 0) return view
    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        val match = findVisiblePreview(view.getChildAt(index))
        if (match != null) return match
      }
    }
    return null
  }
}
