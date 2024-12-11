//
//  ViewController.swift
//  ContextMenu
//
//  Created by Karthikeyan T on 15/03/2020.
//  Copyright © 2020 Karthikeyan T. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
    
    let carImage    = UIImage(named: "carImage.JPG")
    let copyIcon    = UIImage(named: "copyIcon.png")
    let shareIcon   = UIImage(named: "shareIcon.png")
    let removeIcon  = UIImage(named: "binIcon.png")
    let editIcon    = UIImage(named: "editIcon.png")
    
    @IBOutlet weak var someImageButton : UIButton! {
        didSet {
            someImageButton.setImage(carImage, for: .normal)
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        
        // Create a UIContextMenuInteraction with UIContextMenuInteractionDelegate
        let interaction = UIContextMenuInteraction(delegate: self)
        
        // Attach It to Our View
        someImageButton.addInteraction(interaction)
    }
}


extension ViewController : UIContextMenuInteractionDelegate {
    func contextMenuInteraction(_ interaction: UIContextMenuInteraction, configurationForMenuAtLocation location: CGPoint) -> UIContextMenuConfiguration? {
        
        return UIContextMenuConfiguration(identifier: "CarImage" as NSCopying,
                                          previewProvider: makeImagePreview, //pass nil, if custom preview not needed
                                          actionProvider: { _ in
                                            
                                            let hideImageAction = UIAction(title: "Hide the Image",
                                                                           identifier: nil,
                                                                           discoverabilityTitle: nil,
                                                                           handler: { _ in
                                                                            print("Hide Image Action")
                                            })
                                            
                                            let editMenu = self.makeEditMenu()
                                            return UIMenu(title: "Menu",
                                                          children: [editMenu, hideImageAction])
        })
    }
    
    func contextMenuInteraction(_ interaction: UIContextMenuInteraction,
                                willPerformPreviewActionForMenuWith configuration: UIContextMenuConfiguration,
                                animator: UIContextMenuInteractionCommitAnimating) {
        print("(configuration.identifier = \(configuration.identifier)")
    }
    
    func makeEditMenu() -> UIMenu {
        let editImageAction = UIAction(title: "Edit Image",
                                       image: editIcon,
                                       identifier: nil,
                                       attributes: .disabled) { _ in //.hidden - to hide the action
                                        print("Edit Image Action")
        }
        
        let copyAction = UIAction(title: "Copy",
                                  image: copyIcon,
                                  identifier: nil,
                                  state: .on) { _ in
                                    print("Copy Action")
        }
                
        let shareAction = UIAction(title: "Share",
                                   image: shareIcon,
                                   identifier: nil,
                                   discoverabilityTitle:"To share the iamge to any social media") { _ in
            print("Share Action")
        }
        
        let removeAction = UIAction(title: "Remove",
                                    image: self.removeIcon,
                                    identifier: nil,
                                    discoverabilityTitle: nil,
                                    attributes: .destructive, //disabled, destructive, hidden
                                    handler: { _ in
            print("Remove Action")
        })
        
        return UIMenu(title: "Edit",
                      image: editIcon,
                      options: [.displayInline], // [], .displayInline, .destructive
            children: [editImageAction, copyAction, shareAction, removeAction])
    }
    
    func makeImagePreview() -> UIViewController {
        let viewController = UIViewController()
        
        let imageView = UIImageView(image:carImage)
        imageView.contentMode = .scaleAspectFit
        viewController.view = imageView
        
        imageView.frame = CGRect(x: 0, y: 0, width: someImageButton.frame.size.width * 1.75, height: someImageButton.frame.size.height * 1.75)
        
        viewController.preferredContentSize = imageView.frame.size
        viewController.view.backgroundColor = .clear
        
        return viewController
    }
}

