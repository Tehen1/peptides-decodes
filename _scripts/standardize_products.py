import os

product_roots = ['products']
count = 0
for root_dir in product_roots:
    for root, dirs, files in os.walk(root_dir):
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            text = open(path, 'r', encoding='utf-8').read()
            if '/_shared/product.css' in text and '_shared/editorial.css' not in text:
                text = text.replace(
                    '<link rel="stylesheet" href="/_shared/product.css">',
                    '<link rel="stylesheet" href="/_shared/editorial.css">\n  <link rel="stylesheet" href="/_shared/product.css">'
                )
                count += 1
            open(path, 'w', encoding='utf-8').write(text)

print(f'Updated {count} product files')
