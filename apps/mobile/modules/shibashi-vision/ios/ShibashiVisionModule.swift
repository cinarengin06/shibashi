import ExpoModulesCore
import ImageIO
import UIKit
import Vision

public final class ShibashiVisionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ShibashiVision")

    Function("isAvailable") {
      if #available(iOS 17.0, *) {
        return true
      }
      return false
    }

    AsyncFunction("analyzeBase64") { (encodedImage: String) throws -> [String: Any] in
      guard #available(iOS 17.0, *) else {
        throw Vision3DUnavailableException()
      }
      return try self.analyze3DBodyPose(encodedImage)
    }.runOnQueue(.global(qos: .userInitiated))
  }

  @available(iOS 17.0, *)
  private func analyze3DBodyPose(_ encodedImage: String) throws -> [String: Any] {
    let payload = encodedImage.components(separatedBy: ",").last ?? encodedImage
    guard let data = Data(base64Encoded: payload),
          let image = UIImage(data: data),
          let cgImage = image.cgImage else {
      throw Vision3DImageException()
    }

    let request = VNDetectHumanBodyPose3DRequest()
    let handler = VNImageRequestHandler(
      cgImage: cgImage,
      orientation: image.cgImageOrientation,
      options: [:]
    )
    try handler.perform([request])

    guard let observation = request.results?.first else {
      throw Vision3DBodyNotFoundException()
    }

    let namedJoints: [(String, VNHumanBodyPose3DObservation.JointName)] = [
      ("top_head", .topHead),
      ("center_head", .centerHead),
      ("center_shoulder", .centerShoulder),
      ("left_shoulder", .leftShoulder),
      ("right_shoulder", .rightShoulder),
      ("left_elbow", .leftElbow),
      ("right_elbow", .rightElbow),
      ("left_wrist", .leftWrist),
      ("right_wrist", .rightWrist),
      ("spine", .spine),
      ("root", .root),
      ("left_hip", .leftHip),
      ("right_hip", .rightHip),
      ("left_knee", .leftKnee),
      ("right_knee", .rightKnee),
      ("left_ankle", .leftAnkle),
      ("right_ankle", .rightAnkle)
    ]

    let joints = try namedJoints.map { name, jointName -> [String: Any] in
      let imagePoint = try observation.pointInImage(jointName)
      let translation = try observation.cameraRelativePosition(jointName).columns.3
      return [
        "name": name,
        "x": Double(translation.x),
        "y": Double(translation.y),
        "z": Double(translation.z),
        "imageX": Double(imagePoint.x),
        "imageY": Double(imagePoint.y),
        "confidence": 1.0
      ]
    }

    return [
      "source": "apple-vision-3d",
      "jointCount": joints.count,
      "bodyHeightMeters": Double(observation.bodyHeight),
      "heightEstimation": observation.heightEstimation == .measured ? "measured" : "reference",
      "joints": joints
    ]
  }
}

private extension UIImage {
  var cgImageOrientation: CGImagePropertyOrientation {
    switch imageOrientation {
    case .up: return .up
    case .upMirrored: return .upMirrored
    case .down: return .down
    case .downMirrored: return .downMirrored
    case .left: return .left
    case .leftMirrored: return .leftMirrored
    case .right: return .right
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
  }
}

private final class Vision3DUnavailableException: Exception {
  override var reason: String {
    "Apple Vision 3D beden pozu iOS 17 veya daha yeni bir sürüm gerektiriyor."
  }
}

private final class Vision3DImageException: Exception {
  override var reason: String {
    "Apple Vision için geçerli bir kamera görüntüsü oluşturulamadı."
  }
}

private final class Vision3DBodyNotFoundException: Exception {
  override var reason: String {
    "Apple Vision karede belirgin bir tam beden bulamadı."
  }
}
