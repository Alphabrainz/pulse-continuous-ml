import os
import sys
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

def print_banner(text):
    print("\n" + "=" * 60)
    print(f" {text}")
    print("=" * 60)

def create_huggingface_repo(token: str, repo_name: str = "continuous-edge-model", private: bool = False):
    """Creates a model repository on Hugging Face Hub using the REST API."""
    print(f"\n[Hugging Face] Creating model repository: '{repo_name}'...")
    url = "https://huggingface.co/api/repos/create"
    payload = json.dumps({
        "name": repo_name,
        "type": "model",
        "private": private
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token.strip()}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            repo_url = data.get("url") or f"https://huggingface.co/{data.get('name')}"
            full_repo_id = data.get("name")
            print(f"✅ Hugging Face Model Repository created successfully!")
            print(f"   URL: {repo_url}")
            print(f"   Repo ID: {full_repo_id}")
            return full_repo_id, repo_url
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 409:
            print(f"ℹ️  Repository '{repo_name}' already exists on Hugging Face.")
            # Get user identity from whoami
            whoami_req = urllib.request.Request(
                "https://huggingface.co/api/whoami-v2",
                headers={"Authorization": f"Bearer {token.strip()}"}
            )
            try:
                with urllib.request.urlopen(whoami_req) as wresp:
                    wdata = json.loads(wresp.read().decode("utf-8"))
                    username = wdata.get("name")
                    full_repo_id = f"{username}/{repo_name}"
                    print(f"   Existing Repo ID: {full_repo_id}")
                    return full_repo_id, f"https://huggingface.co/{full_repo_id}"
            except Exception:
                return repo_name, f"https://huggingface.co/{repo_name}"
        else:
            print(f"❌ Failed to create Hugging Face repo (HTTP {e.code}): {err_body}")
            return None, None
    except Exception as e:
        print(f"❌ Error connecting to Hugging Face: {e}")
        return None, None

def create_github_repo(token: str, repo_name: str = "pulse-continuous-ml", private: bool = False):
    """Creates a repository on GitHub using the REST API."""
    print(f"\n[GitHub] Creating code repository: '{repo_name}'...")
    url = "https://api.github.com/user/repos"
    payload = json.dumps({
        "name": repo_name,
        "description": "Continuous Learning ML Edge Pipeline with Firebase Firestore, GitHub Actions, and Hugging Face Hub",
        "private": private,
        "auto_init": False
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token.strip()}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "Pulse-Continuous-ML"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            html_url = data.get("html_url")
            clone_url = data.get("clone_url")
            full_name = data.get("full_name")
            print(f"✅ GitHub Repository created successfully!")
            print(f"   URL: {html_url}")
            print(f"   Clone URL: {clone_url}")
            return full_name, html_url, clone_url
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 422:
            print(f"ℹ️  Repository '{repo_name}' already exists on your GitHub account.")
            return repo_name, f"https://github.com/{repo_name}", None
        else:
            print(f"❌ Failed to create GitHub repo (HTTP {e.code}): {err_body}")
            return None, None, None
    except Exception as e:
        print(f"❌ Error connecting to GitHub: {e}")
        return None, None, None

def main():
    print_banner("Continuous Learning: Automatic Repository Creator")

    # 1. Hugging Face Model Repository
    hf_token = os.getenv("HF_TOKEN")
    hf_repo_name = os.getenv("HF_REPO_NAME", "continuous-edge-model")
    
    if not hf_token:
        print("\n[Hugging Face] HF_TOKEN not found in environment.")
        print("To create your free Hugging Face Model repository:")
        print("  1. Get a Write token at: https://huggingface.co/settings/tokens")
        print("  2. Or create the repo manually in 5 seconds at: https://huggingface.co/new?type=model")
        hf_token_input = input("\nEnter your Hugging Face Write Token (or press Enter to skip): ").strip()
        if hf_token_input:
            hf_token = hf_token_input

    if hf_token:
        hf_id, hf_url = create_huggingface_repo(hf_token, hf_repo_name)
    else:
        print("⏩ Skipped Hugging Face API creation.")

    # 2. GitHub Code Repository
    gh_token = os.getenv("GITHUB_TOKEN")
    gh_repo_name = os.getenv("GITHUB_REPO_NAME", "pulse-continuous-ml")

    if not gh_token:
        print("\n[GitHub] GITHUB_TOKEN not found in environment.")
        print("To create your GitHub repository automatically:")
        print("  1. Generate a token (with 'repo' scope) at: https://github.com/settings/tokens/new")
        print("  2. Or create the repository manually at: https://github.com/new")
        gh_token_input = input("\nEnter your GitHub Personal Access Token (or press Enter to skip): ").strip()
        if gh_token_input:
            gh_token = gh_token_input

    if gh_token:
        gh_full, gh_url, gh_clone = create_github_repo(gh_token, gh_repo_name)
    else:
        print("⏩ Skipped GitHub API creation.")

    print_banner("Repository Setup Summary")
    print("Next steps once created:")
    print("  1. Add repository secrets in GitHub: Settings -> Secrets and variables -> Actions")
    print("  2. Push code to your new GitHub repository.")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()

