path = r'SPMC\front-end\src\pages\Reports.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('Year Selector - Only show for Month filter')
print(repr(content[idx:idx+500]))
