#!/usr/bin/env python3
"""
Fetches the custom social preview (og:image) for each repo in repos-config.json
via GitHub GraphQL API and writes the URLs into project-overrides.json.
"""

import json
import os
import sys
import urllib.request

REPOS_CONFIG = "assets/js/repos-config.json"
OVERRIDES_FILE = "assets/js/project-overrides.json"
GRAPHQL_URL = "https://api.github.com/graphql"


def fetch_og_images(token, repos):
    # Build a batched query using aliases
    aliases = []
    for i, (owner, repo) in enumerate(repos):
        aliases.append(
            f'r{i}: repository(owner: "{owner}", name: "{repo}") {{\n'
            f'    openGraphImageUrl\n'
            f'    usesCustomOpenGraphImage\n'
            f'  }}'
        )
    query = "{\n  " + "\n  ".join(aliases) + "\n}"

    payload = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        GRAPHQL_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def load_env(path=".env"):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())


def main():
    load_env()
    token = os.environ.get("GITHUB_TOKEN") or input("GitHub token: ").strip()
    if not token:
        print("No token provided.", file=sys.stderr)
        sys.exit(1)

    with open(REPOS_CONFIG) as f:
        repos_config = json.load(f)

    with open(OVERRIDES_FILE) as f:
        overrides = json.load(f)

    repos = [(r["owner"], r["repo"]) for r in repos_config]

    print(f"Fetching OG images for {len(repos)} repos...")
    result = fetch_og_images(token, repos)

    if "errors" in result:
        print("GraphQL errors:", result["errors"], file=sys.stderr)
        sys.exit(1)

    updated = 0
    for i, (owner, repo) in enumerate(repos):
        data = result.get("data", {}).get(f"r{i}")
        if not data:
            print(f"  {owner}/{repo}: no data returned")
            continue

        key = f"{owner}/{repo}"
        uses_custom = data.get("usesCustomOpenGraphImage", False)
        image_url = data.get("openGraphImageUrl")

        if key not in overrides:
            print(f"  {key}: not in overrides, skipping")
            continue

        if uses_custom:
            overrides[key]["image"] = image_url
            print(f"  {key}: set custom image")
            updated += 1
        else:
            overrides[key]["image"] = None
            print(f"  {key}: no custom image, kept null")

    with open(OVERRIDES_FILE, "w") as f:
        json.dump(overrides, f, indent=2)
        f.write("\n")

    print(f"\nDone. Updated {updated} custom images in {OVERRIDES_FILE}.")


if __name__ == "__main__":
    main()
