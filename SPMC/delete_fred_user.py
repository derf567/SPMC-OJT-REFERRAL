import os
import django
import sqlite3

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_project.settings')
django.setup()

# Direct SQL approach to avoid missing table issues
db_path = 'db.sqlite3'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Find the user ID
cursor.execute("SELECT id, username, first_name, last_name FROM auth_user WHERE username = 'Vardox'")
user = cursor.fetchone()

if user:
    user_id = user[0]
    print(f"Found user: ID={user_id}, Username={user[1]}, Name={user[2]} {user[3]}")
    
    # Delete related records first
    tables_to_clean = [
        ('referrals_referreraccount', 'user_id'),
        ('referrals_userprofile', 'user_id'),
        ('authtoken_token', 'user_id'),
    ]
    
    for table, column in tables_to_clean:
        try:
            cursor.execute(f"DELETE FROM {table} WHERE {column} = ?", (user_id,))
            deleted = cursor.rowcount
            if deleted > 0:
                print(f"Deleted {deleted} record(s) from {table}")
        except sqlite3.OperationalError as e:
            print(f"Note: Could not delete from {table}: {e}")
    
    # Finally delete the user
    cursor.execute("DELETE FROM auth_user WHERE id = ?", (user_id,))
    print(f"Deleted user 'Vardox' (Fred Marinay)")
    
    conn.commit()
    print("\nUser deleted successfully!")
else:
    print("User 'Vardox' not found")

conn.close()
