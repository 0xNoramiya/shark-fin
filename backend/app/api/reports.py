"""Auto-generated regulatory report endpoint (OJK format)."""

from __future__ import annotations

import uuid
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.threat import Threat

router = APIRouter(prefix="/threats", tags=["reports"])

_SEV_ID = {
    "CRITICAL": "KRITIS",
    "HIGH": "TINGGI",
    "MEDIUM": "SEDANG",
    "LOW": "RENDAH",
}

_STATUS_ID = {
    "NEW": "Baru",
    "VERIFIED": "Terverifikasi",
    "MITIGATED": "Sudah Dimitigasi",
    "FALSE_POSITIVE": "Positif Palsu",
}

_SRC_ID = {
    "TELEGRAM": "Telegram (kanal publik)",
    "PASTE": "Paste site (Pastebin/Rentry)",
    "GITHUB": "Repositori GitHub publik",
    "HIBP": "HaveIBeenPwned",
}

_BULAN = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

_ENTITY_LABEL = {
    "CREDIT_CARD": "Nomor Kartu Kredit",
    "NIK": "Nomor Induk Kependudukan (NIK)",
    "NPWP": "Nomor Pokok Wajib Pajak (NPWP)",
    "CREDENTIAL": "Kredensial (username/password)",
    "ACCOUNT_NUMBER": "Nomor Rekening Bank",
    "CVV": "Kode CVV/CVC",
    "BANK_NAME": "Nama Lembaga Keuangan",
    "BANKING_KEYWORD": "Kata Kunci Perbankan",
}

_REKOMENDASI: dict[str, list[str]] = {
    "CREDIT_CARD": [
        "Segera blokir kartu-kartu yang teridentifikasi dan terbitkan kartu pengganti.",
        "Aktifkan monitoring transaksi real-time untuk BIN yang terdampak.",
        "Koordinasi dengan principal (Visa/Mastercard) untuk fraud alert pada BIN terkait.",
    ],
    "NIK": [
        "Laporkan ke Dukcapil untuk penandaan NIK yang terekspos.",
        "Tingkatkan verifikasi identitas (multi-factor) untuk pembukaan rekening baru menggunakan NIK terdampak.",
        "Notifikasi nasabah terkait potensi penyalahgunaan identitas.",
    ],
    "NPWP": [
        "Koordinasi dengan Direktorat Jenderal Pajak terkait NPWP yang terekspos.",
        "Pantau aktivitas perpajakan mencurigakan dari NPWP terdampak.",
        "Edukasi wajib pajak terkait potensi penipuan menggunakan data NPWP mereka.",
    ],
    "CREDENTIAL": [
        "Paksa reset password untuk seluruh akun yang teridentifikasi.",
        "Aktifkan two-factor authentication (2FA) wajib untuk akun terdampak.",
        "Lakukan analisis log akses untuk mendeteksi unauthorized login.",
    ],
    "ACCOUNT_NUMBER": [
        "Tingkatkan monitoring transaksi pada rekening yang terekspos.",
        "Hubungi nasabah terkait untuk verifikasi aktivitas terakhir.",
        "Pertimbangkan penggantian nomor rekening jika terdapat indikasi penyalahgunaan.",
    ],
    "CVV": [
        "Segera blokir kartu dengan CVV yang terekspos.",
        "Terbitkan kartu pengganti dengan nomor baru.",
        "Aktifkan 3D Secure untuk seluruh transaksi online pada kartu terdampak.",
    ],
}

_DEFAULT_REKOMENDASI = [
    "Lakukan investigasi lebih lanjut terhadap sumber kebocoran data.",
    "Tingkatkan pemantauan pada sumber-sumber OSINT terkait.",
    "Koordinasi dengan BSSN dan pihak berwenang untuk tindak lanjut.",
]


def _format_date_wib(dt) -> str:
    """Format datetime as 'DD Bulan YYYY HH:MM WIB' (UTC+7)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    wib = dt.utcoffset()
    from datetime import timedelta as td
    wib_dt = dt + td(hours=7)
    return (
        f"{wib_dt.day:02d} {_BULAN[wib_dt.month]} {wib_dt.year} "
        f"{wib_dt.hour:02d}:{wib_dt.minute:02d} WIB"
    )


def _build_summary(entities: list[dict], tags: list[str] | None, source_type: str) -> str:
    """Auto-generate a 2-sentence Bahasa Indonesia summary."""
    etypes = set()
    for e in entities:
        t = e.get("type", "")
        if t not in ("BANK_NAME", "BANKING_KEYWORD"):
            etypes.add(t)

    type_names = []
    for t in etypes:
        type_names.append(_ENTITY_LABEL.get(t, t).lower())

    if not type_names:
        type_names = ["data keuangan"]

    inst_str = ", ".join(tags) if tags else "lembaga keuangan Indonesia"
    src_str = _SRC_ID.get(source_type, source_type)
    data_str = ", ".join(type_names[:3])
    count = len(entities)

    s1 = (
        f"Terdeteksi kebocoran data berupa {data_str} "
        f"yang terkait dengan {inst_str} melalui {src_str}."
    )
    s2 = (
        f"Total {count} entitas sensitif teridentifikasi dalam insiden ini. "
        f"Diperlukan tindakan segera untuk mitigasi risiko terhadap nasabah dan lembaga terkait."
    )
    return f"{s1}\n{s2}"


def _build_entity_table(entities: list[dict]) -> str:
    """Build a text table of entity types and counts."""
    counts: dict[str, int] = {}
    for e in entities:
        t = e.get("type", "UNKNOWN")
        counts[t] = counts.get(t, 0) + 1

    lines = [f"{'Tipe Data':<35} {'Jumlah':>8}", "-" * 45]
    for t, c in sorted(counts.items()):
        label = _ENTITY_LABEL.get(t, t)
        lines.append(f"{label:<35} {c:>8}")
    lines.append("-" * 45)
    lines.append(f"{'TOTAL':<35} {sum(counts.values()):>8}")
    return "\n".join(lines)


def _build_rekomendasi(entities: list[dict]) -> str:
    """Pick 3 most relevant recommendations based on entity types."""
    etypes = set()
    for e in entities:
        t = e.get("type", "")
        if t in _REKOMENDASI:
            etypes.add(t)

    recs: list[str] = []
    for t in etypes:
        if len(recs) >= 3:
            break
        recs.append(_REKOMENDASI[t][0])

    while len(recs) < 3:
        for fallback in _DEFAULT_REKOMENDASI:
            if fallback not in recs:
                recs.append(fallback)
                break
            if len(recs) >= 3:
                break

    return "\n".join(f"  {i+1}. {r}" for i, r in enumerate(recs[:3]))


@router.get("/{threat_id}/report", response_class=PlainTextResponse)
async def generate_report(
    threat_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> str:
    """Generate OJK-format incident report for a threat."""
    threat = await session.get(Threat, threat_id)
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")

    entities = threat.detected_entities.get("entities", [])
    tags = threat.institution_tags or []
    nomor = f"SIAK-{str(threat.id)[:8].upper()}"

    report = f"""\
LAPORAN INSIDEN KEAMANAN SIBER
================================
Nomor Laporan  : {nomor}
Tanggal Deteksi: {_format_date_wib(threat.created_at)}
Tingkat Keparahan: {_SEV_ID.get(threat.severity.value, threat.severity.value)}
Status         : {_STATUS_ID.get(threat.status.value, threat.status.value)}
Skor Risiko    : {threat.risk_score}/100
Sumber         : {_SRC_ID.get(threat.source_type.value, threat.source_type.value)}
URL Sumber     : {threat.source_url or '-'}

RINGKASAN INSIDEN
-----------------
{_build_summary(entities, tags, threat.source_type.value)}

DATA YANG TEREKSPOS
-------------------
{_build_entity_table(entities)}

LEMBAGA TERKAIT
---------------
{', '.join(tags) if tags else '(Tidak teridentifikasi secara spesifik)'}

REKOMENDASI TINDAKAN
--------------------
{_build_rekomendasi(entities)}

================================
Laporan ini dibuat secara otomatis oleh SIAK-Fin
(Sistem Intelijen Ancaman Siber Keuangan).
Untuk informasi lebih lanjut hubungi tim SIAK-Fin.
"""
    return report
