import os
import json
import zipfile
import shutil

ZIP_PATH = r"C:\Users\3716s\Downloads\Fabric Defect Inspection through AI.coco.zip"
OUTPUT_DIR = r"d:\Wabric\ai-cloth-inspector\yolo_dataset"

def convert_coco_to_yolo():
    if not os.path.exists(ZIP_PATH):
        print(f"Error: Zip file not found at {ZIP_PATH}")
        return

    print("Extracting and converting COCO dataset to YOLO format...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    splits = [
        ('train', 'train/_annotations.coco.json'),
        ('valid', 'valid/_annotations.coco.json'),
        ('test', 'test/_annotations.coco.json')
    ]

    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        for split_name, ann_path in splits:
            if ann_path not in z.namelist():
                continue

            yolo_split_name = 'val' if split_name == 'valid' else split_name
            images_dir = os.path.join(OUTPUT_DIR, yolo_split_name, 'images')
            labels_dir = os.path.join(OUTPUT_DIR, yolo_split_name, 'labels')
            os.makedirs(images_dir, exist_ok=True)
            os.makedirs(labels_dir, exist_ok=True)

            with z.open(ann_path) as f:
                data = json.load(f)

            images = {img['id']: img for img in data.get('images', [])}
            annotations = data.get('annotations', [])

            img_anns = {}
            for ann in annotations:
                img_anns.setdefault(ann['image_id'], []).append(ann)

            for img_id, img_info in images.items():
                fn = img_info['file_name']
                w, h = img_info['width'], img_info['height']
                zip_img_path = f"{split_name}/{fn}"

                # Extract image
                with open(os.path.join(images_dir, fn), 'wb') as img_out:
                    img_out.write(z.read(zip_img_path))

                # Write YOLO label file (.txt)
                txt_name = os.path.splitext(fn)[0] + '.txt'
                txt_path = os.path.join(labels_dir, txt_name)
                
                lines = []
                for ann in img_anns.get(img_id, []):
                    bbox = ann['bbox'] # [x, y, w, h] in pixels
                    # YOLO normalized coordinates: class_id, x_center, y_center, width, height
                    x_center = (bbox[0] + bbox[2] / 2.0) / w
                    y_center = (bbox[1] + bbox[3] / 2.0) / h
                    bw = bbox[2] / w
                    bh = bbox[3] / h
                    class_id = 0 # 0 for fabric-defects
                    lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {bw:.6f} {bh:.6f}")

                with open(txt_path, 'w', encoding='utf-8') as label_out:
                    label_out.write('\n'.join(lines))

    # Create data.yaml
    yaml_content = f"""path: {os.path.abspath(OUTPUT_DIR)}
train: train/images
val: val/images
test: test/images

names:
  0: fabric-defect
"""
    with open(os.path.join(OUTPUT_DIR, 'data.yaml'), 'w', encoding='utf-8') as yf:
        yf.write(yaml_content)

    print("\n=== CONVERSION COMPLETE ===")
    print(f"YOLO Dataset ready at: {os.path.abspath(OUTPUT_DIR)}")
    print("To train with Ultralytics YOLOv8, run:")
    print(f"  pip install ultralytics")
    print(f"  yolo detect train data=\"{os.path.join(OUTPUT_DIR, 'data.yaml')}\" model=yolov8n.pt epochs=50 imgsz=640")

if __name__ == "__main__":
    convert_coco_to_yolo()
