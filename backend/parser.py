import re
import uuid
from datetime import datetime
from io import BytesIO

from pypdf import PdfReader

MONTHS = {
    "JAN": 1,
    "FEB": 2,
    "MAR": 3,
    "APR": 4,
    "MAY": 5,
    "JUN": 6,
    "JUL": 7,
    "AUG": 8,
    "SEP": 9,
    "OCT": 10,
    "NOV": 11,
    "DEC": 12,
}

# Matches any Devanagari character. In this bill layout, every English label
# is immediately preceded by its Hindi equivalent, so "the next Devanagari
# character" reliably marks the start of the next field. This is what lets
# us cut a value out cleanly even though the PDF text extractor jams
# multiple table columns onto a single line.
DEVANAGARI = r"\u0900-\u097F"


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------


def normalize_text(raw: str) -> str:
    text = raw
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\t", " ")
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[\u200b-\u200d\ufeff]", "", text)
    text = re.sub(r"\s*:\s*", ": ", text)
    text = re.sub(r"\s+,", ",", text)
    text = re.sub(r"\s+\.", ".", text)
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines).strip()
    return text


def flatten(text: str) -> str:
    """Collapse newlines/whitespace to single spaces so a field whose value
    got line-wrapped by the PDF extractor can still be read as one string."""
    return re.sub(r"\s+", " ", text.replace("\n", " ")).strip()


def clean_number(value) -> float | None:
    """Pull the first numeric token out of a string, ignoring units like
    'kW' or stray characters. Returns None if nothing numeric is found."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.search(r"-?[\d,]*\.?\d+", str(value))
    if not match:
        return None
    cleaned = match.group(0).replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    match = re.search(r"(\d{2})-([A-Za-z]{3})-(\d{4})", str(value))
    if not match:
        return None
    day, mon, year = match.groups()
    month_num = MONTHS.get(mon.upper())
    if month_num is None:
        return None
    try:
        return datetime(int(year), month_num, int(day))
    except ValueError:
        return None


def parse_duration(raw: str | None):
    """'12-JUN-2003 To 03-JUL-2026' -> (start_dt, end_dt)"""
    if not raw:
        return None, None
    dates = re.findall(r"\d{2}-[A-Za-z]{3}-\d{4}", raw)
    if len(dates) >= 2:
        return parse_date(dates[0]), parse_date(dates[1])
    if len(dates) == 1:
        return parse_date(dates[0]), None
    return None, None


def first_match(text: str, pattern: str) -> str | None:
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else None


def section(text: str, start_marker: str, end_marker: str) -> str:
    start_idx = text.find(start_marker)
    if start_idx == -1:
        return ""
    end_idx = text.find(end_marker, start_idx + len(start_marker))
    if end_idx == -1:
        return text[start_idx:]
    return text[start_idx:end_idx].strip()


def loose_label(label: str) -> str:
    """Regex fragment for a label that tolerates the PDF text extractor's
    inconsistent spacing within Latin words -- e.g. 'Bill No' sometimes
    extracts as 'Bill N o' (stray space) and 'Bill Duration' sometimes
    extracts as 'BillDuration' (missing space). Stripping spaces from the
    label and re-joining every character with \\s* matches all of:
    'Bill No', 'Bill N o', 'BillNo'.
    """
    chars = [c for c in label if not c.isspace()]
    return r"\s*".join(re.escape(c) for c in chars)


def pick_flat(flat_text: str, label: str) -> str | None:
    """Read the value that follows an English label inside text that has
    already been flattened (newlines -> spaces). Stops at:
      - the next Devanagari label, or
      - the end of the string.
    Tolerates footnote markers / stray punctuation between the label and
    its colon, e.g. 'Billed Demand (Load)1 : 3.99 KW'.
    """
    pattern = (
        r"\b" + loose_label(label) + r"\b"
        r"[.\)\d\s]{0,10}:?\s*"
        r"(.+?)(?=[" + DEVANAGARI + r"]|$)"
    )
    match = re.search(pattern, flat_text, re.IGNORECASE)
    if not match:
        return None
    value = match.group(1).strip(" :.\t-")
    return value or None


def find_amount(text: str, label: str) -> float | None:
    """Find the rupee amount that belongs to a label on the SAME LINE
    (the '.' in the regex below deliberately does not match newlines, so
    this can't accidentally grab a number belonging to an unrelated field
    on the next line/row).

    Handles two messy realities of this bill's extracted text:
      - footnote markers glued to the label, e.g. 'FPPA Surcharge 12 -19.44'
        (the '12' is a footnote reference, not part of the amount)
      - parenthetical asides, e.g. 'Other Charges (As per Table 3) 1276.35'

    Strategy: first look for the nearest decimal number after the label
    (footnotes/parens don't have decimals, real amounts almost always do).
    Fall back to a bare 3+ digit integer for whole-rupee amounts like
    'Payable Amount 1717'.
    """
    base = r"\b" + loose_label(label) + r"\b"
    match = re.search(base + r".{0,40}?(-?[\d,]+\.\d+)", text, re.IGNORECASE)
    if not match:
        match = re.search(
            base + r".{0,40}?(-?\d{3,}(?:,\d{3})*)(?!\.\d)", text, re.IGNORECASE
        )
    return clean_number(match.group(1)) if match else None


# ---------------------------------------------------------------------------
# Section parsers
# ---------------------------------------------------------------------------


def parse_header(text: str) -> dict:
    raw_header = section(text, "Electricity Bill", "Table 1")
    header = flatten(raw_header)

    billing_start, billing_end = parse_duration(pick_flat(header, "Bill Duration"))

    return {
        "accountNumber": pick_flat(header, "Account No"),
        "billNumber": pick_flat(header, "Bill No"),
        "billMonth": pick_flat(header, "Bill Month"),
        "billDate": parse_date(pick_flat(header, "Bill Date")),
        "dueDate": parse_date(pick_flat(header, "Due Date")),
        "disconnectionDate": parse_date(pick_flat(header, "Disconnection Date")),
        "consumerName": pick_flat(header, "Name"),
        "fatherName": pick_flat(header, "Father / Husband Name"),
        "address": pick_flat(header, "Address"),
        "division": pick_flat(header, "Division"),
        "subdivision": pick_flat(header, "Subdivision"),
        "meterNumber": pick_flat(header, "Meter Number"),
        "category": pick_flat(header, "Category"),
        "connectionType": pick_flat(header, "Connection Type"),
        "connectionDate": parse_date(pick_flat(header, "Connection Date")),
        "supplyType": pick_flat(header, "Supply Type"),
        "powerFactor": clean_number(pick_flat(header, "Power Factor")),
        "sanctionedLoad": clean_number(pick_flat(header, "Sanction Load")),
        "billedDemand": clean_number(pick_flat(header, "Billed Demand (Load)")),
        "securityDeposit": clean_number(pick_flat(header, "Security Deposit")),
        "billingStart": billing_start,
        "billingEnd": billing_end,
    }


def parse_charges(text: str) -> dict:
    """Table 1: Bill Details"""
    c = section(text, "Table 1", "Table 2")
    previous_due = find_amount(c, "Arrear Amount")
    return {
        "energyCharges": find_amount(c, "Energy Charges"),
        "demandCharges": find_amount(c, "Demand Charges"),
        "minimumCharges": find_amount(c, "Minimum Charges"),
        "electricityDuty": find_amount(c, "Electricity Duty"),
        "excessDemandPenalty": find_amount(c, "Excess Demand Penalty"),
        "fppa": find_amount(c, "FPPA Surcharge"),
        "otherCharges": find_amount(c, "Other Charges"),
        "currentBill": find_amount(c, "Current Bill Amount"),
        "subsidy": find_amount(c, "Subsidy by Govt"),
        "previousDue": previous_due,
        # The schema doesn't have a distinct source for "arrears" vs
        # "previousDue" on this bill layout, so both track the same
        # Arrear Amount figure.
        "arrears": previous_due,
        "payableAmount": find_amount(c, "Payable Amount"),
    }


def parse_other_charges(text: str) -> dict:
    """Table 3: Details of Other Charges"""
    t3 = section(text, "Table 3", "Table 4")
    return {
        "credit": find_amount(t3, "Credit"),
        "debit": find_amount(t3, "Debit"),
        "rebate": find_amount(t3, "Rebate"),
        "meterCharges": find_amount(t3, "Meter Charges"),
        "dueSecurity": find_amount(t3, "Due Security"),
    }


def parse_meter(text: str) -> dict:
    """Table 7: Meter Reading Details.

    This bill is a net-metered (solar) connection, so it reports both
    import (KWH) and export (KWHE) readings rather than KVAH. We read
    whichever rows are present; each row looks like:
        <meter no> KWH <prev date> <prev time> <prev read>
                       <curr date> <curr time> <curr read> <diff> ...
    """
    m = flatten(section(text, "Table 7", "Complaint"))

    def read_row(unit: str):
        pattern = (
            r"\b" + unit + r"\b\s*"
            r"(\d{2}-[A-Za-z]{3}-\d{4})\s*(?:\d{1,2}:\s?\d{2})?\s*(\d+)\s*"
            r"(\d{2}-[A-Za-z]{3}-\d{4})\s*(?:\d{1,2}:\s?\d{2})?\s*(\d+)\s*"
            r"(\d+)"
        )
        row_match = re.search(pattern, m, re.IGNORECASE)
        if not row_match:
            return None, None, None
        prev_read = clean_number(row_match.group(2))
        curr_read = clean_number(row_match.group(4))
        diff = clean_number(row_match.group(5))
        return prev_read, curr_read, diff

    prev_kwh, curr_kwh, diff_kwh = read_row("KWH")
    prev_kwhe, curr_kwhe, diff_kwhe = read_row("KWHE")

    return {
        "previousReading": prev_kwh,
        "currentReading": curr_kwh,
        "consumption": diff_kwh,
        # This bill has no KVAH row (that's for demand-billed commercial
        # connections). For net-metered domestic bills like this one we
        # store the solar export (KWHE) readings in these columns instead.
        "previousKVAH": prev_kwhe,
        "currentKVAH": curr_kwhe,
        "kvaConsumption": diff_kwhe,
    }


def parse_solar(text: str) -> dict:
    return {
        "openingSolarBalance": clean_number(
            first_match(text, r"Opening Surplus Solar Units\s*([\d.]+)")
        ),
        "closingSolarBalance": clean_number(
            first_match(text, r"Closing Surplus Solar Units\s*([\d.]+)")
        ),
    }


def parse_payment(text: str) -> dict:
    """Table 5: Last Payment Details"""
    p = section(text, "Table 5", "Table 6")
    date_match = re.search(r"(\d{2}-[A-Za-z]{3}-\d{4})", p, re.IGNORECASE)
    amount_match = re.search(
        r"\d{2}-[A-Za-z]{3}-\d{4}\s+([\d,]+\.?\d*)", p, re.IGNORECASE
    )
    mode_match = re.search(
        r"payment via ([A-Za-z]+(?:\s+[A-Za-z]+)*)", p, re.IGNORECASE
    )
    receipt_match = re.search(r"(\d{8,})", p)
    return {
        "paymentDate": parse_date(date_match.group(1) if date_match else None),
        "paymentAmount": clean_number(amount_match.group(1) if amount_match else None),
        "paymentMode": mode_match.group(1).strip() if mode_match else None,
        "receiptNumber": receipt_match.group(1) if receipt_match else None,
    }


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def validate_bill(bill: dict) -> list[str]:
    errors: list[str] = []
    prev = bill.get("previousReading")
    curr = bill.get("currentReading")
    cons = bill.get("consumption")
    if prev is not None and curr is not None and cons is not None:
        if abs((curr - prev) - cons) > 0.02:
            errors.append("Consumption calculation mismatch")
    if not bill.get("accountNumber"):
        errors.append("Account number not found")
    if not bill.get("billNumber"):
        errors.append("Bill number not found")
    if not bill.get("billMonth"):
        errors.append("Bill month not found")
    if not bill.get("meterNumber"):
        errors.append("Meter number not found")
    if bill.get("currentBill") is None:
        errors.append("Current bill amount not found")
    if bill.get("payableAmount") is None:
        errors.append("Payable amount not found")
    return errors


# ---------------------------------------------------------------------------
# Top-level entry points
# ---------------------------------------------------------------------------


def parse_bill(text: str) -> dict:
    bill = {}
    bill.update(parse_header(text))
    bill.update(parse_charges(text))
    bill.update(parse_other_charges(text))
    bill.update(parse_meter(text))
    bill.update(parse_solar(text))
    bill.update(parse_payment(text))

    # Surplus solar exported this billing cycle (from the KWHE meter row).
    bill["solarExport"] = bill.get("kvaConsumption")

    bill["rawText"] = text
    bill["validationErrors"] = validate_bill(bill)
    if bill["validationErrors"]:
        print("Bill validation failed:")
        for err in bill["validationErrors"]:
            print(f"  - {err}")
    return bill


def make_bill_data(bill: dict) -> dict:
    data = {}
    for key in [
        "accountNumber",
        "billNumber",
        "consumerName",
        "fatherName",
        "address",
        "division",
        "subdivision",
        "category",
        "connectionType",
        "supplyType",
        "meterNumber",
        "billMonth",
    ]:
        data[key] = bill.get(key)

    for key in [
        "sanctionedLoad",
        "billedDemand",
        "securityDeposit",
        "previousReading",
        "currentReading",
        "consumption",
        "previousKVAH",
        "currentKVAH",
        "kvaConsumption",
        "powerFactor",
        "solarExport",
        "openingSolarBalance",
        "closingSolarBalance",
        "previousDue",
        "currentBill",
        "payableAmount",
        "energyCharges",
        "demandCharges",
        "electricityDuty",
        "fppa",
        "minimumCharges",
        "excessDemandPenalty",
        "otherCharges",
        "subsidy",
        "arrears",
        "credit",
        "debit",
        "rebate",
        "meterCharges",
        "dueSecurity",
        "paymentAmount",
    ]:
        data[key] = bill.get(key)

    for key in [
        "billDate",
        "dueDate",
        "disconnectionDate",
        "billingStart",
        "billingEnd",
        "connectionDate",
        "paymentDate",
    ]:
        val = bill.get(key)
        data[key] = parse_date(val) if isinstance(val, str) and val else val

    data["paymentMode"] = bill.get("paymentMode")
    data["receiptNumber"] = bill.get("receiptNumber")
    data["rawText"] = bill.get("rawText", "")
    data["accountNumber"] = data["accountNumber"] or ""
    data["billNumber"] = data["billNumber"] or str(uuid.uuid4())
    data["billMonth"] = data["billMonth"] or ""
    data["id"] = str(uuid.uuid4())[:24]
    now = datetime.utcnow()
    data["uploadedAt"] = now
    data["createdAt"] = now
    data["updatedAt"] = now
    return data


def extract_pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    pages: list[str] = []
    for page in reader.pages:
        pages.append(page.extract_text())
    return normalize_text("\n\n".join(pages))


# import re
# import uuid
# from datetime import datetime
# from io import BytesIO
# from pypdf import PdfReader

# MONTHS = {
#     "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
#     "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
# }


# def normalize_text(raw: str) -> str:
#     text = raw
#     text = text.replace("\r\n", "\n").replace("\r", "\n")
#     text = text.replace("\t", " ")
#     text = re.sub(r" {2,}", " ", text)
#     text = re.sub(r"\n{3,}", "\n\n", text)
#     text = re.sub(r"[\u200b-\u200d\ufeff]", "", text)
#     text = re.sub(r"\s*:\s*", ": ", text)
#     text = re.sub(r"\s+,", ",", text)
#     text = re.sub(r"\s+\.", ".", text)
#     lines = [line.strip() for line in text.split("\n")]
#     text = "\n".join(lines).strip()
#     return text


# def clean_number(value: str | None) -> float | None:
#     if not value:
#         return None
#     try:
#         return float(value.replace(",", "").strip())
#     except ValueError:
#         return None


# def parse_date(value: str | None):
#     if not value:
#         return None
#     match = re.search(r"(\d{2})-([A-Z]{3})-(\d{4})", value)
#     if not match:
#         return None
#     day, mon, year = match.groups()
#     month_num = MONTHS.get(mon.upper())
#     if month_num is None:
#         return None
#     return datetime(int(year), month_num, int(day))


# def first_match(text: str, pattern: str) -> str | None:
#     match = re.search(pattern, text, re.IGNORECASE)
#     return match.group(1).strip() if match else None


# def section(text: str, start_marker: str, end_marker: str) -> str:
#     start_idx = text.find(start_marker)
#     if start_idx == -1:
#         return ""
#     end_idx = text.find(end_marker, start_idx + len(start_marker))
#     if end_idx == -1:
#         return text[start_idx:]
#     return text[start_idx:end_idx].strip()


# def pick(text: str, label: str) -> str | None:
#     match = re.search(
#         re.escape(label) + r"\s*:?\s*(.+?)(?:\n|$)",
#         text,
#         re.IGNORECASE,
#     )
#     return match.group(1).strip() if match else None


# def amount(text: str, label: str) -> float | None:
#     r = re.compile(re.escape(label) + r"\s+(-?[0-9.]+)", re.IGNORECASE)
#     match = r.search(text)
#     return clean_number(match.group(1)) if match else None


# def parse_header(text: str) -> dict:
#     header = section(text, "Electricity Bill", "Table 1")
#     return {
#         "accountNumber": pick(header, "Account No"),
#         "billNumber": pick(header, "Bill No"),
#         "billMonth": pick(header, "Bill Month"),
#         "billDate": parse_date(pick(header, "Bill Date")),
#         "dueDate": parse_date(pick(header, "Due Date")),
#         "consumerName": pick(header, "Name"),
#         "fatherName": pick(header, "Father"),
#         "meterNumber": pick(header, "Meter Number"),
#         "category": pick(header, "Category"),
#         "connectionType": pick(header, "Connection Type"),
#         "supplyType": pick(header, "Supply Type"),
#         "powerFactor": clean_number(pick(header, "Power Factor")),
#         "sanctionedLoad": clean_number(pick(header, "Sanction Load")),
#         "billedDemand": clean_number(pick(header, "Billed Demand")),
#     }


# def parse_charges(text: str) -> dict:
#     c = section(text, "Table 1", "Table 2")
#     return {
#         "energyCharges": amount(c, "Energy Charges"),
#         "demandCharges": amount(c, "Demand Charges"),
#         "electricityDuty": amount(c, "Electricity Duty"),
#         "currentBill": amount(c, "Current Bill Amount"),
#         "previousDue": amount(c, "Arrear Amount"),
#         "payableAmount": amount(c, "Payable Amount"),
#         "fppa": amount(c, "FPPA Surcharge"),
#         "otherCharges": amount(c, "Other Charges"),
#     }


# def parse_meter(text: str) -> dict:
#     m = section(text, "Table 7", "Complaint")
#     kwh = re.search(r"KWH.*?([0-9.]+).*?([0-9.]+).*?([0-9.]+)", m, re.DOTALL)
#     kvah = re.search(r"KVAH.*?([0-9.]+).*?([0-9.]+).*?([0-9.]+)", m, re.DOTALL)
#     return {
#         "previousReading": clean_number(kwh.group(1) if kwh else None),
#         "currentReading": clean_number(kwh.group(2) if kwh else None),
#         "consumption": clean_number(kwh.group(3) if kwh else None),
#         "previousKVAH": clean_number(kvah.group(1) if kvah else None),
#         "currentKVAH": clean_number(kvah.group(2) if kvah else None),
#         "kvaConsumption": clean_number(kvah.group(3) if kvah else None),
#     }


# def parse_solar(text: str) -> dict:
#     export = re.search(r"KWHE.*?([0-9]+)\s+1\s+[0-9]+\s+KWHE", text, re.DOTALL)
#     return {
#         "openingSolarBalance": clean_number(first_match(text, r"Opening Surplus Solar Units\s*([0-9.]+)")),
#         "closingSolarBalance": clean_number(first_match(text, r"Closing Surplus Solar Units\s*([0-9.]+)")),
#         "solarExport": clean_number(export.group(1) if export else None),
#     }


# def parse_payment(text: str) -> dict:
#     p = section(text, "Table 5", "Table 6")
#     return {
#         "paymentDate": parse_date(first_match(p, r"([0-9]{2}-[A-Z]{3}-[0-9]{4})")),
#         "paymentAmount": clean_number(first_match(p, r"\d{2}-[A-Z]{3}-\d{4}\s+([0-9.]+)")),
#         "paymentMode": first_match(p, r"payment via ([A-Za-z ]+)"),
#         "receiptNumber": first_match(p, r"([0-9]{12,})"),
#     }


# def validate_bill(bill: dict) -> list[str]:
#     errors: list[str] = []
#     prev = bill.get("previousReading")
#     curr = bill.get("currentReading")
#     cons = bill.get("consumption")
#     if prev is not None and curr is not None and cons is not None:
#         if abs((curr - prev) - cons) > 0.02:
#             errors.append("Consumption calculation mismatch")
#     if not bill.get("accountNumber"):
#         errors.append("Account number not found")
#     if not bill.get("billNumber"):
#         errors.append("Bill number not found")
#     if not bill.get("billMonth"):
#         errors.append("Bill month not found")
#     if not bill.get("meterNumber"):
#         errors.append("Meter number not found")
#     if bill.get("currentBill") is None:
#         errors.append("Current bill amount not found")
#     if bill.get("payableAmount") is None:
#         errors.append("Payable amount not found")
#     return errors


# def parse_bill(text: str) -> dict:
#     bill = {}
#     bill.update(parse_header(text))
#     bill.update(parse_charges(text))
#     bill.update(parse_meter(text))
#     bill.update(parse_solar(text))
#     bill.update(parse_payment(text))
#     bill["rawText"] = text
#     bill["validationErrors"] = validate_bill(bill)
#     if bill["validationErrors"]:
#         print("Bill validation failed:")
#         for err in bill["validationErrors"]:
#             print(f"  - {err}")
#     return bill


# def make_bill_data(bill: dict) -> dict:
#     data = {}
#     for key in [
#         "accountNumber", "billNumber", "consumerName", "fatherName",
#         "address", "division", "subdivision", "category", "connectionType",
#         "supplyType", "meterNumber", "billMonth",
#     ]:
#         data[key] = bill.get(key)

#     for key in [
#         "sanctionedLoad", "billedDemand", "securityDeposit",
#         "previousReading", "currentReading", "consumption",
#         "previousKVAH", "currentKVAH", "kvaConsumption", "powerFactor",
#         "solarExport", "openingSolarBalance", "closingSolarBalance",
#         "previousDue", "currentBill", "payableAmount",
#         "energyCharges", "demandCharges", "electricityDuty", "fppa",
#         "minimumCharges", "excessDemandPenalty", "otherCharges",
#         "subsidy", "arrears", "credit", "debit", "rebate",
#         "meterCharges", "dueSecurity", "paymentAmount",
#     ]:
#         data[key] = bill.get(key)

#     for key in ["billDate", "dueDate", "disconnectionDate", "billingStart", "billingEnd", "connectionDate", "paymentDate"]:
#         val = bill.get(key)
#         data[key] = parse_date(val) if isinstance(val, str) and val else val

#     data["paymentMode"] = bill.get("paymentMode")
#     data["receiptNumber"] = bill.get("receiptNumber")
#     data["rawText"] = bill.get("rawText", "")
#     data["accountNumber"] = data["accountNumber"] or ""
#     data["billNumber"] = data["billNumber"] or str(uuid.uuid4())
#     data["billMonth"] = data["billMonth"] or ""
#     data["id"] = str(uuid.uuid4())[:24]
#     now = datetime.utcnow()
#     data["uploadedAt"] = now
#     data["createdAt"] = now
#     data["updatedAt"] = now
#     return data


# def extract_pdf_text(pdf_bytes: bytes) -> str:
#     reader = PdfReader(BytesIO(pdf_bytes))
#     pages: list[str] = []
#     for page in reader.pages:
#         pages.append(page.extract_text())
#     return normalize_text("\n\n".join(pages))
