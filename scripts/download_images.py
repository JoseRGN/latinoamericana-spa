import os
import re
import urllib.request
import concurrent.futures

os.makedirs('imagenes_productos', exist_ok=True)

with open('products.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all image URLs and IDs
pattern = r'id:\s*"([^"]+)",[\s\S]*?image:\s*"([^"]+)"'
matches = re.findall(pattern, content)

def download_image(match):
    id_val, url_val = match
    if "pollinations.ai" in url_val:
        filename = f'imagenes_productos/{id_val}.jpg'
        try:
            req = urllib.request.Request(url_val, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(filename, 'wb') as out_file:
                data = response.read()
                out_file.write(data)
            print(f"Downloaded {filename}")
        except Exception as e:
            print(f"Failed {filename}: {e}")

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    executor.map(download_image, matches)

# Now replace the URLs in products.js
for match in matches:
    id_val, url_val = match
    if "pollinations.ai" in url_val:
        local_path = f"imagenes_productos/{id_val}.jpg"
        content = content.replace(f'image: "{url_val}"', f'image: "{local_path}"')

with open('products.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating products.js")
