import os
import sys
import json
import zipfile
import base64
from io import BytesIO

OUTPUT_DATASET_FILE = r"d:\Wabric\ai-cloth-inspector\server\data\dataset.json"

CANDIDATE_PATHS = [
    r"C:\Users\3716s\Downloads\Fabric Defect Inspection through AI.coco\train.zip",
    r"C:\Users\3716s\Downloads\Fabric Defect Inspection through AI.coco.zip",
    r"C:\Users\3716s\Downloads\Fabric Defect Inspection through AI.coco\train",
    r"C:\Users\3716s\Downloads\Fabric Defect Inspection through AI.coco",
    r"C:\Users\3716s\Downloads\train.zip"
]

def find_target_source():
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        return sys.argv[1]
    for p in CANDIDATE_PATHS:
        if os.path.exists(p):
            return p
    return None

def process_coco_json_and_images(coco_data, image_loader_fn, source_label="train"):
    images = coco_data.get('images', [])
    annotations = coco_data.get('annotations', [])
    categories = {c['id']: c['name'] for c in coco_data.get('categories', [])}

    # Map image_id -> list of annotations
    img_ann_map = {}
    for ann in annotations:
        img_ann_map.setdefault(ann.get('image_id'), []).append(ann)

    new_samples = []
    total_annotations_count = 0

    for img in images:
        img_id = img['id']
        file_name = img.get('file_name', '')
        
        img_bytes = image_loader_fn(file_name)
        if not img_bytes:
            continue

        b64_str = base64.b64encode(img_bytes).decode('utf-8')
        mime = 'image/png' if file_name.lower().endswith('.png') else 'image/jpeg'
        data_url = f"data:{mime};base64,{b64_str}"

        w = img.get('width', 4096)
        h = img.get('height', 256)

        converted_annotations = []
        img_anns = img_ann_map.get(img_id, [])

        for idx, ann in enumerate(img_anns):
            bbox = ann.get('bbox', [0, 0, 0, 0])  # [x, y, width, height]
            cat_name = categories.get(ann.get('category_id'), 'Fabric Defects')
            clean_label = cat_name.replace('-', ' ').title()
            if not clean_label or clean_label.lower() == 'fabric-defects':
                clean_label = 'Fabric Defects'

            x_pct = max(0, min(100, round((bbox[0] / w) * 100, 2)))
            y_pct = max(0, min(100, round((bbox[1] / h) * 100, 2)))
            w_pct = max(0.1, min(100, round((bbox[2] / w) * 100, 2)))
            h_pct = max(0.1, min(100, round((bbox[3] / h) * 100, 2)))

            converted_annotations.append({
                "id": f"ann-{source_label}-{img_id}-{idx + 1}",
                "label": clean_label,
                "severity": "critical" if (bbox[2] * bbox[3] > 10000) else "moderate",
                "box": {
                    "x": x_pct,
                    "y": y_pct,
                    "width": w_pct,
                    "height": h_pct
                },
                "confidence": 0.95
            })

        sample_id = f"coco-{source_label}-{img_id}"
        sample_name = f"Fabric Inspection ({source_label.capitalize()}) #{img_id + 1}"

        new_samples.append({
            "id": sample_id,
            "name": sample_name,
            "fabricType": "Woven Textile",
            "createdAt": img.get('date_captured', '2026-10-08T00:00:00.000Z'),
            "thumbnail": data_url,
            "annotations": converted_annotations,
            "status": "Labelled" if len(converted_annotations) > 0 else "Un-Labelled"
        })

        total_annotations_count += len(converted_annotations)

    return new_samples, total_annotations_count

def import_from_zip(target_path):
    print(f"Reading ZIP file: {target_path}...")
    all_new_samples = []
    total_anns = 0

    with zipfile.ZipFile(target_path, 'r') as z:
        namelist = z.namelist()
        json_files = [n for n in namelist if n.endswith('.json') and not n.startswith('__MACOSX')]

        if not json_files:
            print("No JSON annotation files found in ZIP!")
            return [], 0

        # Build filename to zip path index for fast lookup
        name_map = {}
        for n in namelist:
            base = os.path.basename(n)
            if base:
                name_map[base] = n
                name_map[n] = n

        for json_path in json_files:
            split_label = "train"
            if "valid" in json_path:
                split_label = "valid"
            elif "test" in json_path:
                split_label = "test"

            print(f"Parsing annotations from {json_path} (Split: {split_label})...")
            with z.open(json_path) as jf:
                coco_data = json.load(jf)

            parent_dir = os.path.dirname(json_path)

            def zip_image_loader(fname):
                # Try parent_dir / fname
                candidate = f"{parent_dir}/{fname}".replace('\\', '/').lstrip('/')
                if candidate in namelist:
                    return z.read(candidate)
                # Try base name in map
                base = os.path.basename(fname)
                if base in name_map:
                    return z.read(name_map[base])
                # Direct fname
                if fname in namelist:
                    return z.read(fname)
                return None

            samples, anns_count = process_coco_json_and_images(coco_data, zip_image_loader, split_label)
            all_new_samples.extend(samples)
            total_anns += anns_count

    return all_new_samples, total_anns

def import_from_directory(target_path):
    print(f"Reading folder: {target_path}...")
    all_new_samples = []
    total_anns = 0

    # Search for json files recursively
    for root, _, files in os.walk(target_path):
        for f in files:
            if f.endswith('.json'):
                json_path = os.path.join(root, f)
                split_label = "train"
                if "valid" in json_path.lower():
                    split_label = "valid"
                elif "test" in json_path.lower():
                    split_label = "test"

                try:
                    with open(json_path, 'r', encoding='utf-8') as jf:
                        coco_data = json.load(jf)
                except Exception as e:
                    print(f"Could not read {json_path}: {e}")
                    continue

                if not isinstance(coco_data, dict) or 'images' not in coco_data:
                    continue

                def dir_image_loader(fname):
                    p1 = os.path.join(root, fname)
                    if os.path.exists(p1):
                        with open(p1, 'rb') as imf:
                            return imf.read()
                    base = os.path.basename(fname)
                    p2 = os.path.join(root, base)
                    if os.path.exists(p2):
                        with open(p2, 'rb') as imf:
                            return imf.read()
                    return None

                samples, anns_count = process_coco_json_and_images(coco_data, dir_image_loader, split_label)
                all_new_samples.extend(samples)
                total_anns += anns_count

    return all_new_samples, total_anns

def import_coco_dataset():
    target = find_target_source()
    if not target:
        print(f"Error: Could not locate dataset source in candidate paths: {CANDIDATE_PATHS}")
        return

    print(f"Importing dataset from: {target}")

    if os.path.isfile(target) and target.lower().endswith('.zip'):
        new_samples, total_anns = import_from_zip(target)
    elif os.path.isdir(target):
        new_samples, total_anns = import_from_directory(target)
    else:
        print(f"Error: Target {target} is neither a valid zip nor a folder.")
        return

    if not new_samples:
        print("Warning: No samples were extracted from source.")
        return

    # Load existing dataset if any
    existing_dataset = []
    if os.path.exists(OUTPUT_DATASET_FILE):
        try:
            with open(OUTPUT_DATASET_FILE, 'r', encoding='utf-8') as f:
                existing_dataset = json.load(f)
        except Exception as e:
            print(f"Warning: Could not read existing dataset: {e}")

    # Merge: keep non-coco samples and replace coco samples
    merged = [s for s in existing_dataset if not str(s.get('id', '')).startswith('coco-')]
    merged.extend(new_samples)

    # Save to dataset.json
    os.makedirs(os.path.dirname(OUTPUT_DATASET_FILE), exist_ok=True)
    with open(OUTPUT_DATASET_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2)

    print("\n=== IMPORT SUCCESSFUL ===")
    print(f"Source: {target}")
    print(f"Total Images Imported: {len(new_samples)}")
    print(f"Total Defect Bounding Boxes: {total_anns}")
    print(f"Total Dataset Size in Wabric: {len(merged)} samples")
    print(f"Saved to: {OUTPUT_DATASET_FILE}")

if __name__ == "__main__":
    import_coco_dataset()
