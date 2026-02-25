import sqlite3

db_path = 'db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create the missing many-to-many table
create_table_sql = """
CREATE TABLE IF NOT EXISTS referrals_referreraccount_specialties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referreraccount_id INTEGER NOT NULL,
    specialty_id INTEGER NOT NULL,
    FOREIGN KEY (referreraccount_id) REFERENCES referrals_referreraccount(id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES referrals_specialty(id) ON DELETE CASCADE,
    UNIQUE (referreraccount_id, specialty_id)
)
"""

try:
    cursor.execute(create_table_sql)
    conn.commit()
    print("✓ Created table: referrals_referreraccount_specialties")
    
    # Verify it was created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='referrals_referreraccount_specialties'")
    if cursor.fetchone():
        print("✓ Table verified successfully!")
    else:
        print("✗ Table creation failed")
        
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()

conn.close()
