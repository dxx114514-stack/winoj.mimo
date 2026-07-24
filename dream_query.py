import sqlite3
import json
import datetime

DB = r'C:\Users\dxx-asus\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

PROJECT_ID = '76c91987-ffef-48e2-a95c-dd32085b06d2'

# Find files modified via edit tool in ses_0881a7d29ffe
c.execute("""
    SELECT p.time_created, json_extract(p.data, '$.state.input.file_path') as fp
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE m.session_id = 'ses_0881a7d29ffe0j8Fs4QyjbsICN'
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'edit'
    ORDER BY p.time_created
""")

print("=== Files edited in ses_0881a7d29ffe ===")
files_edited = set()
for r in c.fetchall():
    fp = r[1]
    if fp:
        files_edited.add(fp)
        ts_str = datetime.datetime.fromtimestamp(r[0]/1000).strftime('%m-%d %H:%M') if r[0] else '?'
        print(f"  [{ts_str}] {fp}")

print(f"\nTotal unique files edited: {len(files_edited)}")
print()

# Now check the most recent session (ses_06e3c4443ffe) - this is the current dream session
# Check what was the last real work session before dream
c.execute("""
    SELECT id, title, time_created
    FROM session
    WHERE project_id = ?
      AND title NOT LIKE 'checkpoint-writer:%'
      AND title NOT LIKE 'Auto Dream%'
      AND title NOT LIKE 'Auto Distill%'
    ORDER BY time_created DESC
    LIMIT 5
""", (PROJECT_ID,))

print("=== Recent work sessions (excluding meta) ===")
for r in c.fetchall():
    ts_str = datetime.datetime.fromtimestamp(r[2]/1000).strftime('%Y-%m-%d %H:%M') if r[2] else '?'
    print(f"  {r[0]}  title={r[1]}  time={ts_str}")

# Check for any recent sessions with user messages containing new directives
# that we haven't consolidated
print()
c.execute("""
    SELECT json_extract(p.data, '$.text') as text, p.time_created, m.session_id
    FROM part p
    JOIN message m ON m.id = p.message_id
    JOIN session s ON s.id = m.session_id
    WHERE s.project_id = ?
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') IS NOT NULL
      AND length(json_extract(p.data, '$.text')) > 5
      AND json_extract(p.data, '$.text') NOT LIKE '<system-reminder>%'
      AND json_extract(p.data, '$.text') NOT LIKE 'Run one automatic%'
      AND json_extract(p.data, '$.text') NOT LIKE 'checkpoint-writer%'
    ORDER BY p.time_created DESC
    LIMIT 30
""", (PROJECT_ID,))

print("=== Recent user messages (non-system, non-checkpoint) ===")
for r in c.fetchall():
    ts_str = datetime.datetime.fromtimestamp(r[1]/1000).strftime('%Y-%m-%d %H:%M') if r[1] else '?'
    text = (r[0] or '')[:200].replace('\n', ' ')
    print(f"  [{ts_str}] {r[2]}: {text}")

conn.close()
