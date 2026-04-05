path = r'SPMC\front-end\src\pages\Reports.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the full Year Selector block for Month filter
idx = content.find('{/* Year Selector - Only show for Month filter */}')
end = content.find('\n              )}', idx) + len('\n              )}')
old = content[idx:end]
print("Old block:")
print(repr(old))

new = (
    "{/* Year + Month Selector - Only show for Month filter */}\n"
    "              {globalFilter === 'month' && (\n"
    "                <>\n"
    "                  <select\n"
    "                    value={globalYear}\n"
    "                    onChange={(e) => setGlobalYear(Number(e.target.value))}\n"
    "                    className=\"px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white\"\n"
    "                  >\n"
    "                    {availableYears.map(year => (\n"
    "                      <option key={year} value={year}>{year}</option>\n"
    "                    ))}\n"
    "                  </select>\n"
    "                  <select\n"
    "                    value={globalMonth}\n"
    "                    onChange={(e) => setGlobalMonth(Number(e.target.value))}\n"
    "                    className=\"px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white\"\n"
    "                  >\n"
    "                    <option value={0}>All Months</option>\n"
    "                    <option value={1}>January</option>\n"
    "                    <option value={2}>February</option>\n"
    "                    <option value={3}>March</option>\n"
    "                    <option value={4}>April</option>\n"
    "                    <option value={5}>May</option>\n"
    "                    <option value={6}>June</option>\n"
    "                    <option value={7}>July</option>\n"
    "                    <option value={8}>August</option>\n"
    "                    <option value={9}>September</option>\n"
    "                    <option value={10}>October</option>\n"
    "                    <option value={11}>November</option>\n"
    "                    <option value={12}>December</option>\n"
    "                  </select>\n"
    "                </>\n"
    "              )}"
)

content = content[:idx] + new + content[end:]
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("\nFixed month filter to show year + month dropdowns")
print("Done!")
