import sqlite3

db_path = 'db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()

print("Tables in database:")
for table in tables:
    print(f"  - {table[0]}")

# Check specifically for referrer-related tables
print("\nReferrer-related tables:")
referrer_tables = [t[0] for t in tables if 'referrer' in t[0].lower()]
for table in referrer_tables:
    print(f"  - {table}")

conn.close()
