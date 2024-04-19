/*!
 * Native module created for Expo Share Intent (https://github.com/achorein/expo-share-intent)
 * author: achorein (https://github.com/achorein)
 * inspired by :
 *  - https://ajith-ab.github.io/react-native-receive-sharing-intent/docs/ios#create-share-extension
 */
import UIKit
import Social
import MobileCoreServices
import Photos

class ShareViewController: SLComposeServiceViewController {
  let hostAppBundleIdentifier = "<APPIDENTIFIER>"
  let shareProtocol = "<SCHEME>"
  let sharedKey = "<SCHEME>ShareKey"
  var sharedMedia: [SharedMediaFile] = []
  var sharedText: [String] = []
  let imageContentType = kUTTypeImage as String
  let videoContentType = kUTTypeMovie as String
  let textContentType = kUTTypeText as String
  let urlContentType = kUTTypeURL as String
  let fileURLType = kUTTypeFileURL as String;
  
  override func isContentValid() -> Bool {
    return true
  }
      
  override func viewDidLoad() {
    super.viewDidLoad();
  }
      
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    if let content = extensionContext!.inputItems[0] as? NSExtensionItem {
      if let contents = content.attachments {
        for (index, attachment) in (contents).enumerated() {
          if attachment.hasItemConformingToTypeIdentifier(imageContentType) {
            handleImages(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(textContentType) {
            handleText(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(fileURLType) {
            handleFiles(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(urlContentType) {
            handleUrl(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(videoContentType) {
            handleVideos(content: content, attachment: attachment, index: index)
          }
        }
      }
    }
  }
  
  private func handleText (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: textContentType, options: nil) { [weak self] data, error in
      
      if error == nil, let item = data as? String, let this = self {
        this.sharedText.append(item)
          
        // If this is the last item, save sharedText in userDefaults and redirect to host app
        if index == (content.attachments?.count)! - 1 {
          let userDefaults = UserDefaults(suiteName: "group.\(this.hostAppBundleIdentifier)")
          userDefaults?.set(this.sharedText, forKey: this.sharedKey)
          userDefaults?.synchronize()
          this.redirectToHostApp(type: .text)
        }
              
      } else {
        self?.dismissWithError(message: "Cannot load text content")
      }
    }
  }
              
  private func handleUrl (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: urlContentType, options: nil) { [weak self] data, error in

      if error == nil, let item = data as? URL, let this = self {
        this.sharedText.append(item.absoluteString)
        
        // If this is the last item, save sharedText in userDefaults and redirect to host app
        if index == (content.attachments?.count)! - 1 {
          let userDefaults = UserDefaults(suiteName: "group.\(this.hostAppBundleIdentifier)")
          userDefaults?.set(this.sharedText, forKey: this.sharedKey)
          userDefaults?.synchronize()
          this.redirectToHostApp(type: .weburl)
        }
      } else {
        self?.dismissWithError(message: "Cannot load url content")
      }

    }
  }
  
  private func handleImages (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: imageContentType, options: nil) { [weak self] data, error in

      if error == nil, let this = self {
        var url: URL? = nil
        if let dataURL = data as? URL { url = dataURL }
        else if let imageData = data as? UIImage { url = this.saveScreenshot(imageData) }

        var pixelWidth: Int? = nil
        var pixelHeight: Int? = nil
        if let imageSource = CGImageSourceCreateWithURL(url! as CFURL, nil) {
            if let imageProperties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as Dictionary? {
              pixelWidth = imageProperties[kCGImagePropertyPixelWidth] as? Int
              pixelHeight = imageProperties[kCGImagePropertyPixelHeight] as? Int
            }
        }

        // Always copy
        let fileName = this.getFileName(from :url!, type: .image)
        let fileExtension = this.getExtension(from: url!, type: .image)
        let fileSize = this.getFileSize(from: url!)
        let mimeType = url!.mimeType(ext: fileExtension)
        let newName = "\(UUID().uuidString).\(fileExtension)"
        let newPath = FileManager.default
          .containerURL(forSecurityApplicationGroupIdentifier: "group.\(this.hostAppBundleIdentifier)")!
          .appendingPathComponent(newName)
        let copied = this.copyFile(at: url!, to: newPath)
        if(copied) {
          this.sharedMedia.append(SharedMediaFile(path: newPath.absoluteString, thumbnail: nil, fileName: fileName, fileSize: fileSize, width: pixelWidth, height: pixelHeight,  duration: nil, mimeType: mimeType, type: .image))
        }
  
        // If this is the last item, save imagesData in userDefaults and redirect to host app
        if index == (content.attachments?.count)! - 1 {
          let userDefaults = UserDefaults(suiteName: "group.\(this.hostAppBundleIdentifier)")
          userDefaults?.set(this.toData(data: this.sharedMedia), forKey: this.sharedKey)
          userDefaults?.synchronize()
          this.redirectToHostApp(type: .media)
        }
        
      } else {
        self?.dismissWithError(message: "Cannot load image content")
      }
    }
  }
  
  private func documentDirectoryPath () -> URL?  {
    let path = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
    return path.first
  }

  private func saveScreenshot(_ image: UIImage) -> URL? {
    var screenshotURL: URL? = nil
    if let screenshotData = image.pngData(), let screenshotPath = documentDirectoryPath()?.appendingPathComponent("screenshot.png") {
      try? screenshotData.write(to: screenshotPath)
      screenshotURL = screenshotPath
    }
    return screenshotURL
  }

  private func handleVideos (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: videoContentType, options:nil) { [weak self] data, error in
      
      if error == nil, let url = data as? URL, let this = self {
        
        // Always copy
        let fileName = this.getFileName(from :url, type: .video)
        let fileExtension = this.getExtension(from: url, type: .video)
        let fileSize = this.getFileSize(from: url)
        let mimeType = url.mimeType(ext: fileExtension)
        let newName = "\(UUID().uuidString).\(fileExtension)"
        let newPath = FileManager.default
          .containerURL(forSecurityApplicationGroupIdentifier: "group.\(this.hostAppBundleIdentifier)")!
          .appendingPathComponent(newName)
        let copied = this.copyFile(at: url, to: newPath)
        if(copied) {
          guard let sharedFile = this.getSharedMediaFile(forVideo: newPath, fileName: fileName, fileSize: fileSize, mimeType: mimeType) else {
            return
          }
          this.sharedMedia.append(sharedFile)
        }
  
        // If this is the last item, save imagesData in userDefaults and redirect to host app
        if index == (content.attachments?.count)! - 1 {
          let userDefaults = UserDefaults(suiteName: "group.\(this.hostAppBundleIdentifier)")
          userDefaults?.set(this.toData(data: this.sharedMedia), forKey: this.sharedKey)
          userDefaults?.synchronize()
          this.redirectToHostApp(type: .media)
        }
        
      } else {
        self?.dismissWithError(message: "Cannot load video content")
      }
    }
  }
  
  private func handleFiles (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: fileURLType, options: nil) { [weak self] data, error in

      if error == nil, let url = data as? URL, let this = self {
        // Always copy
        let fileName = this.getFileName(from :url, type: .file)
        let fileExtension = this.getExtension(from: url, type: .file)
        let fileSize = this.getFileSize(from: url)
        let mimeType = url.mimeType(ext: fileExtension)
        let newName = "\(UUID().uuidString).\(fileExtension)"
        let newPath = FileManager.default
          .containerURL(forSecurityApplicationGroupIdentifier: "group.\(this.hostAppBundleIdentifier)")!
          .appendingPathComponent(newName)
        let copied = this.copyFile(at: url, to: newPath)
        if (copied) {
          this.sharedMedia.append(SharedMediaFile(path: newPath.absoluteString, thumbnail: nil, fileName: fileName, fileSize: fileSize, width: nil, height: nil, duration: nil, mimeType: mimeType, type: .file))
        }
        
        if index == (content.attachments?.count)! - 1 {
          let userDefaults = UserDefaults(suiteName: "group.\(this.hostAppBundleIdentifier)")
          userDefaults?.set(this.toData(data: this.sharedMedia), forKey: this.sharedKey)
          userDefaults?.synchronize()
          this.redirectToHostApp(type: .file)
        }
        
      } else {
        self?.dismissWithError(message: "Cannot load file content")
      }
    }
  }
  
  private func dismissWithError(message: String? = nil) {
    DispatchQueue.main.async {
      NSLog("[ERROR] Error loading application ! \(message!)")
      let alert = UIAlertController(title: "Error", message: "Error loading application: \(message!)", preferredStyle: .alert)
    
      let action = UIAlertAction(title: "OK", style: .cancel) { _ in
        self.dismiss(animated: true, completion: nil)
        self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
      }
      
      alert.addAction(action)
      self.present(alert, animated: true, completion: nil)
    }
  }
  
  private func redirectToHostApp(type: RedirectType) {
    let url = URL(string: "\(shareProtocol)://dataUrl=\(sharedKey)#\(type)")!
    var responder = self as UIResponder?
    let selectorOpenURL = sel_registerName("openURL:")
  
    while (responder != nil) {
      if let application = responder as? UIApplication {
        if (application.canOpenURL(url)){
          application.perform(selectorOpenURL, with: url)
        } else {
          NSLog("redirectToHostApp canOpenURL KO: \(shareProtocol)")
          self.dismissWithError(message: "Application not found, invalid url scheme \(shareProtocol)")
          return
        }
      }
      responder = responder!.next
    }
    extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
  }
  
  enum RedirectType {
    case media
    case text
    case weburl
    case file
  }
  
  func getExtension(from url: URL, type: SharedMediaType) -> String {
    let parts = url.lastPathComponent.components(separatedBy: ".")
    var ex: String? = nil
    if (parts.count > 1) {
      ex = parts.last
    }
    if (ex == nil) {
      switch type {
      case .image:
        ex = "PNG"
      case .video:
        ex = "MP4"
      case .file:
        ex = "TXT"
      }
    }
    return ex ?? "Unknown"
  }
  
  func getFileName(from url: URL, type: SharedMediaType) -> String {
    var name = url.lastPathComponent
    if (name == "") {
      name = UUID().uuidString + "." + getExtension(from: url, type: type)
    }
    return name
  }
  
  func getFileSize(from url: URL) -> Int? {
    do {
      let resources = try url.resourceValues(forKeys:[.fileSizeKey])
      return resources.fileSize
    } catch {
      NSLog("Error: \(error)")
      return nil
    }
  }
  
  func copyFile(at srcURL: URL, to dstURL: URL) -> Bool {
    do {
      if FileManager.default.fileExists(atPath: dstURL.path) {
        try FileManager.default.removeItem(at: dstURL)
      }
      try FileManager.default.copyItem(at: srcURL, to: dstURL)
    } catch (let error) {
      NSLog("Cannot copy item at \(srcURL) to \(dstURL): \(error)")
      return false
    }
    return true
  }
  
  private func getSharedMediaFile(forVideo: URL, fileName: String, fileSize: Int?, mimeType: String) -> SharedMediaFile? {
    let asset = AVAsset(url: forVideo)
    let duration = (CMTimeGetSeconds(asset.duration) * 1000).rounded()
    let thumbnailPath = getThumbnailPath(for: forVideo)
    
    
    if FileManager.default.fileExists(atPath: thumbnailPath.path) {
      return SharedMediaFile(path: forVideo.absoluteString, thumbnail: thumbnailPath.absoluteString, fileName: fileName, fileSize: fileSize, width: nil, height: nil, duration: duration, mimeType: mimeType, type: .video)
    }
    
    var saved = false
    let assetImgGenerate = AVAssetImageGenerator(asset: asset)
    assetImgGenerate.appliesPreferredTrackTransform = true
    assetImgGenerate.maximumSize =  CGSize(width: 360, height: 360)
    do {
      let img = try assetImgGenerate.copyCGImage(at: CMTimeMakeWithSeconds(600, preferredTimescale: Int32(1.0)), actualTime: nil)
      try UIImage.pngData(UIImage(cgImage: img))()?.write(to: thumbnailPath)
      saved = true
    } catch {
      saved = false
    }
    
    return saved ? SharedMediaFile(path: forVideo.absoluteString, thumbnail: thumbnailPath.absoluteString, fileName: fileName, fileSize: fileSize, width: nil, height: nil, duration: duration, mimeType: mimeType, type: .video) : nil
  }
  
  private func getThumbnailPath(for url: URL) -> URL {
    let fileName = Data(url.lastPathComponent.utf8).base64EncodedString().replacingOccurrences(of: "==", with: "")
    let path = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: "group.\(hostAppBundleIdentifier)")!
      .appendingPathComponent("\(fileName).jpg")
    return path
  }
  
  class SharedMediaFile: Codable {
    var path: String; // can be image, video or url path
    var thumbnail: String?; // video thumbnail
    var fileName: String; // uuid + extension
    var fileSize: Int?;
    var width: Int?; // for image
    var height: Int?; // for image
    var duration: Double?; // video duration in milliseconds
    var mimeType: String;
    var type: SharedMediaType;
    
    init(path: String, thumbnail: String?, fileName: String, fileSize: Int?, width: Int?, height: Int?, duration: Double?, mimeType: String, type: SharedMediaType) {
      self.path = path
      self.thumbnail = thumbnail
      self.fileName = fileName
      self.fileSize = fileSize
      self.width = width
      self.height = height
      self.duration = duration
      self.mimeType = mimeType
      self.type = type
    }
  }
  
  enum SharedMediaType: Int, Codable {
    case image
    case video
    case file
  }
  
  func toData(data: [SharedMediaFile]) -> Data {
    let encodedData = try? JSONEncoder().encode(data)
    return encodedData!
  }
}

internal let mimeTypes = [
    "html": "text/html",
    "htm": "text/html",
    "shtml": "text/html",
    "css": "text/css",
    "xml": "text/xml",
    "gif": "image/gif",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "application/javascript",
    "atom": "application/atom+xml",
    "rss": "application/rss+xml",
    "mml": "text/mathml",
    "txt": "text/plain",
    "jad": "text/vnd.sun.j2me.app-descriptor",
    "wml": "text/vnd.wap.wml",
    "htc": "text/x-component",
    "png": "image/png",
    "tif": "image/tiff",
    "tiff": "image/tiff",
    "wbmp": "image/vnd.wap.wbmp",
    "ico": "image/x-icon",
    "jng": "image/x-jng",
    "bmp": "image/x-ms-bmp",
    "svg": "image/svg+xml",
    "svgz": "image/svg+xml",
    "webp": "image/webp",
    "woff": "application/font-woff",
    "jar": "application/java-archive",
    "war": "application/java-archive",
    "ear": "application/java-archive",
    "json": "application/json",
    "hqx": "application/mac-binhex40",
    "doc": "application/msword",
    "pdf": "application/pdf",
    "ps": "application/postscript",
    "eps": "application/postscript",
    "ai": "application/postscript",
    "rtf": "application/rtf",
    "m3u8": "application/vnd.apple.mpegurl",
    "xls": "application/vnd.ms-excel",
    "eot": "application/vnd.ms-fontobject",
    "ppt": "application/vnd.ms-powerpoint",
    "wmlc": "application/vnd.wap.wmlc",
    "kml": "application/vnd.google-earth.kml+xml",
    "kmz": "application/vnd.google-earth.kmz",
    "7z": "application/x-7z-compressed",
    "cco": "application/x-cocoa",
    "jardiff": "application/x-java-archive-diff",
    "jnlp": "application/x-java-jnlp-file",
    "run": "application/x-makeself",
    "pl": "application/x-perl",
    "pm": "application/x-perl",
    "prc": "application/x-pilot",
    "pdb": "application/x-pilot",
    "rar": "application/x-rar-compressed",
    "rpm": "application/x-redhat-package-manager",
    "sea": "application/x-sea",
    "swf": "application/x-shockwave-flash",
    "sit": "application/x-stuffit",
    "tcl": "application/x-tcl",
    "tk": "application/x-tcl",
    "der": "application/x-x509-ca-cert",
    "pem": "application/x-x509-ca-cert",
    "crt": "application/x-x509-ca-cert",
    "xpi": "application/x-xpinstall",
    "xhtml": "application/xhtml+xml",
    "xspf": "application/xspf+xml",
    "zip": "application/zip",
    "epub": "application/epub+zip",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "mid": "audio/midi",
    "midi": "audio/midi",
    "kar": "audio/midi",
    "mp3": "audio/mpeg",
    "ogg": "audio/ogg",
    "m4a": "audio/x-m4a",
    "ra": "audio/x-realaudio",
    "3gpp": "video/3gpp",
    "3gp": "video/3gpp",
    "ts": "video/mp2t",
    "mp4": "video/mp4",
    "mpeg": "video/mpeg",
    "mpg": "video/mpeg",
    "mov": "video/quicktime",
    "webm": "video/webm",
    "flv": "video/x-flv",
    "m4v": "video/x-m4v",
    "mng": "video/x-mng",
    "asx": "video/x-ms-asf",
    "asf": "video/x-ms-asf",
    "wmv": "video/x-ms-wmv",
    "avi": "video/x-msvideo"
]

extension URL {
  func mimeType(ext: String?) -> String {
    if #available(iOSApplicationExtension 14.0, *) {
      if let pathExt = ext,
        let mimeType = UTType(filenameExtension: pathExt)?.preferredMIMEType {
        return mimeType
      } else {
        return "application/octet-stream"
      }
    } else {
      return mimeTypes[ext?.lowercased() ?? "" ] ?? "application/octet-stream"
    }
  }
}

extension Array {
  subscript (safe index: UInt) -> Element? {
    return Int(index) < count ? self[Int(index)] : nil
  }
}
