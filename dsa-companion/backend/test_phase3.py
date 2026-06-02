"""Quick end-to-end test for Phase 3."""
import requests, json, time

BASE = "http://localhost:8000"

# 1. Create session
r = requests.post(f"{BASE}/session/create")
session_id = r.json()["session_id"]
print(f"✅ Session created: {session_id}")

# 2. Submit attempt
payload = {
    "session_id": session_id,
    "problem": "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
    "attempt": "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []",
    "language": "python"
}
r = requests.post(f"{BASE}/chat/submit", json=payload)
data = r.json()
print(f"✅ Analysis: approach_direction={data.get('approach_direction')}, student_intent={data.get('student_intent')}")
assert data.get("approach_direction") in ("correct_path", "wrong_path", "partially_correct"), f"Unexpected: {data}"
assert data.get("student_intent"), "Missing student_intent"

# 3. Stream hint (Tier 1 - subtle)
print("--- Streaming Tier 1 hint ---")
r = requests.get(f"{BASE}/chat/hint", params={"session_id": session_id, "tier": 1}, stream=True)
hint_text = ""
for chunk in r.iter_content(chunk_size=None):
    if chunk:
        hint_text += chunk.decode()
print(f"✅ Tier 1 hint ({len(hint_text)} chars): {hint_text[:200]}...")
assert len(hint_text) > 10, "Hint too short"

# 4. Check goal
payload = {"session_id": session_id, "attempt": payload["attempt"], "language": "python", "problem": payload["problem"]}
r = requests.post(f"{BASE}/chat/check-goal", json=payload)
print(f"✅ Goal check: {r.json()}")

print("\n✅ All Phase 3 tests passed!")
