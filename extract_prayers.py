import json
import os

source_path = 'prayer/prayer-database/2-beis-prayers/2-0rwa-()-birchot-hashachar.json'
target_dir = 'prayer/prayer-database/2-beis-prayers/birchot-hashachar'

with open(source_path, 'r') as f:
    data = json.load(f)

sub_prayers = data['2-0rwa']['sub-prayers']

for key, value in sub_prayers.items():
    value['prayer-id'] = key
    target_path = os.path.join(target_dir, f"{key}.json")
    with open(target_path, 'w') as f:
        json.dump(value, f, indent=2, ensure_ascii=False)
    print(f"Created {target_path}")
