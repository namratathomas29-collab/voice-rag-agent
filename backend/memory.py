import sqlite3

conn = sqlite3.connect(
    "memory.db",
    check_same_thread=False
)

cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,
    message TEXT
)
""")

conn.commit()


def save_message(role, message):
    cursor.execute(
        "INSERT INTO memory(role, message) VALUES (?, ?)",
        (role, message)
    )
    conn.commit()


def get_memory(limit=10):
    cursor.execute(
        """
        SELECT role, message
        FROM memory
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = cursor.fetchall()

    rows.reverse()

    return [
        f"{role}: {message}"
        for role, message in rows
    ]
    
def clear_memory():
    cursor.execute(
        "DELETE FROM memory"
    )
    conn.commit()