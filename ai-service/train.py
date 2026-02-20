import os
import re
import json
import pickle
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import LinearSVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from sklearn.metrics.pairwise import cosine_similarity
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

DATASET_DIR = Path(
    os.environ.get(
        "DATASET_PATH", str(Path(__file__).parent.parent / "backend" / "dataset")
    )
)

# Category mapping from dataset tags / queue / subject keywords
CATEGORY_MAP = {
    "network": [
        "network",
        "connectivity",
        "vpn",
        "wifi",
        "internet",
        "connection",
        "router",
        "firewall",
        "bandwidth",
        "latency",
        "dns",
        "proxy",
        "ethernet",
        "lan",
        "wan",
        "ip",
        "tcp",
        "packet",
    ],
    "software": [
        "software",
        "application",
        "app",
        "crash",
        "bug",
        "install",
        "update",
        "upgrade",
        "patch",
        "license",
        "version",
        "error",
        "exception",
        "runtime",
        "saas",
        "platform",
    ],
    "hardware": [
        "hardware",
        "device",
        "printer",
        "laptop",
        "desktop",
        "keyboard",
        "mouse",
        "monitor",
        "screen",
        "battery",
        "power",
        "usb",
        "cable",
        "driver",
        "peripheral",
        "cpu",
        "ram",
        "disk",
        "storage",
        "ssd",
        "headset",
        "audio",
        "nas",
    ],
    "authentication": [
        "authentication",
        "login",
        "password",
        "account",
        "access",
        "sso",
        "mfa",
        "2fa",
        "token",
        "session",
        "locked",
        "credentials",
        "oauth",
        "ldap",
        "active directory",
        "permission",
        "unauthorized",
    ],
    "email": [
        "email",
        "mail",
        "outlook",
        "smtp",
        "imap",
        "inbox",
        "spam",
        "attachment",
        "calendar",
        "meeting",
        "exchange",
        "mailbox",
        "send",
        "receive",
    ],
    "database": [
        "database",
        "db",
        "sql",
        "query",
        "table",
        "record",
        "backup",
        "restore",
        "migration",
        "schema",
        "index",
        "replication",
        "mongodb",
        "postgres",
        "mysql",
    ],
    "security": [
        "security",
        "breach",
        "malware",
        "virus",
        "ransomware",
        "phishing",
        "vulnerability",
        "threat",
        "incident",
        "firewall",
        "encryption",
        "data breach",
        "compliance",
        "hipaa",
        "gdpr",
        "audit",
        "certificate",
        "ssl",
        "tls",
    ],
    "hr": [
        "hr",
        "human resources",
        "payroll",
        "leave",
        "attendance",
        "onboarding",
        "offboarding",
        "policy",
        "benefits",
        "employee",
        "hiring",
        "recruitment",
        "performance review",
    ],
}

PRIORITY_RULES = {
    "critical": [
        "server down",
        "production down",
        "data breach",
        "security incident",
        "ransomware",
        "complete outage",
        "system failure",
        "critical",
        "emergency",
        "p1",
        "unable to login",
        "all users affected",
        "data loss",
    ],
    "high": [
        "cannot access",
        "not working",
        "failure",
        "outage",
        "disruption",
        "high",
        "multiple users",
        "team affected",
        "service down",
        "urgent",
        "p2",
    ],
    "medium": [
        "slow",
        "intermittent",
        "sometimes",
        "occasionally",
        "medium",
        "moderate",
        "performance",
        "delay",
        "lagging",
        "degraded",
        "p3",
    ],
    "low": [
        "question",
        "how to",
        "information",
        "inquiry",
        "request",
        "low",
        "minor",
        "cosmetic",
        "enhancement",
        "future",
        "p4",
    ],
}

TEAM_MAP = {
    "network": "Network Team",
    "hardware": "IT Support",
    "software": "Software Team",
    "authentication": "Identity & Access Team",
    "email": "Email & Collaboration Team",
    "database": "Database Team",
    "security": "Security Operations",
    "hr": "HR Team",
    "other": "General IT Support",
}

SLA_HOURS = {
    "critical": 1,
    "high": 4,
    "medium": 24,
    "low": 72,
}

AI_SUGGESTIONS = {
    "network": [
        "Check network cable or WiFi connection status",
        "Restart your router/switch and wait 30 seconds",
        "Run 'ipconfig /all' and verify IP address assignment",
        "Test connectivity: ping 8.8.8.8 from command prompt",
        "Check if VPN is connected (if using remote access)",
        "Contact Network Team if issue persists beyond 15 minutes",
    ],
    "software": [
        "Restart the application and try again",
        "Clear application cache and temporary files",
        "Check for and install pending software updates",
        "Run the application as Administrator",
        "Reinstall the application if issue persists",
        "Check Event Viewer for application error logs",
    ],
    "hardware": [
        "Power cycle the device (full shutdown, wait 10 seconds, restart)",
        "Check all cable connections are secure",
        "Update device drivers from manufacturer website",
        "Run hardware diagnostics (Windows: mdsched, Dell: SupportAssist)",
        "Check Device Manager for any error flags",
        "Try device on another system to isolate the issue",
    ],
    "authentication": [
        "Try resetting your password via the self-service portal",
        "Clear browser cookies and cached credentials",
        "Check if Caps Lock is off before entering password",
        "Try incognito/private browsing mode",
        "Contact IT to unlock account if locked out (3+ failed attempts)",
        "Ensure MFA app has correct time synchronization",
    ],
    "email": [
        "Check spam/junk folder for missing emails",
        "Verify account storage is not full (check quota)",
        "Re-configure email account with correct server settings",
        "Disable add-ins/plugins temporarily",
        "Run Outlook in Safe Mode: outlook.exe /safe",
        "Repair Office installation via Control Panel",
    ],
    "database": [
        "Check database service status in Services panel",
        "Verify connection string and credentials",
        "Check disk space on database server",
        "Review database error logs for specific errors",
        "Test connection using database management tool",
        "Escalate to Database Team for server-side issues",
    ],
    "security": [
        "Immediately isolate affected system from network",
        "Do NOT shutdown the system (preserve forensic evidence)",
        "Document all visible symptoms with timestamps",
        "Alert Security Operations Center immediately",
        "Change all potentially compromised passwords",
        "Follow incident response procedure IR-001",
    ],
    "hr": [
        "Log in to HR portal at hr.company.com",
        "Check HR FAQ documentation for common queries",
        "Submit a formal request through the HR portal",
        "Contact your HR Business Partner directly",
        "Check your employee handbook for policy details",
        "Allow 2-3 business days for HR request processing",
    ],
    "other": [
        "Describe the issue in detail for faster resolution",
        "Include error messages, screenshots if available",
        "Note the time when the issue started",
        "Check if other users are experiencing the same issue",
        "Restart your workstation and try again",
        "Contact the helpdesk if the issue persists",
    ],
}


# ─────────────────────────────────────────────────────────────
# TEXT PREPROCESSING
# ─────────────────────────────────────────────────────────────
def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", " url ", text)
    text = re.sub(r"\S+@\S+", " email ", text)
    text = re.sub(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", " ipaddress ", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def map_category(row):
    """Map dataset columns to our 8 categories."""
    text = " ".join(
        [
            str(row.get("subject", "")),
            str(row.get("body", "")),
            str(row.get("queue", "")),
            str(row.get("tag_1", "")),
            str(row.get("tag_2", "")),
            str(row.get("tag_3", "")),
            str(row.get("tag_4", "")),
            str(row.get("tag_5", "")),
        ]
    ).lower()

    scores = {cat: 0 for cat in CATEGORY_MAP}
    for cat, keywords in CATEGORY_MAP.items():
        for kw in keywords:
            if kw in text:
                scores[cat] += 1

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "other"


def map_priority(row):
    """Map dataset priority to our 4-level priority."""
    raw = str(row.get("priority", "")).lower()
    if raw in ["critical", "high", "medium", "low"]:
        return raw
    if raw == "very high":
        return "critical"
    if raw in ["very low", "minimal"]:
        return "low"
    # Fallback: keyword scan on subject + body
    text = " ".join([str(row.get("subject", "")), str(row.get("body", ""))]).lower()
    for prio, keywords in PRIORITY_RULES.items():
        for kw in keywords:
            if kw in text:
                return prio
    return "medium"


# ─────────────────────────────────────────────────────────────
# LOAD & PREPARE DATASET
# ─────────────────────────────────────────────────────────────
def load_dataset():
    dfs = []
    csv_files = list(DATASET_DIR.glob("*.csv"))
    logger.info(f"Found {len(csv_files)} CSV files")

    for f in csv_files:
        try:
            df = pd.read_csv(f, encoding="utf-8", on_bad_lines="skip", low_memory=False)
            logger.info(f"  Loaded {f.name}: {len(df)} rows")
            dfs.append(df)
        except Exception as e:
            logger.warning(f"  Failed to load {f.name}: {e}")

    if not dfs:
        raise FileNotFoundError("No dataset files found")

    df = pd.concat(dfs, ignore_index=True)
    logger.info(f"Total rows: {len(df)}")

    # Build text feature
    df["text"] = (
        df.get("subject", pd.Series([""] * len(df))).fillna("").astype(str)
        + " "
        + df.get("body", pd.Series([""] * len(df))).fillna("").astype(str)
    )
    df["text"] = df["text"].apply(clean_text)

    # Map labels
    df["category"] = df.apply(map_category, axis=1)
    df["priority"] = df.apply(map_priority, axis=1)

    # Drop rows with empty text
    df = df[df["text"].str.len() > 10].copy()
    df = df.drop_duplicates(subset=["text"]).copy()

    logger.info(f"Clean rows: {len(df)}")
    logger.info(f"Category dist:\n{df['category'].value_counts()}")
    logger.info(f"Priority dist:\n{df['priority'].value_counts()}")

    return df


# ─────────────────────────────────────────────────────────────
# MODEL TRAINING
# ─────────────────────────────────────────────────────────────
def train_category_model(df):
    logger.info("Training category classifier...")
    X = df["text"]
    y = df["category"]

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    max_features=30000,
                    sublinear_tf=True,
                    min_df=2,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    C=5.0,
                    max_iter=1000,
                    class_weight="balanced",
                    solver="lbfgs",
                    multi_class="multinomial",
                ),
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.info(f"Category model accuracy: {acc:.3f}")
    logger.info(f"\n{classification_report(y_test, y_pred)}")

    return pipeline, acc


def train_priority_model(df):
    logger.info("Training priority classifier...")
    X = df["text"]
    y = df["priority"]

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    max_features=20000,
                    sublinear_tf=True,
                    min_df=2,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    C=3.0,
                    max_iter=1000,
                    class_weight="balanced",
                    solver="lbfgs",
                    multi_class="multinomial",
                ),
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.info(f"Priority model accuracy: {acc:.3f}")
    logger.info(f"\n{classification_report(y_test, y_pred)}")

    return pipeline, acc


def build_similarity_index(df):
    """Build TF-IDF matrix for similar ticket search."""
    logger.info("Building similarity index...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2), max_features=20000, sublinear_tf=True
    )
    matrix = vectorizer.fit_transform(df["text"])
    # Store limited samples to keep index small
    sample_df = df.sample(min(5000, len(df)), random_state=42).copy()
    sample_matrix = vectorizer.transform(sample_df["text"])
    return vectorizer, sample_matrix, sample_df


# ─────────────────────────────────────────────────────────────
# MAIN TRAINING ENTRY POINT
# ─────────────────────────────────────────────────────────────
def train_all():
    df = load_dataset()

    cat_model, cat_acc = train_category_model(df)
    prio_model, prio_acc = train_priority_model(df)
    sim_vectorizer, sim_matrix, sim_df = build_similarity_index(df)

    # Save models
    joblib.dump(cat_model, MODELS_DIR / "category_model.pkl")
    joblib.dump(prio_model, MODELS_DIR / "priority_model.pkl")
    joblib.dump(sim_vectorizer, MODELS_DIR / "sim_vectorizer.pkl")
    joblib.dump(sim_matrix, MODELS_DIR / "sim_matrix.pkl")

    # Save similarity dataset (subject + body + category + priority for lookup)
    sim_records = sim_df[["text", "category", "priority"]].copy()
    if "subject" in sim_df.columns:
        sim_records["subject"] = sim_df["subject"].fillna("").astype(str)
    if "answer" in sim_df.columns:
        sim_records["answer"] = sim_df["answer"].fillna("").astype(str)
    sim_records.to_json(
        MODELS_DIR / "sim_corpus.json", orient="records", force_ascii=False
    )

    # Save metadata
    meta = {
        "category_accuracy": float(cat_acc),
        "priority_accuracy": float(prio_acc),
        "categories": list(CATEGORY_MAP.keys()) + ["other"],
        "priorities": ["critical", "high", "medium", "low"],
        "sla_hours": SLA_HOURS,
        "team_map": TEAM_MAP,
        "corpus_size": len(sim_df),
        "total_training_rows": len(df),
    }
    with open(MODELS_DIR / "metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

    logger.info(f"All models saved to {MODELS_DIR}")
    return meta


if __name__ == "__main__":
    train_all()
